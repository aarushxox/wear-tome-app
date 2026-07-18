export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const tokenUser = getAuthenticatedUser(req);
    if (!tokenUser) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Fetch fresh user record from DB to get changes in role/permissions/suspension/etc.
    const user = queryOne(`SELECT * FROM users WHERE id = ?`, [tokenUser.userId]);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    if (user.is_suspended) {
      // Clear cookie and return suspended
      const response = NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
      response.cookies.set('token', '', { expires: new Date(0), path: '/' });
      return response;
    }

    // Fetch unread notification counts
    const unreadNotifications = queryOne(
      `SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = 0`,
      [user.id]
    )?.count || 0;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || '[]'),
        promotion_tier: user.promotion_tier,
        gender: user.gender,
        how_found: user.how_found,
        style_pref: user.style_pref,
        category_pref: user.category_pref,
      },
      unreadNotificationsCount: unreadNotifications,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
