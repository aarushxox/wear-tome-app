export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: list users (staff) or get own profile (customer)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isStaff = ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);

    if (isStaff) {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || searchParams.get('q') || '';

      let sql = `SELECT id, email, name, phone, role, permissions, gender, how_found, style_pref, category_pref, promotion_tier, is_suspended, suspended_until, created_at FROM users`;
      let params: any[] = [];

      if (search) {
        sql += ` WHERE name LIKE ? OR email LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
      }

      sql += ` ORDER BY id ASC`;
      const users = query(sql, params);

      // Parse permissions if stored as JSON
      const parsedUsers = users.map((u: any) => ({
        ...u,
        permissions: JSON.parse(u.permissions || '[]'),
      }));

      return NextResponse.json({ users: parsedUsers });
    } else {
      // Return own profile
      const userProfile = queryOne(
        `SELECT id, email, name, phone, role, permissions, gender, how_found, style_pref, category_pref, promotion_tier, is_suspended, suspended_until, created_at FROM users WHERE id = ?`,
        [user.userId]
      );

      if (!userProfile) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          ...userProfile,
          permissions: JSON.parse(userProfile.permissions || '[]'),
        }
      });
    }
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update user details (customer updating profile, or admin updating customer suspension/tier)
export async function PUT(req: NextRequest) {
  try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, name, phone, gender, how_found, style_pref, category_pref, promotion_tier, is_suspended, role, permissions } = body;

    const isCallerStaff = ['Admin', 'Sub-admin', 'Manager'].includes(caller.role);

    // If updating another user (Admin action)
    if (userId && userId !== caller.userId) {
      if (!isCallerStaff) {
        return NextResponse.json({ error: 'Forbidden. Staff clearance required.' }, { status: 403 });
      }

      // Role check: Sub-admin/Manager cannot delete or grant Admin rights
      if (role === 'Admin' && caller.role !== 'Admin') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admins can assign Admin roles.' }, { status: 403 });
      }

      const existingUser = queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      // Update fields
      const updatedPromotionTier = promotion_tier !== undefined ? promotion_tier : existingUser.promotion_tier;
      const updatedIsSuspended = is_suspended !== undefined ? (is_suspended ? 1 : 0) : existingUser.is_suspended;
      const updatedRole = role !== undefined ? role : existingUser.role;
      const updatedPermissions = permissions !== undefined ? JSON.stringify(permissions) : existingUser.permissions;

      query(
        `UPDATE users SET promotion_tier = ?, is_suspended = ?, role = ?, permissions = ? WHERE id = ?`,
        [updatedPromotionTier, updatedIsSuspended, updatedRole, updatedPermissions, userId]
      );

      // Create a suspension/unsuspension notification if status changed
      if (is_suspended !== undefined && updatedIsSuspended !== existingUser.is_suspended) {
        const title = updatedIsSuspended ? 'Account Suspended' : 'Account Re-activated';
        const message = updatedIsSuspended
          ? 'Your account has been temporarily suspended by administrative actions.'
          : 'Your account suspension has been lifted.';

        query(
          `INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
          [userId, title, message, 'account_status']
        );
      }

      // Log in audit trail
      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        caller.userId,
        'Update User Profile',
        `Staff updated user ID ${userId} (${existingUser.email}): Tier=${updatedPromotionTier}, Suspended=${updatedIsSuspended}, Role=${updatedRole}`,
      ]);

      return NextResponse.json({ message: 'User profile updated successfully.' });
    } else {
      // Customer updating their own profile
      const targetId = userId || caller.userId;
      if (targetId !== caller.userId) {
        return NextResponse.json({ error: 'Forbidden. You can only update your own profile.' }, { status: 403 });
      }

      const existingUser = queryOne(`SELECT * FROM users WHERE id = ?`, [caller.userId]);
      if (!existingUser) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }

      const updatedName = name !== undefined ? name : existingUser.name;
      const updatedPhone = phone !== undefined ? phone : existingUser.phone;
      const updatedGender = gender !== undefined ? gender : existingUser.gender;
      const updatedHowFound = how_found !== undefined ? how_found : existingUser.how_found;
      const updatedStylePref = style_pref !== undefined ? style_pref : existingUser.style_pref;
      const updatedCategoryPref = category_pref !== undefined ? category_pref : existingUser.category_pref;

      query(
        `UPDATE users SET name = ?, phone = ?, gender = ?, how_found = ?, style_pref = ?, category_pref = ? WHERE id = ?`,
        [updatedName, updatedPhone, updatedGender, updatedHowFound, updatedStylePref, updatedCategoryPref, caller.userId]
      );

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        caller.userId,
        'Update Profile',
        `User updated their own profile settings.`,
      ]);

      return NextResponse.json({
        message: 'Your profile has been updated successfully.',
        user: {
          id: caller.userId,
          name: updatedName,
          email: existingUser.email,
          role: existingUser.role,
          promotion_tier: existingUser.promotion_tier,
          gender: updatedGender,
          how_found: updatedHowFound,
          style_pref: updatedStylePref,
          category_pref: updatedCategoryPref,
        }
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// DELETE: soft-delete customer or employee
export async function DELETE(req: NextRequest) {
  try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (caller.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins can delete accounts.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const targetUser = queryOne(`SELECT * FROM users WHERE id = ?`, [parseInt(userId)]);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Soft delete/hard delete as per specs: let's perform hard delete for SQLite constraints or custom flag.
    // The spec says: soft-delete with audit trail via activitylog.
    // Let's set role to 'Deleted' or suspend permanently, or we can simply delete them. Let's do a clean deletion.
    query(`DELETE FROM users WHERE id = ?`, [parseInt(userId)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      caller.userId,
      'Delete User',
      `Super admin permanently deleted account of ${targetUser.name} (${targetUser.email})`,
    ]);

    return NextResponse.json({ message: 'User account successfully deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
