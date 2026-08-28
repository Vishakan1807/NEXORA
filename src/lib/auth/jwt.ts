import { jwtVerify, SignJWT } from 'jose';
import type { UserRole } from '@/types';

function getSecretKey() {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_nexora_change_me_in_production';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  email: string;
}

/**
 * Creates a JWT token for the user session
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days expiration
    .sign(getSecretKey());
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null; // Invalid or expired token
  }
}
