import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { analyzeWorkspace } from '@/lib/workspace/parser';

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file.name.replace('.zip', '');

    if (!file || !file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Invalid file. Only ZIP files are supported.' }, { status: 400 });
    }

    // 3. Save ZIP temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(os.tmpdir(), `nexora_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const zipPath = path.join(tempDir, file.name);
    fs.writeFileSync(zipPath, buffer);

    // 4. Extract ZIP
    const extractDir = path.join(tempDir, 'extracted');
    fs.mkdirSync(extractDir);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // 5. Analyze the extracted workspace
    // If the ZIP contains a single top-level folder, we should analyze that folder
    const entries = fs.readdirSync(extractDir);
    let analysisPath = extractDir;
    if (entries.length === 1 && fs.statSync(path.join(extractDir, entries[0])).isDirectory()) {
      analysisPath = path.join(extractDir, entries[0]);
    }
    
    const projectMeta = analyzeWorkspace(analysisPath);

    // 6. Create Workspace Record in DB
    const [newWorkspace] = await db.insert(workspaces).values({
      userId: session.userId,
      name: name,
      sourceType: 'zip',
      sourcePath: analysisPath, // In a real app, you'd move this to permanent storage (S3/EFS)
      status: 'ready',
      projectMeta: projectMeta,
    }).returning();

    return NextResponse.json({ success: true, workspace: newWorkspace });
  } catch (error) {
    console.error('Error processing workspace upload:', error);
    return NextResponse.json({ error: 'Failed to process workspace' }, { status: 500 });
  }
}
