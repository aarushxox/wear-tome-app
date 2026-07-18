export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      // Fetch details of a single order
      let orderSql = `SELECT * FROM orders WHERE id = ?`;
      let params = [parseInt(orderId)];

      if (user.role === 'Customer') {
        orderSql += ` AND user_id = ?`;
        params.push(user.userId);
      }

      const order = queryOne(orderSql, params);
      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      // Fetch items of the order
      const items = query(
        `SELECT oi.*, p.name, p.slug, p.price as base_price
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      // Fetch primary image per item
      const itemsWithImages = items.map((item: any) => {
        const image = queryOne(
          `SELECT filepath FROM mediafile WHERE entity_type = 'product' AND entity_id = ? AND is_primary = 1 LIMIT 1`,
          [item.product_id]
        )?.filepath || '/images/placeholder.webp';
        return { ...item, image };
      });

      return NextResponse.json({ order, items: itemsWithImages });
    } else {
      // List orders
      let ordersSql = `SELECT o.*, u.name as customer_name, u.email as customer_email
                       FROM orders o
                       JOIN users u ON o.user_id = u.id`;
      let params: any[] = [];

      if (user.role === 'Customer') {
        ordersSql += ` WHERE o.user_id = ?`;
        params.push(user.userId);
      }

      ordersSql += ` ORDER BY o.id DESC`;
      const orders = query(ordersSql, params);

      return NextResponse.json({ orders });
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { shipping_address, coupon_code } = await req.json();
    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required.' }, { status: 400 });
    }

    // 1. Fetch user cart
    const cartItems = query(
      `SELECT c.id as cart_id, c.product_id, c.quantity, c.size, c.color,
              p.name, p.price, p.stock, p.category_id, p.discount_percent,
              p.discount_active_from, p.discount_active_to
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [user.userId]
    );

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    // 2. Validate product stock
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for product ${item.name}. Available: ${item.stock}, Requested: ${item.quantity}.`
        }, { status: 400 });
      }
    }

    // 3. Compute baseline subtotal, respecting product-level active discounts
    let subtotal = 0;
    const computedItems = cartItems.map((item: any) => {
      let finalPrice = item.price;
      if (item.discount_percent > 0) {
        const now = new Date();
        const start = item.discount_active_from ? new Date(item.discount_active_from) : null;
        const end = item.discount_active_to ? new Date(item.discount_active_to) : null;
        if ((!start || now >= start) && (!end || now <= end)) {
          finalPrice = item.price * (1 - item.discount_percent / 100);
        }
      }
      subtotal += finalPrice * item.quantity;
      return { ...item, calculatedPrice: finalPrice };
    });

    // 4. Handle Coupon Validation and discount deduction
    let discountApplied = 0;
    let coupon = null;

    if (coupon_code) {
      coupon = queryOne(`SELECT * FROM coupons WHERE code = ?`, [coupon_code.toUpperCase()]);
      if (coupon && coupon.is_active) {
        // Run coupon validation limits
        const now = new Date();
        const activeFromOk = !coupon.active_from || new Date(coupon.active_from) <= now;
        const activeToOk = !coupon.active_to || new Date(coupon.active_to) >= now;
        const privateCapOk = coupon.type !== 'private' || coupon.redeemed_count < coupon.max_redemptions;

        const redemptionsCount = queryOne(
          `SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?`,
          [coupon.id, user.userId]
        )?.count || 0;
        const userLimitOk = redemptionsCount < coupon.per_account_limit;

        if (activeFromOk && activeToOk && privateCapOk && userLimitOk) {
          // Calculate coupon discount
          if (coupon.type === 'public_sub') {
            // Product-scoped
            let qualifyingTotal = 0;
            for (const item of computedItems) {
              if (coupon.product_id === item.product_id || coupon.category_id === item.category_id) {
                qualifyingTotal += item.calculatedPrice * item.quantity;
              }
            }
            if (qualifyingTotal > 0) {
              if (coupon.discount_type === 'percent') {
                discountApplied = qualifyingTotal * (coupon.discount_value / 100);
              } else {
                discountApplied = Math.min(coupon.discount_value, qualifyingTotal);
              }
            }
          } else {
            // General site-wide coupon
            if (coupon.discount_type === 'percent') {
              discountApplied = subtotal * (coupon.discount_value / 100);
            } else {
              discountApplied = Math.min(coupon.discount_value, subtotal);
            }
          }
        }
      }
    }

    const totalPrice = Math.max(0, subtotal - discountApplied);
    const paymentRef = 'WT-' + Math.floor(100000 + Math.random() * 900000);

    // 5. Create Order row
    query(
      `INSERT INTO orders (user_id, total_price, discount_applied, coupon_code, status, shipping_address, payment_ref, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        Math.round(totalPrice * 100) / 100,
        Math.round(discountApplied * 100) / 100,
        coupon ? coupon.code : null,
        'Pending',
        shipping_address,
        paymentRef,
        'Paid', // Simulate instantly successful payment as required
      ]
    );

    // Fetch newly created order id
    const newOrder = queryOne(`SELECT id FROM orders WHERE payment_ref = ? ORDER BY id DESC LIMIT 1`, [paymentRef]);
    const orderId = newOrder.id;

    // 6. Create order_items and decrement product stocks
    for (const item of computedItems) {
      query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, color, size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.calculatedPrice, item.color, item.size]
      );

      // Decrement stock
      const newStock = Math.max(0, item.stock - item.quantity);
      query(`UPDATE products SET stock = ? WHERE id = ?`, [newStock, item.product_id]);

      // Trigger low stock alert if needed
      if (newStock <= 3) {
        // Send alert to all admin users
        const admins = query(`SELECT id FROM users WHERE role = 'Admin'`);
        for (const admin of admins) {
          query(
            `INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
            [
              admin.id,
              'Low Stock Warning',
              `Product "${item.name}" stock is critical: only ${newStock} units remaining!`,
              'low_stock',
            ]
          );
        }
      }
    }

    // 7. Write coupon redemption logs if applicable
    if (coupon && discountApplied > 0) {
      query(
        `INSERT INTO coupon_redemptions (coupon_id, user_id, order_id) VALUES (?, ?, ?)`,
        [coupon.id, user.userId, orderId]
      );
      query(
        `UPDATE coupons SET redeemed_count = redeemed_count + 1 WHERE id = ?`,
        [coupon.id]
      );
    }

    // 8. Clear user cart
    query(`DELETE FROM cart WHERE user_id = ?`, [user.userId]);

    // 9. Fire unread bell notifications
    // Customer notification
    query(
      `INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [
        user.userId,
        'Order Placed Successfully',
        `Your Wear Tome order #${orderId} of ₹${Math.round(totalPrice)} has been received and is now pending processing.`,
        'order_status',
      ]
    );

    // Admin notification
    const admins = query(`SELECT id FROM users WHERE role = 'Admin'`);
    for (const admin of admins) {
      query(
        `INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          admin.id,
          'New Order Received',
          `Order #${orderId} totaling ₹${Math.round(totalPrice)} was submitted by ${user.name}.`,
          'order_status',
        ]
      );
    }

    // 10. Log in activitylog
    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Place Order',
      `Placed order #${orderId} with total: ₹${totalPrice}, payment ref: ${paymentRef}`,
    ]);

    return NextResponse.json({
      message: 'Order checked out and simulated payment approved.',
      orderId,
      paymentRef,
      totalPrice,
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
