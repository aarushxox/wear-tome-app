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

    const isStaff = ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const websitesettings = query(`SELECT key, value FROM websitesetting`);
    const systemsettings = query(`SELECT key, value FROM systemsetting`);
    const themepresets = query(`SELECT id, name, tokens FROM themepreset`);

    return NextResponse.json({
      websitesettings,
      systemsettings,
      themepresets,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isStaff = ['Admin', 'Sub-admin', 'Manager'].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value, type, name, tokens } = body;

    if (type === 'websitesetting') {
      if (!key) {
        return NextResponse.json({ error: 'Key is required for website settings.' }, { status: 400 });
      }
      const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
      if (existing) {
        query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [value, key]);
      } else {
        query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, value]);
      }
      return NextResponse.json({ message: 'Website setting updated successfully.' });
    }

    if (type === 'systemsetting') {
      if (!key) {
        return NextResponse.json({ error: 'Key is required for system settings.' }, { status: 400 });
      }
      const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [key]);
      if (existing) {
        query(`UPDATE systemsetting SET value = ? WHERE key = ?`, [value, key]);
      } else {
        query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [key, value]);
      }
      return NextResponse.json({ message: 'System setting updated successfully.' });
    }

    if (type === 'themepreset') {
      if (!name || !tokens) {
        return NextResponse.json({ error: 'Name and tokens are required for theme presets.' }, { status: 400 });
      }
      const existing = queryOne(`SELECT id FROM themepreset WHERE name = ?`, [name]);
      if (existing) {
        query(`UPDATE themepreset SET tokens = ? WHERE name = ?`, [tokens, name]);
      } else {
        query(`INSERT INTO themepreset (name, tokens) VALUES (?, ?)`, [name, tokens]);
      }
      return NextResponse.json({ message: 'Theme preset updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid update parameters.' }, { status: 400 });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
