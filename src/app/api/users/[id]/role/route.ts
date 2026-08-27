import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // ONLY super_admin or admin can promote/demote
    if (session.role !== 'super_admin' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { role } = await req.json();

    if (role !== 'admin' && role !== 'developer') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // A normal admin cannot demote a super_admin
    const [targetUser] = await db.select().from(users).where(eq(users.id, (await params).id));
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.role === 'super_admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot modify a super admin' }, { status: 403 });
    }

    // You cannot demote yourself
    if (targetUser.id === session.userId) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    await db.update(users).set({ role }).where(eq(users.id, (await params).id));

    return NextResponse.json({ success: true, message: `User promoted to ${role}` });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
