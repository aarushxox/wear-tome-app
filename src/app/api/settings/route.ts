export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: fetch websitesetting, systemsetting, and themepreset settings
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Only staff can read settings in the admin panel
    if (!['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // 1. Fetch website settings
    const websiteRows = query(`SELECT * FROM websitesetting`);
    const websiteSettings: Record<string, string> = {};
    websiteRows.forEach((row: any) => {
      websiteSettings[row.key] = row.value;
    });

    // 2. Fetch system settings
    const systemRows = query(`SELECT * FROM systemsetting`);
    const systemSettings: Record<string, string> = {};
    systemRows.forEach((row: any) => {
      systemSettings[row.key] = row.value;
    });

    // 3. Fetch theme presets
    const presets = query(`SELECT * FROM themepreset`);
    const parsedPresets = presets.map((preset: any) => ({
      ...preset,
      tokens: JSON.parse(preset.tokens || '{}'),
    }));

    // 4. Fetch custom theme customization
    const customization = queryOne(`SELECT * FROM themecustomization ORDER BY id DESC LIMIT 1`) || null;
    let parsedCustomization = null;
    if (customization) {
      parsedCustomization = {
        ...customization,
        custom_tokens: JSON.parse(customization.custom_tokens || '{}'),
      };
    }

    return NextResponse.json({
      websiteSettings,
      systemSettings,
      presets: parsedPresets,
      customization: parsedCustomization,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update website or system settings, or customized theme presets
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Settings edits are restricted to Admin and Sub-admin only
    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websiteSettings, systemSettings, presetId, customTokens } = body;

    // 1. Update website settings
    if (websiteSettings && typeof websiteSettings === 'object') {
      for (const [key, val] of Object.entries(websiteSettings)) {
        const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [String(val), key]);
        } else {
          query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, String(val)]);
        }
      }
    }

    // 2. Update system settings
    if (systemSettings && typeof systemSettings === 'object') {
      for (const [key, val] of Object.entries(systemSettings)) {
        const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE systemsetting SET value = ? WHERE key = ?`, [String(val), key]);
        } else {
          query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [key, String(val)]);
        }
      }
    }

    // 3. Save custom theme tokens / select preset
    if (presetId !== undefined || customTokens !== undefined) {
      const selectedPresetId = presetId ? parseInt(presetId) : null;
      const tokensStr = customTokens ? JSON.stringify(customTokens) : '{}';

      query(
        `INSERT INTO themecustomization (preset_id, custom_tokens) VALUES (?, ?)`,
        [selectedPresetId, tokensStr]
      );
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `Updated platform configuration settings.`,
    ]);

    return NextResponse.json({ message: 'Configuration settings saved successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
