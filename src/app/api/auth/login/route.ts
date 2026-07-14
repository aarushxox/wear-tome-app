import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, query } from '@/lib/db';
import { signAccessToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide email and password.' }, { status: 400 });
    }

    // Try finding admin auth first
    const adminAuth = queryOne(`SELECT * FROM adminauth WHERE email = ?`, [email]);
    let user = queryOne(`SELECT * FROM users WHERE email = ?`, [email]);

    if (!user && adminAuth) {
      // If found in adminauth but not in users, auto-create in users
      query(`INSERT INTO users (email, password, name, role, permissions) VALUES (?, ?, ?, ?, ?)`, [
        email,
        adminAuth.primaryPassword,
        'Staff Administrator',
        'Admin',
        JSON.stringify(['all']),
      ]);
      user = queryOne(`SELECT * FROM users WHERE email = ?`, [email]);
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.is_suspended) {
      return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
    }

    // Compare bcrypt passwords
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = signAccessToken(payload);

    // Record login activity
    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.id,
      'User Login',
      `Successful login with role: ${user.role}`,
    ]);

    const response = NextResponse.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || '[]'),
        promotion_tier: user.promotion_tier,
      },
      token,
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
