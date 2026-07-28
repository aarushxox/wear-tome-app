export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: Retrieve websitesettings, systemsettings, and themepresets
export async function GET(req: NextRequest) {
  try {
    const websitesettingRows = query(`SELECT key, value FROM websitesetting`);
    const systemsettingRows = query(`SELECT key, value FROM systemsetting`);
    const themepresetRows = query(`SELECT id, name, tokens FROM themepreset`);

    // Convert list of key/value pairs to a simple lookup object for ease of use
    const websitesettings: Record<string, string> = {};
    for (const row of websitesettingRows) {
      websitesettings[row.key] = row.value;
    }

    const systemsettings: Record<string, string> = {};
    for (const row of systemsettingRows) {
      systemsettings[row.key] = row.value;
    }

    // Parse themepreset JSON tokens
    const themepresets = themepresetRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      tokens: JSON.parse(row.tokens || '{}'),
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

// PUT: Update settings or handle admin password change (Admin/Sub-admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!['Admin', 'Sub-admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Settings clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { websitesettings, systemsettings, oldPassword, newPassword } = body;

    let updatedCount = 0;

    // 1. Update websitesetting key-value records
    if (websitesettings && typeof websitesettings === 'object') {
      for (const [key, val] of Object.entries(websitesettings)) {
        if (typeof val === 'string') {
          query(`INSERT OR REPLACE INTO websitesetting (key, value) VALUES (?, ?)`, [key, val]);
          updatedCount++;
        }
      }
    }

    // 2. Update systemsetting key-value records
    if (systemsettings && typeof systemsettings === 'object') {
      for (const [key, val] of Object.entries(systemsettings)) {
        if (typeof val === 'string') {
          query(`INSERT OR REPLACE INTO systemsetting (key, value) VALUES (?, ?)`, [key, val]);
          updatedCount++;
        }
      }
    }

    // 3. Admin / Sub-admin password change flow
    let passwordChanged = false;
    if (oldPassword && newPassword) {
      const currentUser = queryOne(`SELECT * FROM users WHERE id = ?`, [user.userId]);
      if (!currentUser) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }

      // Verify old password
      if (!bcrypt.compareSync(oldPassword, currentUser.password)) {
        return NextResponse.json({ error: 'Incorrect old password.' }, { status: 400 });
      }

      // Hash and store new password
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword, salt);

      // Update both canonical users and administrative auth credentials
      query(`UPDATE users SET password = ? WHERE id = ?`, [newHash, user.userId]);
      query(`UPDATE adminauth SET primaryPassword = ? WHERE email = ?`, [newHash, currentUser.email]);

      passwordChanged = true;

      // Log in audit trail
      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Change Password',
        `User ${currentUser.email} successfully updated their password credentials.`,
      ]);
    }

    if (updatedCount > 0 || passwordChanged) {
      query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
        user.userId,
        'Update Settings',
        `Updated settings: ${updatedCount} keys modified. Password updated: ${passwordChanged}`,
      ]);
    }

    return NextResponse.json({
      message: 'Settings updated successfully.',
      updatedKeysCount: updatedCount,
      passwordChanged,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
