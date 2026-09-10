import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || !['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const employees = query(
      `SELECT id, name, email, role, permissions, is_suspended, created_at
       FROM users
       WHERE role != 'Customer'
       ORDER BY id ASC`
    );

    const formatted = employees.map((emp: any) => ({
      ...emp,
      permissions: JSON.parse(emp.permissions || '[]'),
    }));

    return NextResponse.json({ employees: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch employees.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin rights required to create staff.' }, { status: 403 });
    }

    const { name, email, password, role, permissions } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!['Sub-admin', 'Manager', 'Customer Care'].includes(role)) {
      return NextResponse.json({ error: 'Invalid staff role.' }, { status: 400 });
    }

    const existing = queryOne(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const permsJson = JSON.stringify(permissions || []);

    query(
      `INSERT INTO users (name, email, password, role, permissions) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, permsJson]
    );

    const newStaff = queryOne(`SELECT id, name, email, role, permissions, created_at FROM users WHERE email = ?`, [
      email,
    ]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Create Employee',
      `Admin created staff member ${name} (${email}) with role ${role}.`,
    ]);

    return NextResponse.json({ employee: newStaff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create employee.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin rights required.' }, { status: 403 });
    }

    const { id, role, permissions, is_suspended } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
    }

    if (role) {
      query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
    }

    if (permissions !== undefined) {
      query(`UPDATE users SET permissions = ? WHERE id = ?`, [JSON.stringify(permissions), id]);
    }

    if (is_suspended !== undefined) {
      query(`UPDATE users SET is_suspended = ? WHERE id = ?`, [is_suspended ? 1 : 0, id]);
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Employee',
      `Admin updated employee ID #${id}.`,
    ]);

    return NextResponse.json({ message: 'Employee updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update employee.' }, { status: 500 });
  }
}
