export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: load career applications (staff clearance)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const applications = query(`SELECT * FROM career_applications ORDER BY id DESC`);
    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Fetch careers error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// POST: submit a job application (public endpoint!)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role_interest, resume_link, cover_letter } = body;

    if (!name || !email || !role_interest) {
      return NextResponse.json({ error: 'Name, email, and role interest are required.' }, { status: 400 });
    }

    query(
      `INSERT INTO career_applications (name, email, phone, role_interest, resume_link, cover_letter, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [name, email, phone || null, role_interest, resume_link || null, cover_letter || null]
    );

    // Fetch newly created application id
    const newApp = queryOne(`SELECT id FROM career_applications WHERE email = ? ORDER BY id DESC LIMIT 1`, [email]);

    // Send notification to all admin users
    const admins = query(`SELECT id FROM users WHERE role = 'Admin'`);
    for (const admin of admins) {
      query(
        `INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          admin.id,
          'New Career Application',
          `New job application submitted by ${name} for role: "${role_interest}".`,
          'career',
        ]
      );
    }

    return NextResponse.json({ message: 'Career application submitted successfully.', applicationId: newApp?.id });
  } catch (error) {
    console.error('Submit career error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update application status, or convert applicant into staff account
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, convertToEmployee, employeeRole, employeePassword } = body;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    const app = queryOne(`SELECT * FROM career_applications WHERE id = ?`, [parseInt(id)]);
    if (!app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const updatedStatus = status || app.status;

    if (convertToEmployee) {
      if (user.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admins can convert applicants to employee accounts.' }, { status: 403 });
      }

      if (!employeeRole || !employeePassword) {
        return NextResponse.json({ error: 'Role and temporary password are required to create staff accounts.' }, { status: 400 });
      }

      // Check if email already registered in users
      const existingUser = queryOne(`SELECT id FROM users WHERE email = ?`, [app.email]);
      if (existingUser) {
        return NextResponse.json({ error: 'A user account with this email is already registered.' }, { status: 400 });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(employeePassword, salt);

      // Default permissions based on role
      let permissions = '[]';
      if (employeeRole === 'Sub-admin') {
        permissions = JSON.stringify(['view_users', 'update_users', 'view_orders', 'update_orders', 'view_products', 'update_products', 'view_coupons', 'view_chat', 'view_notifications', 'view_settings']);
      } else if (employeeRole === 'Manager' || employeeRole === 'Employee') {
        permissions = JSON.stringify(['view_orders', 'update_orders_shipping', 'update_products_stock', 'update_products_position']);
      } else if (employeeRole === 'Customer Care') {
        permissions = JSON.stringify(['view_users', 'view_orders', 'view_chat', 'send_chat_reply']);
      }

      // Insert employee account in users
      query(
        `INSERT INTO users (email, password, name, phone, role, permissions) VALUES (?, ?, ?, ?, ?, ?)`,
        [app.email, hashedPassword, app.name, app.phone, employeeRole, permissions]
      );

      const newEmployee = queryOne(`SELECT id FROM users WHERE email = ?`, [app.email]);

      // Update career application to Approved
      query(`UPDATE career_applications SET status = 'Approved' WHERE id = ?`, [id]);

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Convert Employee',
        `Approved application #${id} and created employee account for ${app.name} (${app.email}) with role: ${employeeRole}`,
      ]);

      return NextResponse.json({
        message: 'Applicant successfully approved and converted into staff account.',
        employeeId: newEmployee?.id,
        role: employeeRole,
      });
    }

    // Standard status update
    query(`UPDATE career_applications SET status = ? WHERE id = ?`, [updatedStatus, id]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Career Application',
      `Updated application #${id} status to "${updatedStatus}"`,
    ]);

    return NextResponse.json({ message: 'Career application updated successfully.' });
  } catch (error) {
    console.error('Update career error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// DELETE: permanently remove career application
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins can delete applications.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    query(`DELETE FROM career_applications WHERE id = ?`, [parseInt(id)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Delete Career Application',
      `Super admin permanently deleted career application ID #${id}`,
    ]);

    return NextResponse.json({ message: 'Career application deleted successfully.' });
  } catch (error) {
    console.error('Delete career error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
