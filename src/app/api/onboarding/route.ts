import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { gender, how_found, style_pref, category_pref } = await req.json();

    // Update onboarding answers on the users record
    query(
      `UPDATE users SET gender = ?, how_found = ?, style_pref = ?, category_pref = ? WHERE id = ?`,
      [
        gender || null,
        how_found || null,
        style_pref || null,
        category_pref || null,
        user.userId,
      ]
    );

    // Write action to audit log
    query(`INSERT INTO activitylog (user_id, action, details) VALUES (?, ?, ?)`, [
      user.userId,
      'Submit Onboarding',
      `Onboarding onboarding filled: gender=${gender}, how=${how_found}`,
    ]);

    return NextResponse.json({ message: 'Onboarding completed successfully.' });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
