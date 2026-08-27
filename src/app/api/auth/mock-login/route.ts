import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth/jwt';
import type { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role: UserRole = body.role || 'developer';

    // Create a mock payload based on requested role
    const payload = {
      userId: 'mock-user-id-1234',
      role,
      email: `${role}@nexora.ai`,
    };

    // Generate JWT token
    const token = await createSessionToken(payload);

    // Create response with cookie
    const response = NextResponse.json({ success: true, role });
    
    // Set HTTP-only cookie
    response.cookies.set({
      name: 'nexora_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
