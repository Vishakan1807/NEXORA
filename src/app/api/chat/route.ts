import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { retrieveContext, getProviderModel } from '@/lib/ai/orchestrator';
import { getWorkspaceTools } from '@/lib/ai/tools';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Next.js config to allow long-running streams (max 5 mins)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { messages, workspaceId, providerId, modelId, mode = 'assistant' } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Please select a workspace' }, { status: 400 });
    }

    // Fetch the workspace to get the root path for tools
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check Authorization: User must be the owner OR a mapped member
    if (workspace.userId !== session.userId) {
      // Not the owner, check members table
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(
          sql`${workspaceMembers.workspaceId} = ${workspaceId} AND ${workspaceMembers.userId} = ${session.userId}`
        );
        
      if (!membership) {
        return NextResponse.json({ error: 'You do not have access to this workspace' }, { status: 403 });
      }
    }

    if (!providerId || !modelId) {
      return NextResponse.json({ error: 'Please select an AI provider and model' }, { status: 400 });
    }

    // 1. Get the last user message to use as the search query
    const lastMessage = messages[messages.length - 1];
    let contextStr = '';
    
    if (lastMessage && lastMessage.role === 'user') {
      try {
        contextStr = await retrieveContext(workspaceId, lastMessage.content);
      } catch (err: any) {
        console.warn('Semantic search failed:', err.message);
        // Continue even if search fails, just without context
      }
    }

    // 2. Instantiate the requested AI model securely
    const model = await getProviderModel(providerId, modelId);

    // 3. Construct the system prompt with the injected codebase context
    const baseRole = mode === 'qa' 
      ? 'You are an expert Codebase Q&A Assistant. Your goal is to explain code, architecture, and answer questions accurately. Do not attempt to modify the codebase.' 
      : 'You are NEXORA, an elite AI Software Architect and Orchestrator. You have the ability to read, write, and execute commands in the codebase.';

    const systemPrompt = `${baseRole}

Here is the relevant context retrieved from their repository based on their query:
<repository_context>
${contextStr}
</repository_context>

Instructions:
- Use the repository context to provide highly accurate, codebase-specific answers.
- If the context does not contain the answer, state that clearly, but try to help based on general knowledge.
- Output clean, valid markdown.
`;

    // 4. Stream the response using Vercel AI SDK with injected Tools
    const tools = mode === 'qa' ? undefined : getWorkspaceTools(workspace.sourcePath);

    const result = await streamText({
      model: model,
      system: systemPrompt,
      messages,
      tools: tools,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Chat request failed' }, { status: 500 });
  }
}
