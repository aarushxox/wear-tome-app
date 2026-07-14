import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const notifications = query(
      `SELECT * FROM notification WHERE user_id = ? ORDER BY id DESC`,
      [user.userId]
    );

    const unreadCount = queryOne(
      `SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = 0`,
      [user.userId]
    )?.count || 0;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, markAll } = body;

    if (markAll) {
      query(`UPDATE notification SET is_read = 1 WHERE user_id = ?`, [user.userId]);
    } else if (id) {
      query(`UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, user.userId]);
    } else {
      return NextResponse.json({ error: 'Either notification id or markAll is required.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Notifications marked as read successfully.' });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
