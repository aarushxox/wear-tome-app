import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const websiteRows = query('SELECT key, value FROM websitesetting') || [];
    const systemRows = query('SELECT key, value FROM systemsetting') || [];
    const themePresets = query('SELECT id, name, tokens FROM themepreset') || [];

    const websitesetting: Record<string, string> = {};
    for (const row of websiteRows) {
      websitesetting[row.key] = row.value;
    }

    const systemsetting: Record<string, string> = {};
    for (const row of systemRows) {
      systemsetting[row.key] = row.value;
    }

    const parsedPresets = themePresets.map((preset: any) => ({
      ...preset,
      tokens: typeof preset.tokens === 'string' ? JSON.parse(preset.tokens) : preset.tokens,
    }));

    return NextResponse.json({
      websitesetting,
      systemsetting,
      themepreset: parsedPresets,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || !['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Sub-admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesetting, systemsetting, preset } = body;

    if (websitesetting && typeof websitesetting === 'object') {
      for (const [key, value] of Object.entries(websitesetting)) {
        const existing = queryOne('SELECT key FROM websitesetting WHERE key = ?', [key]);
        if (existing) {
          query('UPDATE websitesetting SET value = ? WHERE key = ?', [String(value), key]);
        } else {
          query('INSERT INTO websitesetting (key, value) VALUES (?, ?)', [key, String(value)]);
        }
      }
    }

    if (systemsetting && typeof systemsetting === 'object') {
      for (const [key, value] of Object.entries(systemsetting)) {
        const existing = queryOne('SELECT key FROM systemsetting WHERE key = ?', [key]);
        if (existing) {
          query('UPDATE systemsetting SET value = ? WHERE key = ?', [String(value), key]);
        } else {
          query('INSERT INTO systemsetting (key, value) VALUES (?, ?)', [key, String(value)]);
        }
      }
    }

    if (preset && preset.name && preset.tokens) {
      const tokensStr = typeof preset.tokens === 'string' ? preset.tokens : JSON.stringify(preset.tokens);
      const existing = queryOne('SELECT id FROM themepreset WHERE name = ?', [preset.name]);
      if (existing) {
        query('UPDATE themepreset SET tokens = ? WHERE id = ?', [tokensStr, existing.id]);
      } else {
        query('INSERT INTO themepreset (name, tokens) VALUES (?, ?)', [preset.name, tokensStr]);
      }
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
