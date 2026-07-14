import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Join cart with products to return full item details
    const items = query(
      `SELECT c.id, c.product_id, c.quantity, c.size, c.color,
              p.name, p.price, p.stock, p.slug, p.discount_percent,
              p.discount_active_from, p.discount_active_to
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [user.userId]
    );

    // Map items to include their primary image and active discount calculated price
    const mappedItems = items.map((item: any) => {
      const primaryImage = queryOne(
        `SELECT filepath FROM mediafile WHERE entity_type = 'product' AND entity_id = ? AND is_primary = 1 LIMIT 1`,
        [item.product_id]
      )?.filepath || '/images/placeholder.webp';

      // Server-side discount pricing calculation
      let finalPrice = item.price;
      let hasActiveDiscount = false;
      if (item.discount_percent > 0) {
        const now = new Date();
        const start = item.discount_active_from ? new Date(item.discount_active_from) : null;
        const end = item.discount_active_to ? new Date(item.discount_active_to) : null;
        if ((!start || now >= start) && (!end || now <= end)) {
          finalPrice = item.price * (1 - item.discount_percent / 100);
          hasActiveDiscount = true;
        }
      }

      return {
        ...item,
        primaryImage,
        originalPrice: item.price,
        price: finalPrice,
        discounted: hasActiveDiscount,
      };
    });

    return NextResponse.json({ items: mappedItems });
  } catch (error) {
    console.error('Get Cart API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { product_id, quantity, size, color } = await req.json();
    if (!product_id || !quantity) {
      return NextResponse.json({ error: 'product_id and quantity are required.' }, { status: 400 });
    }

    // Check product stock
    const product = queryOne(`SELECT stock, name FROM products WHERE id = ?`, [product_id]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Only ${product.stock} units of ${product.name} left in stock.` }, { status: 400 });
    }

    // Check if item already exists in cart with same size/color
    const existing = queryOne(
      `SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?`,
      [user.userId, product_id, size || 'One Size', color || 'Default']
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) {
        return NextResponse.json({ error: `Cannot add more. Maximum available stock is ${product.stock}.` }, { status: 400 });
      }
      query(`UPDATE cart SET quantity = ? WHERE id = ?`, [newQty, existing.id]);
    } else {
      query(
        `INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)`,
        [user.userId, product_id, quantity, size || 'One Size', color || 'Default']
      );
    }

    return NextResponse.json({ message: 'Product added to server-side cart successfully.' });
  } catch (error) {
    console.error('Post Cart API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id, quantity } = await req.json();
    if (!id || quantity === undefined) {
      return NextResponse.json({ error: 'id and quantity are required.' }, { status: 400 });
    }

    if (quantity <= 0) {
      query(`DELETE FROM cart WHERE id = ? AND user_id = ?`, [id, user.userId]);
      return NextResponse.json({ message: 'Item removed from cart.' });
    }

    // Check product stock
    const cartItem = queryOne(`SELECT product_id FROM cart WHERE id = ? AND user_id = ?`, [id, user.userId]);
    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found.' }, { status: 404 });
    }

    const product = queryOne(`SELECT stock, name FROM products WHERE id = ?`, [cartItem.product_id]);
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Only ${product.stock} units of ${product.name} are available.` }, { status: 400 });
    }

    query(`UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?`, [quantity, id, user.userId]);
    return NextResponse.json({ message: 'Cart updated.' });
  } catch (error) {
    console.error('Put Cart API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (itemId) {
      query(`DELETE FROM cart WHERE id = ? AND user_id = ?`, [parseInt(itemId), user.userId]);
      return NextResponse.json({ message: 'Item deleted.' });
    } else {
      query(`DELETE FROM cart WHERE user_id = ?`, [user.userId]);
      return NextResponse.json({ message: 'Cart cleared successfully.' });
    }
  } catch (error) {
    console.error('Delete Cart API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
