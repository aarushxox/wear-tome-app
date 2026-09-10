import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const websiteSettings = query(`SELECT key, value FROM websitesetting`);
    const systemSettings = query(`SELECT key, value FROM systemsetting`);
    const themePresets = query(`SELECT id, name, tokens FROM themepreset`);

    const siteMap: Record<string, string> = {};
    for (const item of websiteSettings) {
      siteMap[item.key] = item.value;
    }

    const sysMap: Record<string, string> = {};
    for (const item of systemSettings) {
      sysMap[item.key] = item.value;
    }

    return NextResponse.json({
      websiteSettings: siteMap,
      systemSettings: sysMap,
      themePresets: themePresets.map((tp: any) => ({
        ...tp,
        tokens: JSON.parse(tp.tokens || '{}'),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getAuthenticatedUser(request as NextRequest);
    if (!user || !['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized. Admin rights required.' }, { status: 403 });
    }

    const body = await request.json();
    const { websiteSettings, systemSettings, themePreset } = body;

    if (websiteSettings && typeof websiteSettings === 'object') {
      for (const [key, value] of Object.entries(websiteSettings)) {
        const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [String(value), key]);
        } else {
          query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, String(value)]);
        }
      }
    }

    if (systemSettings && typeof systemSettings === 'object') {
      for (const [key, value] of Object.entries(systemSettings)) {
        const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE systemsetting SET value = ? WHERE key = ?`, [String(value), key]);
        } else {
          query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [key, String(value)]);
        }
      }
    }

    if (themePreset && themePreset.name && themePreset.tokens) {
      const tokensStr = typeof themePreset.tokens === 'string' ? themePreset.tokens : JSON.stringify(themePreset.tokens);
      const existing = queryOne(`SELECT id FROM themepreset WHERE name = ?`, [themePreset.name]);
      if (existing) {
        query(`UPDATE themepreset SET tokens = ? WHERE id = ?`, [tokensStr, existing.id]);
      } else {
        query(`INSERT INTO themepreset (name, tokens) VALUES (?, ?)`, [themePreset.name, tokensStr]);
      }
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `User updated site/system/theme settings.`,
    ]);

    return NextResponse.json({ message: 'Settings updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings.' }, { status: 500 });
  }
}
