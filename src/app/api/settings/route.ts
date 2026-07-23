export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: load settings (publicly available so storefront can read brand config)
export async function GET(req: NextRequest) {
  try {
    const webSettingsRows = query(`SELECT key, value FROM websitesetting`);
    const systemSettingsRows = query(`SELECT key, value FROM systemsetting`);
    const themePresets = query(`SELECT * FROM themepreset ORDER BY id ASC`);

    const websitesetting: Record<string, string> = {};
    webSettingsRows.forEach((row: any) => {
      websitesetting[row.key] = row.value;
    });

    const systemsetting: Record<string, string> = {};
    systemSettingsRows.forEach((row: any) => {
      systemsetting[row.key] = row.value;
    });

    return NextResponse.json({
      websitesetting,
      systemsetting,
      themepreset: themePresets,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update settings (Admin / Sub-admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Administrative clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesetting, systemsetting } = body;

    // Update websitesettings if provided
    if (websitesetting && typeof websitesetting === 'object') {
      for (const [key, value] of Object.entries(websitesetting)) {
        if (typeof value === 'string') {
          const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
          if (existing) {
            query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [value, key]);
          } else {
            query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, value]);
          }
        }
      }
    }

    // Update systemsettings if provided
    if (systemsetting && typeof systemsetting === 'object') {
      for (const [key, value] of Object.entries(systemsetting)) {
        if (typeof value === 'string') {
          const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [key]);
          if (existing) {
            query(`UPDATE systemsetting SET value = ? WHERE key = ?`, [value, key]);
          } else {
            query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [key, value]);
          }
        }
      }
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `Administrative user updated platform settings configuration.`,
    ]);

    return NextResponse.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
