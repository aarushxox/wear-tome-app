import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, query } from '@/lib/db';
import { signAccessToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Please fill in all fields.' }, { status: 400 });
    }

    // Check if user exists
    const existing = queryOne(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user in users table
    query(`INSERT INTO users (email, password, name, role, permissions) VALUES (?, ?, ?, ?, ?)`, [
      email,
      passwordHash,
      name,
      'Customer',
      JSON.stringify(['customer']),
    ]);

    const user = queryOne(`SELECT * FROM users WHERE email = ?`, [email]);

    // Send instant welcome notification
    query(`INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`, [
      user.id,
      'Welcome to Wear Tome',
      'Thank you for joining our luxury minimalist streetwear universe. Enjoy 10% off your first purchase with coupon WELCOME10.',
      'account_notice',
    ]);

    // Write activity log
    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.id,
      'User Registration',
      `New user account registered.`,
    ]);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = signAccessToken(payload);

    const response = NextResponse.json({
      message: 'Registration successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: ['customer'],
        promotion_tier: 'Standard',
      },
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
