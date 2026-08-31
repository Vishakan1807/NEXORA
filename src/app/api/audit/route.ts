import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { isAdmin } from '@/types';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    if (!isAdmin(session.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        target: auditLogs.target,
        result: auditLogs.result,
        context: auditLogs.context,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
