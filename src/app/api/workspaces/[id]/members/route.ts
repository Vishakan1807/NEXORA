import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

// Check if user has permission to manage members (must be owner/organizer or admin)
async function checkManagePermission(session: any, workspaceId: string) {
  if (session.role === 'admin') return true;
  
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));
    
  if (!workspace || workspace.userId !== session.userId) {
    return false;
  }
  return true;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const workspaceId = (await params).id;

    if (!(await checkManagePermission(session, workspaceId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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

    const workspaceId = (await params).id;
    const { userId } = await req.json();

    if (!(await checkManagePermission(session, workspaceId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if mapping already exists
    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(
        sql`${workspaceMembers.workspaceId} = ${workspaceId} AND ${workspaceMembers.userId} = ${userId}`
      );

    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    await db.insert(workspaceMembers).values({
      workspaceId,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const workspaceId = (await params).id;
    const { userId } = await req.json();

    if (!(await checkManagePermission(session, workspaceId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .delete(workspaceMembers)
      .where(
        sql`${workspaceMembers.workspaceId} = ${workspaceId} AND ${workspaceMembers.userId} = ${userId}`
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
