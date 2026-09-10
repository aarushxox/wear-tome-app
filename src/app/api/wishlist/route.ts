import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const items = query(
      `SELECT w.id as wishlist_id, w.created_at, p.*
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [user.userId]
    );

    const formattedItems = items.map((p: any) => ({
      ...p,
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]'),
      is_trending: Boolean(p.is_trending),
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch wishlist.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { product_id } = await request.json();
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const product = queryOne(`SELECT id FROM products WHERE id = ?`, [product_id]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existing = queryOne(`SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?`, [
      user.userId,
      product_id,
    ]);

    if (!existing) {
      query(`INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)`, [user.userId, product_id]);
    }

    return NextResponse.json({ message: 'Product added to wishlist.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (productId) {
      query(`DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`, [user.userId, parseInt(productId)]);
    } else {
      query(`DELETE FROM wishlist WHERE user_id = ?`, [user.userId]);
    }

    return NextResponse.json({ message: 'Wishlist updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove from wishlist.' }, { status: 500 });
  }
}
