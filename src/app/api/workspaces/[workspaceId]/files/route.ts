import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('path') || '/';

    // Verify workspace belongs to user
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, (await params).workspaceId),
        eq(workspaces.userId, session.userId)
      ));

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const basePath = workspace.sourcePath;
    const targetPath = path.join(basePath, dirPath);

    // Security check: Path traversal prevention
    if (!targetPath.startsWith(basePath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      // It's a file, return the content instead of an error!
      const content = fs.readFileSync(targetPath, 'utf8');
      return NextResponse.json({ 
        isFile: true, 
        content,
        size: stat.size,
        name: path.basename(targetPath)
      });
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    
    const nodes: FileNode[] = entries.map(entry => {
      const isDir = entry.isDirectory();
      const nodePath = path.posix.join(dirPath, entry.name);
      
      return {
        name: entry.name,
        path: nodePath,
        isDirectory: isDir,
        size: isDir ? undefined : fs.statSync(path.join(targetPath, entry.name)).size
      };
    });

    // Sort: directories first, then files alphabetically
    nodes.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });

    return NextResponse.json({ files: nodes });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
