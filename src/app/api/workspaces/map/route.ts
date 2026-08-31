import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { analyzeWorkspace } from '@/lib/workspace/parser';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    const { localPath, name } = body;

    if (!localPath) {
      return NextResponse.json({ error: 'Local path is required' }, { status: 400 });
    }

    if (!fs.existsSync(localPath)) {
      return NextResponse.json({ error: 'Directory does not exist' }, { status: 400 });
    }

    const stat = fs.statSync(localPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
    }

    // Parse the project
    const meta = analyzeWorkspace(localPath);

    // Insert into DB
    const [newWorkspace] = await db.insert(workspaces).values({
      userId: session.userId,
      name: name || path.basename(localPath),
      sourceType: 'local',
      sourcePath: localPath, 
      status: 'ready',
      projectMeta: meta,
    }).returning({ id: workspaces.id });

    return NextResponse.json({ 
      success: true, 
      workspaceId: newWorkspace.id,
      meta 
    });

  } catch (error: any) {
    console.error('Workspace map error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
