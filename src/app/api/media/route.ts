import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    let sql = `SELECT * FROM mediafile WHERE 1=1`;
    const params: any[] = [];

    if (entityType) {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }
    if (entityId) {
      sql += ` AND entity_id = ?`;
      params.push(parseInt(entityId));
    }

    sql += ` ORDER BY is_primary DESC, id ASC`;
    const media = query(sql, params);

    return NextResponse.json({ media });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch media files.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || !['Admin', 'Sub-admin', 'Manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { filepath, entity_type, entity_id, original_filename, file_size, is_primary } = body;

    if (!filepath || !entity_type || !entity_id) {
      return NextResponse.json({ error: 'filepath, entity_type, and entity_id are required.' }, { status: 400 });
    }

    // Ensure extension is converted or designated as .webp
    let webpPath = filepath;
    if (!webpPath.endsWith('.webp')) {
      webpPath = webpPath.replace(/\.[^/.]+$/, '') + '.webp';
    }

    query(
      `INSERT INTO mediafile (filepath, entity_type, entity_id, original_filename, file_size, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        webpPath,
        entity_type,
        parseInt(entity_id),
        original_filename || 'image.png',
        file_size || 102400,
        is_primary ? 1 : 0,
      ]
    );

    const newMedia = queryOne(`SELECT * FROM mediafile WHERE filepath = ? AND entity_id = ?`, [
      webpPath,
      parseInt(entity_id),
    ]);

    return NextResponse.json({ media: newMedia }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload media.' }, { status: 500 });
  }
}
