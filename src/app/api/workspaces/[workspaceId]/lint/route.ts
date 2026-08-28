import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

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

    try {
      // Execute ESLint and request JSON output. 
      // We use npx eslint to ensure it uses the local workspace version if available, or global fallback.
      // We pass --no-error-on-unmatched-pattern so it doesn't fail if no files match.
      const { stdout } = await execAsync('npx eslint . --format json --no-error-on-unmatched-pattern', { 
        cwd: basePath,
        // Increase max buffer for large codebases
        maxBuffer: 1024 * 1024 * 10 
      });
      
      const results = JSON.parse(stdout);
      return NextResponse.json({ results });

    } catch (err: any) {
      // ESLint exits with code 1 if there are lint errors. 
      // This throws an error in execAsync, but stdout will contain the JSON we need!
      if (err.stdout) {
        try {
          const results = JSON.parse(err.stdout);
          return NextResponse.json({ results });
        } catch (parseErr) {
          // If it's not JSON, it might be a setup error like missing eslint.config.js
          const outputStr = err.stdout + (err.stderr || '');
          if (outputStr.includes('couldn\'t find') || outputStr.includes('eslint.config')) {
            return NextResponse.json({ 
              error: 'ESLint configuration not found in this workspace. Please ensure an eslint.config.* or .eslintrc.* file exists.' 
            }, { status: 400 });
          }
          return NextResponse.json({ error: 'Failed to parse linter output', details: err.stdout }, { status: 500 });
        }
      }
      
      const errMsg = err.message || '';
      if (errMsg.includes('couldn\'t find') || errMsg.includes('eslint.config')) {
         return NextResponse.json({ 
           error: 'ESLint configuration not found in this workspace. Please ensure an eslint.config.* or .eslintrc.* file exists.' 
         }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to run linter: ' + err.message }, { status: 500 });
    }

  } catch (error) {
    console.error('Lint API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
