import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'weartome-luxury-super-secret-key-2026';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

/**
 * Signs an access token for a given user payload (lasts 1 day).
 */
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Verifies and decodes an access token. Returns payload or null if invalid.
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Helper to extract and verify JWT from request cookies or Auth header.
 */
export function getAuthenticatedUser(req: NextRequest): JWTPayload | null {
  // Try Cookie first
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }

  // Try Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    return verifyAccessToken(headerToken);
  }

  return null;
}

/**
 * Higher-order helper for verifying roles inside Next.js route handlers.
 * Ensures the user is logged in and possesses required role rights.
 */
export function withRoleAuth(
  allowedRoles: string[],
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Check if user is suspended
    const checkSuspended = queryOne(`SELECT is_suspended, suspended_until FROM users WHERE id = ?`, [user.userId]);
    if (checkSuspended?.is_suspended) {
      if (checkSuspended.suspended_until) {
        const untilDate = new Date(checkSuspended.suspended_until);
        if (untilDate > new Date()) {
          return NextResponse.json({
            error: `Your account is suspended until ${untilDate.toLocaleString()}.`
          }, { status: 403 });
        } else {
          // Auto-unsuspend if the time has passed
          queryOne(`UPDATE users SET is_suspended = 0, suspended_until = NULL WHERE id = ?`, [user.userId]);
        }
      } else {
        return NextResponse.json({ error: 'Your account is permanently suspended.' }, { status: 403 });
      }
    }

    // Admin (root) bypasses role checks
    if (user.role === 'Admin') {
      return handler(req, user);
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }

    return handler(req, user);
  };
}
