import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: list blogs (published-only for public, all for staff) or fetch single blog by slug
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Soft authentication check
    const user = getAuthenticatedUser(req);
    const isStaff = user && ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);

    if (slug) {
      let sql = `SELECT b.*, u.name as author_name FROM blogs b LEFT JOIN users u ON b.author_id = u.id WHERE b.slug = ?`;
      if (!isStaff) {
        sql += ` AND b.is_published = 1`;
      }
      const blog = queryOne(sql, [slug]);

      if (!blog) {
        return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
      }
      return NextResponse.json({ blog });
    } else {
      let sql = `SELECT b.*, u.name as author_name FROM blogs b LEFT JOIN users u ON b.author_id = u.id`;
      let params: any[] = [];

      if (!isStaff) {
        sql += ` WHERE b.is_published = 1`;
      }

      sql += ` ORDER BY b.id DESC`;
      const blogs = query(sql, params);

      return NextResponse.json({ blogs });
    }
  } catch (error) {
    console.error('Fetch blogs error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// POST: create a new blog post (Admin / Sub-admin only)
export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to write blog posts.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, category, is_published } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required.' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check uniqueness
    const existing = queryOne(`SELECT id FROM blogs WHERE slug = ?`, [slug]);
    if (existing) {
      return NextResponse.json({ error: 'A blog post with a similar title already exists.' }, { status: 400 });
    }

    query(
      `INSERT INTO blogs (title, slug, content, author_id, category, is_published) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, slug, content, user.userId, category, is_published ? 1 : 0]
    );

    const newBlog = queryOne(`SELECT * FROM blogs WHERE slug = ?`, [slug]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Create Blog',
      `Created blog post "${title}" (ID: ${newBlog.id})`,
    ]);

    return NextResponse.json({ message: 'Blog post created successfully.', blog: newBlog });
  } catch (error) {
    console.error('Create blog error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update an existing blog post (staff clearance)
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin', 'Manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, content, category, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required.' }, { status: 400 });
    }

    const currentBlog = queryOne(`SELECT * FROM blogs WHERE id = ?`, [parseInt(id)]);
    if (!currentBlog) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const updatedTitle = title !== undefined ? title : currentBlog.title;
    const updatedContent = content !== undefined ? content : currentBlog.content;
    const updatedCategory = category !== undefined ? category : currentBlog.category;
    const updatedIsPublished = is_published !== undefined ? (is_published ? 1 : 0) : currentBlog.is_published;

    const slug = title !== undefined
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : currentBlog.slug;

    query(
      `UPDATE blogs SET title = ?, slug = ?, content = ?, category = ?, is_published = ? WHERE id = ?`,
      [updatedTitle, slug, updatedContent, updatedCategory, updatedIsPublished, id]
    );

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Blog',
      `Updated blog post ID ${id} ("${updatedTitle}")`,
    ]);

    return NextResponse.json({ message: 'Blog post updated successfully.' });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// DELETE: permanently delete blog post (Super Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins can delete publications.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required.' }, { status: 400 });
    }

    const blog = queryOne(`SELECT title FROM blogs WHERE id = ?`, [parseInt(id)]);
    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    query(`DELETE FROM blogs WHERE id = ?`, [parseInt(id)]);

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Delete Blog',
      `Super admin permanently deleted blog post "${blog.title}"`,
    ]);

    return NextResponse.json({ message: 'Blog post successfully deleted.' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
