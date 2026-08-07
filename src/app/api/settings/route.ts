export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: retrieves current websitesetting, systemsetting, and themepreset tables
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Retrieve websitesetting rows
    const dbWebsiteSettings = query(`SELECT key, value FROM websitesetting`);
    const websiteSettings: Record<string, string> = {};
    dbWebsiteSettings.forEach((row: any) => {
      websiteSettings[row.key] = row.value;
    });

    // Retrieve systemsetting rows
    const dbSystemSettings = query(`SELECT key, value FROM systemsetting`);
    const systemSettings: Record<string, string> = {};
    dbSystemSettings.forEach((row: any) => {
      systemSettings[row.key] = row.value;
    });

    // Retrieve theme presets
    const themePresets = query(`SELECT id, name, tokens FROM themepreset ORDER BY id ASC`);
    const parsedPresets = themePresets.map((preset: any) => ({
      id: preset.id,
      name: preset.name,
      tokens: JSON.parse(preset.tokens || '{}'),
    }));

    return NextResponse.json({
      websiteSettings,
      systemSettings,
      themePresets: parsedPresets,
    });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: updates websitesetting and systemsetting database entries
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Only Admin / Sub-admin roles can modify system and design parameters
    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Staff clearance is required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websiteSettings, systemSettings } = body;

    // Update website settings
    if (websiteSettings) {
      for (const [key, value] of Object.entries(websiteSettings)) {
        query(
          `INSERT INTO websitesetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
          [key, String(value), String(value)]
        );
      }
    }

    // Update system settings
    if (systemSettings) {
      for (const [key, value] of Object.entries(systemSettings)) {
        query(
          `INSERT INTO systemsetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
          [key, String(value), String(value)]
        );
      }
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `Updated website and system configuration settings.`,
    ]);

    return NextResponse.json({ message: 'Settings successfully updated.' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
