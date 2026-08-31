import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 1. Fetch workspaces the user owns (if they are an organizer)
    const ownedWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.userId, session.userId));

    // 2. Fetch workspaces they are mapped to (if developer/client)
    const mappedLinks = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, session.userId));
      
    const mappedIds = mappedLinks.map(l => l.workspaceId);
    let mappedWorkspaces: typeof ownedWorkspaces = [];
    
    if (mappedIds.length > 0) {
      mappedWorkspaces = await db
        .select()
        .from(workspaces)
        .where(inArray(workspaces.id, mappedIds));
    }

    // Combine and deduplicate
    const combined = [...ownedWorkspaces, ...mappedWorkspaces];
    const uniqueWorkspaces = Array.from(new Map(combined.map(w => [w.id, w])).values());
    
    // Sort by updated at
    uniqueWorkspaces.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ workspaces: uniqueWorkspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Only organizers and admins can create projects
    if (session.role !== 'organizer' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = await db
      .insert(workspaces)
      .values({
        userId: session.userId,
        name: name,
        sourceType: 'local',
        sourcePath: 'unconfigured', // Empty shell
        status: 'created',
      })
      .returning();

    return NextResponse.json({ project: newProject[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
