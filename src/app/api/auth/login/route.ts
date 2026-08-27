import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      // Log failed attempt
      await db.insert(auditLogs).values({
        userId: user.id,
        action: 'login',
        target: 'system',
        result: 'failure',
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Success! Generate JWT token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log success
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'login',
      target: 'system',
      result: 'success',
    });

    // Update lastLoginAt
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Set HTTP-only cookie
    (await cookies()).set({
      name: 'nexora_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
