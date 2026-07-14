import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId'); // specific customer to chat with (admin side)

    if (user.role === 'Customer') {
      // Return entire message history with support (support sender_id/receiver_id is null or an admin)
      // For simplicity, support messages either have receiver_id = customer, or sender_id = customer
      const messages = query(
        `SELECT m.*, u.name as sender_name
         FROM message m
         JOIN users u ON m.sender_id = u.id
         WHERE m.sender_id = ? OR m.receiver_id = ?
         ORDER BY m.id ASC`,
        [user.userId, user.userId]
      );
      return NextResponse.json({ messages });
    } else {
      // Admin / Staff side
      if (partnerId) {
        // Fetch specific conversation with this user
        const messages = query(
          `SELECT m.*, u.name as sender_name
           FROM message m
           JOIN users u ON m.sender_id = u.id
           WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
           ORDER BY m.id ASC`,
          [parseInt(partnerId), user.userId, user.userId, parseInt(partnerId)]
        );

        // Mark them as read on load
        query(`UPDATE message SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?`, [parseInt(partnerId), user.userId]);

        return NextResponse.json({ messages });
      } else {
        // Return list of active conversations (threads) for the admin dashboard
        // Group by user who is not staff
        const threads = query(`
          SELECT DISTINCT u.id as customer_id, u.name as customer_name, u.email as customer_email,
                 (SELECT content FROM message WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY id DESC LIMIT 1) as last_message,
                 (SELECT created_at FROM message WHERE (sender_id = u.id OR receiver_id = u.id) ORDER BY id DESC LIMIT 1) as last_message_time,
                 (SELECT COUNT(*) FROM message WHERE sender_id = u.id AND receiver_id IS NULL AND is_read = 0) as unread_count
          FROM users u
          WHERE u.role = 'Customer' AND EXISTS (
            SELECT 1 FROM message WHERE sender_id = u.id OR receiver_id = u.id
          )
          ORDER BY last_message_time DESC
        `);

        return NextResponse.json({ threads });
      }
    }
  } catch (error) {
    console.error('Fetch chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { content, receiver_id } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    let targetReceiver = receiver_id ? parseInt(receiver_id) : null;

    if (user.role === 'Customer') {
      // Customers send messages to customer support (represented by system/admins)
      // We will insert receiver_id = null (meaning global support) or direct to first admin
      const primaryAdmin = queryOne(`SELECT id FROM users WHERE role = 'Admin' ORDER BY id ASC LIMIT 1`);
      targetReceiver = primaryAdmin ? primaryAdmin.id : null;

      query(`INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)`, [
        user.userId,
        targetReceiver,
        content,
      ]);

      // Create notification alert for the Admin
      if (targetReceiver) {
        query(`INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`, [
          targetReceiver,
          'New Chat Message',
          `Jane Doe has sent a support query: "${content.substring(0, 30)}..."`,
          'chat',
        ]);
      }
    } else {
      // Staff sending message to customer
      if (!targetReceiver) {
        return NextResponse.json({ error: 'Customer receiver_id is required for staff replies.' }, { status: 400 });
      }

      query(`INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)`, [
        user.userId,
        targetReceiver,
        content,
      ]);

      // Create notification alert for customer
      query(`INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`, [
        targetReceiver,
        'Support Replied',
        `Customer Care has responded: "${content.substring(0, 30)}..."`,
        'chat',
      ]);
    }

    return NextResponse.json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Send chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
