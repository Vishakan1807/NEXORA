import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaces, workspaceDocuments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { getWorkspaceFiles, chunkFile } from '@/lib/workspace/intelligence';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

export async function POST(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Verify workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, params.workspaceId),
        eq(workspaces.userId, session.userId)
      ));

    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    // Check if OPENAI_API_KEY is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('YOUR_OPENAI_API_KEY_HERE')) {
      return NextResponse.json({ error: 'OpenAI API Key is not configured' }, { status: 400 });
    }

    // 1. Get all source files in workspace
    const files = getWorkspaceFiles(workspace.sourcePath);
    
    // 2. Chunk all files
    const allChunks = [];
    for (const file of files) {
      const chunks = await chunkFile(workspace.sourcePath, file);
      allChunks.push(...chunks);
    }

    if (allChunks.length === 0) {
      return NextResponse.json({ error: 'No processable code files found' }, { status: 400 });
    }

    // Clear existing embeddings for this workspace to prevent duplicates if re-indexing
    await db.delete(workspaceDocuments).where(eq(workspaceDocuments.workspaceId, workspace.id));

    // 3. Generate Embeddings (batch in chunks of 50 to avoid API limits)
    const BATCH_SIZE = 50;
    let indexedCount = 0;

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const textsToEmbed = batch.map(c => `File: ${c.filePath}\n\n${c.content}`);
      
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: textsToEmbed,
      });

      // 4. Save to Database
      const insertData = batch.map((chunk, index) => ({
        workspaceId: workspace.id,
        filePath: chunk.filePath,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: embeddings[index],
      }));

      await db.insert(workspaceDocuments).values(insertData);
      indexedCount += batch.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully indexed ${indexedCount} chunks across ${files.length} files.` 
    });

  } catch (error: any) {
    console.error('Error running intelligence:', error);
    return NextResponse.json({ error: error.message || 'Failed to run intelligence' }, { status: 500 });
  }
}
