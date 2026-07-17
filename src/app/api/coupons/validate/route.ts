export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { code, cartItems } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Please enter a coupon code.' }, { status: 400 });
    }

    // 1. Check coupon existence and status
    const coupon = queryOne(`SELECT * FROM coupons WHERE code = ?`, [code.toUpperCase()]);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon code not found.' }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is inactive.' }, { status: 400 });
    }

    // 2. Validate Active Window
    const now = new Date();
    if (coupon.active_from && new Date(coupon.active_from) > now) {
      return NextResponse.json({ error: 'This coupon is not active yet.' }, { status: 400 });
    }
    if (coupon.active_to && new Date(coupon.active_to) < now) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    // 3. Private coupon cap validation
    if (coupon.type === 'private') {
      if (coupon.redeemed_count >= coupon.max_redemptions) {
        return NextResponse.json({ error: 'This VIP private coupon has reached its maximum redemptions.' }, { status: 400 });
      }
    }

    // 4. Per-account limit check
    const priorRedemptions = queryOne(
      `SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?`,
      [coupon.id, user.userId]
    )?.count || 0;

    if (priorRedemptions >= coupon.per_account_limit) {
      return NextResponse.json({
        error: `You have already redeemed this coupon the maximum allowed times (${coupon.per_account_limit}).`
      }, { status: 400 });
    }

    // 5. Scoping Check (sub-public / product or category specific coupons)
    let applicableItems = cartItems || [];
    if (applicableItems.length === 0) {
      // If no cart items passed, load from user's server-side cart
      applicableItems = query(
        `SELECT c.product_id, c.quantity, p.price, p.category_id
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [user.userId]
      );
    }

    if (applicableItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty. Cannot apply coupon.' }, { status: 400 });
    }

    let discountTotal = 0;
    let qualifyingTotal = 0;

    if (coupon.type === 'public_sub') {
      // Product or Category Scoped
      let isEligible = false;
      for (const item of applicableItems) {
        let matches = false;
        if (coupon.product_id && item.product_id === coupon.product_id) {
          matches = true;
        }
        if (coupon.category_id && item.category_id === coupon.category_id) {
          matches = true;
        }

        if (matches) {
          isEligible = true;
          qualifyingTotal += (item.price * item.quantity);
        }
      }

      if (!isEligible) {
        return NextResponse.json({ error: 'This coupon is not applicable to any items in your cart.' }, { status: 400 });
      }

      if (coupon.discount_type === 'percent') {
        discountTotal = qualifyingTotal * (coupon.discount_value / 100);
      } else {
        discountTotal = Math.min(coupon.discount_value, qualifyingTotal);
      }
    } else {
      // Pro-public or Private (Site-wide)
      const cartTotal = applicableItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      if (coupon.discount_type === 'percent') {
        discountTotal = cartTotal * (coupon.discount_value / 100);
      } else {
        discountTotal = Math.min(coupon.discount_value, cartTotal);
      }
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      coupon_id: coupon.id,
      discount_value: coupon.discount_value,
      discount_type: coupon.discount_type,
      discount_amount: Math.round(discountTotal * 100) / 100,
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
