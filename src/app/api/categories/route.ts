import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = query(`SELECT * FROM category ORDER BY name ASC`);
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || !['Admin', 'Sub-admin', 'Manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff permissions required.' }, { status: 403 });
    }

    const { name, slug } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Category name and slug are required.' }, { status: 400 });
    }

    const existing = queryOne(`SELECT id FROM category WHERE slug = ? OR name = ?`, [slug, name]);
    if (existing) {
      return NextResponse.json({ error: 'Category already exists.' }, { status: 400 });
    }

    query(`INSERT INTO category (name, slug) VALUES (?, ?)`, [name, slug]);
    const newCategory = queryOne(`SELECT * FROM category WHERE slug = ?`, [slug]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Create Category',
      `User created category "${name}" (${slug}).`,
    ]);

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required to delete.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    }

    query(`DELETE FROM category WHERE id = ?`, [parseInt(id)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Delete Category',
      `Admin deleted category ID #${id}.`,
    ]);

    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category.' }, { status: 500 });
  }
}
