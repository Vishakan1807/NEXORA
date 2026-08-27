import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth/crypto';

// Default providers to initialize
const DEFAULT_PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'google', name: 'Google Gemini' },
  { id: 'openrouter', name: 'OpenRouter (Hundreds of LLMs)' }
];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Fetch providers
    let dbProviders = await db.select().from(providers);
    
    // Seed defaults if empty
    if (dbProviders.length === 0) {
      const inserts = DEFAULT_PROVIDERS.map(p => ({
        id: p.id,
        name: p.name,
        status: 'disconnected' as const,
        isConfigured: false
      }));
      await db.insert(providers).values(inserts);
      dbProviders = await db.select().from(providers);
    }

    // Never return the actual encrypted keys to the frontend, just status
    const safeProviders = dbProviders.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      isConfigured: p.isConfigured,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({ providers: safeProviders });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Ensure Admin access
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required to modify global API keys' }, { status: 403 });
    }

    const { id, apiKey } = await request.json();

    if (!id || !apiKey) {
      return NextResponse.json({ error: 'Missing provider id or api key' }, { status: 400 });
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);

    await db.update(providers)
      .set({
        apiKeyEncrypted: encryptedKey,
        isConfigured: true,
        status: 'connected',
        updatedAt: new Date()
      })
      .where(eq(providers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}
