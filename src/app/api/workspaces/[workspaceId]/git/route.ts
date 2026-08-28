import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = util.promisify(exec);

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
    const action = searchParams.get('action') || 'status';
    const filePath = searchParams.get('file');

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

    // Check if it's a git repo. If not, initialize it so the diff engine works!
    if (!fs.existsSync(path.join(basePath, '.git'))) {
       try {
         await execAsync('git init && git add . && git commit -m "Initial commit by NEXORA"', { cwd: basePath });
       } catch (err: any) {
         console.warn('Failed to auto-init git:', err.message);
         return NextResponse.json({ error: 'Not a git repository and auto-init failed' }, { status: 400 });
       }
    }

    if (action === 'status') {
      try {
        // Get git status porcelain (machine readable)
        const { stdout } = await execAsync('git status --porcelain', { cwd: basePath });
        
        const changes = stdout.split('\n').filter(Boolean).map(line => {
          const status = line.substring(0, 2);
          const file = line.substring(3).replace(/^"|"$/g, ''); // Remove quotes if present
          return { file, status: status.trim() };
        });

        return NextResponse.json({ changes });
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to run git status: ' + err.message }, { status: 500 });
      }
    } 
    
    if (action === 'diff') {
      if (!filePath) return NextResponse.json({ error: 'File path required for diff' }, { status: 400 });

      // Path traversal security check
      const targetPath = path.join(basePath, filePath);
      if (!targetPath.startsWith(basePath)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }

      try {
        // Try getting diff for uncommitted changes first
        let { stdout } = await execAsync(`git diff HEAD -- "${filePath}"`, { cwd: basePath });
        
        if (!stdout) {
          // If no uncommitted changes, check if untracked file
          const { stdout: statusOut } = await execAsync(`git ls-files --error-unmatch "${filePath}"`, { cwd: basePath }).catch(() => ({ stdout: '' }));
          if (!statusOut) {
             // File is untracked
             const content = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
             // Generate a fake git diff for an untracked file so the UI parses it seamlessly
             stdout = `diff --git a/${filePath} b/${filePath}
new file mode 100644
index 0000000..0000000
--- /dev/null
+++ b/${filePath}
@@ -0,0 +1,${content.split('\n').length} @@
` + content.split('\n').map(l => '+' + l).join('\n');
          }
        }

        return NextResponse.json({ diff: stdout });
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to run git diff: ' + err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Git API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
