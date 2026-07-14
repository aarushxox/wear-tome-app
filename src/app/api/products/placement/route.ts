import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Admins, Sub-admins, and Managers can change seating placement
    if (!['Admin', 'Sub-admin', 'Manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { placements } = await req.json();
    if (!placements || !Array.isArray(placements)) {
      return NextResponse.json({ error: 'placements array is required.' }, { status: 400 });
    }

    // Perform positional coordinate updates
    for (const item of placements) {
      const { id, grid_position } = item;
      if (id !== undefined) {
        query(`UPDATE products SET grid_position = ? WHERE id = ?`, [
          grid_position !== undefined ? grid_position : null,
          id,
        ]);
      }
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Grid Placement',
      `Updated manual grid positions for ${placements.length} products.`,
    ]);

    return NextResponse.json({ message: 'Product manual grid positions saved successfully.' });
  } catch (error) {
    console.error('Update product placement error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
