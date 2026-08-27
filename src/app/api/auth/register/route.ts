import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { createSessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    // Check if user exists
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If for some reason admin@gmail.com registers via UI instead of script, make them super_admin
    const role = email === 'admin@gmail.com' ? 'super_admin' : 'developer';

    // Insert user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role
    }).returning();

    // Generate JWT token
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

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
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
