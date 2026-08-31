import { db } from '@/lib/db';
import { workspaceDocuments, providers, userKeys } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';
import { decrypt } from '@/lib/auth/crypto';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * Retrieves the most relevant codebase chunks for a given prompt using pgvector semantic search.
 */
export async function retrieveContext(workspaceId: string, prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('System OPENAI_API_KEY not configured for semantic search');
  }

  // 1. Generate embedding for the user prompt using the system OpenAI key
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: prompt,
  });

  const embeddingString = `[${embedding.join(',')}]`;

  // 2. Perform Cosine Similarity search on the pgvector column (<=> operator)
  // We limit to the top 5 most relevant chunks
  const similarityQuery = sql<number>`1 - (${workspaceDocuments.embedding} <=> ${embeddingString}::vector)`;
  
  const relevantChunks = await db
    .select({
      filePath: workspaceDocuments.filePath,
      content: workspaceDocuments.content,
      similarity: similarityQuery
    })
    .from(workspaceDocuments)
    .where(eq(workspaceDocuments.workspaceId, workspaceId))
    .orderBy(sql`${workspaceDocuments.embedding} <=> ${embeddingString}::vector`)
    .limit(5);

  if (relevantChunks.length === 0) {
    return 'No context found in workspace.';
  }

  // 3. Format the chunks into a readable context string
  return relevantChunks.map(chunk => 
    `--- File: ${chunk.filePath} ---\n${chunk.content}\n`
  ).join('\n');
}

/**
 * Instantiates the correct AI SDK provider using the user's securely stored API keys.
 */
export async function getProviderModel(providerId: string, modelName: string, userId?: string) {
  let apiKey = '';

  // 1. Try to fetch the user's personal API key first
  if (userId) {
    const [userKeyRecord] = await db
      .select()
      .from(userKeys)
      .where(and(eq(userKeys.userId, userId), eq(userKeys.providerId, providerId)));

    if (userKeyRecord && userKeyRecord.apiKeyEncrypted) {
      apiKey = decrypt(userKeyRecord.apiKeyEncrypted);
    }
  }

  // 2. Fall back to the global platform API key if no personal key is found
  if (!apiKey) {
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, providerId));

    if (!providerRecord || !providerRecord.isConfigured || !providerRecord.apiKeyEncrypted) {
      throw new Error(`${providerId} is not configured globally, and you haven't provided a personal key.`);
    }

    apiKey = decrypt(providerRecord.apiKeyEncrypted);
  }

  switch (providerId) {
    case 'openai':
      // The user's BYOK OpenAI key overrides the system one for chat
      const userOpenAI = createOpenAI({ apiKey });
      return userOpenAI(modelName); // e.g. 'gpt-4o'
      
    case 'anthropic':
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName); // e.g. 'claude-3-5-sonnet-20240620'
      
    case 'google':
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelName); // e.g. 'gemini-1.5-pro'
      
    case 'openrouter':
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(modelName); // e.g. 'meta-llama/llama-3-70b-instruct'
      
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}
