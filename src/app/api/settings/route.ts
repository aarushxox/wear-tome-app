export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET: Retrieve websitesetting, systemsetting, and themepreset records
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Load websitesettings
    const websiteRows = query(`SELECT key, value FROM websitesetting`);
    const websitesettings: Record<string, string> = {};
    websiteRows.forEach((row: any) => {
      websitesettings[row.key] = row.value;
    });

    // Load systemsettings
    const systemRows = query(`SELECT key, value FROM systemsetting`);
    const systemsettings: Record<string, string> = {};
    systemRows.forEach((row: any) => {
      systemsettings[row.key] = row.value;
    });

    // Load themepresets
    const presets = query(`SELECT id, name, tokens FROM themepreset`);
    const themepresets = presets.map((pres: any) => ({
      id: pres.id,
      name: pres.name,
      tokens: JSON.parse(pres.tokens),
    }));

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

// PUT: Update settings
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Role check: Only Admin and Sub-admin are allowed to update settings
    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesettings, systemsettings, selected_preset_id } = body;

    // Update websitesettings if present
    if (websitesettings && typeof websitesettings === 'object') {
      for (const [key, value] of Object.entries(websitesettings)) {
        if (typeof value === 'string') {
          // Check if key exists
          const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
          if (existing) {
            query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [value, key]);
          } else {
            query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, value]);
          }
        }
      }
    }

    // Update systemsettings if present
    if (systemsettings && typeof systemsettings === 'object') {
      for (const [key, value] of Object.entries(systemsettings)) {
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

    // Apply specific theme preset if requested
    if (selected_preset_id) {
      const preset = queryOne(`SELECT name, tokens FROM themepreset WHERE id = ?`, [parseInt(selected_preset_id)]);
      if (preset) {
        // Also save to themecustomization for active custom state tracking
        query(`INSERT INTO themecustomization (preset_id, custom_tokens) VALUES (?, ?)`, [
          parseInt(selected_preset_id),
          preset.tokens,
        ]);

        // Reflect key color and font settings inside websitesettings based on chosen preset
        const tokens = JSON.parse(preset.tokens);
        if (tokens.accentColor || tokens.primaryBackground) {
          query(`UPDATE websitesetting SET value = ? WHERE key = 'site.primary_color'`, [tokens.accentColor || tokens.primaryBackground]);
        }
        if (tokens.fontFamily) {
          query(`UPDATE websitesetting SET value = ? WHERE key = 'site.primary_font'`, [tokens.fontFamily]);
        }
      }
    }

    // Log the action in the audit log
    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `Staff updated site branding / system configurations. Selected Preset ID: ${selected_preset_id || 'None'}`,
    ]);

    return NextResponse.json({ message: 'Settings successfully updated and applied.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
