export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: fetch all branding, system, and preset settings
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isStaff = ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden. Staff clearance required.' }, { status: 403 });
    }

    const websitesettings = query(`SELECT key, value FROM websitesetting`);
    const systemsettings = query(`SELECT key, value FROM systemsetting`);
    const themepresets = query(`SELECT id, name, tokens FROM themepreset`);
    const customTheme = queryOne(`SELECT * FROM themecustomization ORDER BY id DESC LIMIT 1`);

    return NextResponse.json({
      websitesettings: websitesettings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {}),
      systemsettings: systemsettings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {}),
      themepresets: themepresets.map((p: any) => ({
        id: p.id,
        name: p.name,
        tokens: JSON.parse(p.tokens),
      })),
      customTheme: customTheme ? {
        id: customTheme.id,
        preset_id: customTheme.preset_id,
        custom_tokens: JSON.parse(customTheme.custom_tokens),
      } : null,
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

// PUT: update settings or change admin/staff password
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const isStaff = ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden. Staff clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesettings, systemsettings, selectPresetId, customTokens, newPassword, currentPassword } = body;

    // 1. Handle Password Change Flow
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 });
      }

      // Check current password from users table
      const dbUser = queryOne(`SELECT password FROM users WHERE id = ?`, [user.userId]);
      if (!dbUser || !bcrypt.compareSync(currentPassword, dbUser.password)) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.userId]);

      // If user is also in adminauth table, update there too
      const inAdminAuth = queryOne(`SELECT id FROM adminauth WHERE email = ?`, [user.email]);
      if (inAdminAuth) {
        query(`UPDATE adminauth SET primaryPassword = ? WHERE email = ?`, [hashedPassword, user.email]);
      }

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Change Password',
        `Staff user ${user.email} changed their account security password.`,
      ]);

      return NextResponse.json({ message: 'Password updated successfully.' });
    }

    // Only Admin / Sub-admin roles can modify site or layout presets configuration
    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin or Sub-admin clearance required to update settings.' }, { status: 403 });
    }

    // 2. Update websitesettings
    if (websitesettings) {
      for (const [key, val] of Object.entries(websitesettings)) {
        query(`INSERT INTO websitesetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(val)]);
      }
    }

    // 3. Update systemsettings
    if (systemsettings) {
      for (const [key, val] of Object.entries(systemsettings)) {
        query(`INSERT INTO systemsetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(val)]);
      }
    }

    // 4. Update custom theme configurations or select a preset
    if (selectPresetId || customTokens) {
      const presetId = selectPresetId || null;
      const tokensStr = JSON.stringify(customTokens || {});
      query(`INSERT INTO themecustomization (preset_id, custom_tokens) VALUES (?, ?)`, [presetId, tokensStr]);
    }

    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Update Settings',
      `Staff updated site systems, themes, or branding attributes.`,
    ]);

    return NextResponse.json({ message: 'Branding and theme configuration settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
