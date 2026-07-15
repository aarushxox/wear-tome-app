import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: load all coupons (staff clearance)
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const coupons = query(`SELECT * FROM coupons ORDER BY id DESC`);
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// POST: create a coupon (Admin / Sub-admin only)
export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to build coupons.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      code, type, discount_value, discount_type, max_redemptions,
      active_from, active_to, product_id, category_id, per_account_limit
    } = body;

    if (!code || !type || discount_value === undefined) {
      return NextResponse.json({ error: 'Code, type, and discount value are required.' }, { status: 400 });
    }

    const uppercaseCode = code.toUpperCase();

    // Check uniqueness
    const existing = queryOne(`SELECT id FROM coupons WHERE code = ?`, [uppercaseCode]);
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });
    }

    query(
      `INSERT INTO coupons (
        code, type, discount_value, discount_type, max_redemptions,
        active_from, active_to, product_id, category_id, per_account_limit, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        uppercaseCode,
        type,
        parseFloat(discount_value),
        discount_type || 'percent',
        max_redemptions !== undefined ? parseInt(max_redemptions) : 9999,
        active_from || null,
        active_to || null,
        product_id ? parseInt(product_id) : null,
        category_id ? parseInt(category_id) : null,
        per_account_limit !== undefined ? parseInt(per_account_limit) : 1
      ]
    );

    const newCoupon = queryOne(`SELECT * FROM coupons WHERE code = ?`, [uppercaseCode]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Create Coupon',
      `Created coupon "${uppercaseCode}" (Type: ${type}, Value: ${discount_value})`,
    ]);

    // Send a notification to customers or log
    return NextResponse.json({ message: 'Coupon registered successfully.', coupon: newCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: toggle active state / update coupon
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
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const coupon = queryOne(`SELECT * FROM coupons WHERE id = ?`, [parseInt(id)]);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : coupon.is_active;

    query(`UPDATE coupons SET is_active = ? WHERE id = ?`, [updatedActive, id]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Toggle Coupon',
      `Toggled coupon "${coupon.code}" active status to ${updatedActive}`,
    ]);

    return NextResponse.json({ message: 'Coupon updated successfully.' });
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// DELETE: permanently delete a coupon
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins can delete coupons.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const coupon = queryOne(`SELECT code FROM coupons WHERE id = ?`, [parseInt(id)]);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    query(`DELETE FROM coupons WHERE id = ?`, [parseInt(id)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Delete Coupon',
      `Super admin permanently deleted coupon "${coupon.code}"`,
    ]);

    return NextResponse.json({ message: `Coupon "${coupon.code}" deleted successfully.` });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
