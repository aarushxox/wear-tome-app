export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * GET: Retrieve all websitesetting, systemsetting, and themepreset records.
 * Secured: Only authenticated staff roles (Admin, Sub-admin, Manager, Customer Care) can query settings.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const isStaff = ['Admin', 'Sub-admin', 'Manager', 'Customer Care'].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden. Staff credentials are required.' }, { status: 403 });
    }

    // 1. Fetch website settings
    const websiteRows = query(`SELECT key, value FROM websitesetting`);
    const websitesettings: Record<string, string> = {};
    for (const row of websiteRows) {
      websitesettings[row.key] = row.value;
    }

    // 2. Fetch system settings
    const systemRows = query(`SELECT key, value FROM systemsetting`);
    const systemsettings: Record<string, string> = {};
    for (const row of systemRows) {
      systemsettings[row.key] = row.value;
    }

    // 3. Fetch theme presets
    const presetRows = query(`SELECT id, name, tokens FROM themepreset`);
    const themepresets = presetRows.map((preset: any) => ({
      id: preset.id,
      name: preset.name,
      tokens: JSON.parse(preset.tokens || '{}'),
    }));

    return NextResponse.json({
      websitesetting: websitesettings,
      systemsetting: systemsettings,
      themepreset: themepresets,
    });
  } catch (error) {
    console.error('Fetch settings API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

/**
 * PUT: Update websitesetting, systemsetting, theme configurations, or change admin passwords.
 * Secured: Only Admin or authorized staff can update settings.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Checking if user has proper staff clearance (Admin / Sub-admin / Manager)
    const isStaffAllowed = ['Admin', 'Sub-admin', 'Manager'].includes(user.role);
    if (!isStaffAllowed) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions to modify settings.' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesettings, systemsettings, applyPresetId, customThemeTokens, changePassword } = body;

    // 1. Update website settings
    if (websitesettings && typeof websitesettings === 'object') {
      for (const [key, value] of Object.entries(websitesettings)) {
        const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE websitesetting SET value = ? WHERE key = ?`, [String(value), key]);
        } else {
          query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [key, String(value)]);
        }
      }

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Update Settings',
        `Website branding settings updated by ${user.name} (${user.email}).`,
      ]);
    }

    // 2. Update system settings (AI, voice support, theme mode, etc.)
    if (systemsettings && typeof systemsettings === 'object') {
      for (const [key, value] of Object.entries(systemsettings)) {
        const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [key]);
        if (existing) {
          query(`UPDATE systemsetting SET value = ? WHERE key = ?`, [String(value), key]);
        } else {
          query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [key, String(value)]);
        }
      }

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Update System Settings',
        `System configuration settings updated by ${user.name}.`,
      ]);
    }

    // 3. Apply theme preset or customize theme
    if (applyPresetId) {
      const preset = queryOne(`SELECT id, name FROM themepreset WHERE id = ?`, [parseInt(applyPresetId)]);
      if (!preset) {
        return NextResponse.json({ error: 'Selected theme preset not found.' }, { status: 404 });
      }

      // Check if custom tokens are also provided
      const finalCustomTokens = customThemeTokens ? JSON.stringify(customThemeTokens) : '{}';
      query(`INSERT INTO themecustomization (preset_id, custom_tokens) VALUES (?, ?)`, [preset.id, finalCustomTokens]);

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Apply Theme Preset',
        `Applied theme preset "${preset.name}" and customization.`,
      ]);
    }

    // 4. Force password change flow if requested
    if (changePassword) {
      const { currentPassword, newPassword } = changePassword;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
      }

      const existingUser = queryOne(`SELECT password FROM users WHERE id = ?`, [user.userId]);
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      const isCurrentValid = bcrypt.compareSync(currentPassword, existingUser.password);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Invalid current password.' }, { status: 401 });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

      // Update in both users and adminauth if it exists there
      query(`UPDATE users SET password = ? WHERE id = ?`, [hashedNewPassword, user.userId]);
      query(`UPDATE adminauth SET primaryPassword = ? WHERE email = ?`, [hashedNewPassword, user.email]);

      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Change Password',
        `Administrative password successfully updated.`,
      ]);
    }

    return NextResponse.json({ message: 'Settings successfully updated.' });
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
