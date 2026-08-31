import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySessionToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth/crypto';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const keys = await db
      .select({ providerId: userKeys.providerId, updatedAt: userKeys.updatedAt })
      .from(userKeys)
      .where(eq(userKeys.userId, session.userId));

    // We only return the providerId and updatedAt, masking the actual key for security.
    const maskedKeys = keys.map(k => ({
      providerId: k.providerId,
      isConfigured: true,
      updatedAt: k.updatedAt
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error('Error fetching user keys:', error);
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexora_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { providerId, apiKey } = await req.json();

    if (!providerId || !apiKey) {
      return NextResponse.json({ error: 'Provider ID and API Key are required' }, { status: 400 });
    }

    const encryptedKey = encrypt(apiKey);

    // Check if key already exists
    const [existing] = await db
      .select()
      .from(userKeys)
      .where(and(eq(userKeys.userId, session.userId), eq(userKeys.providerId, providerId)));

    if (existing) {
      // Update
      await db
        .update(userKeys)
        .set({ apiKeyEncrypted: encryptedKey, updatedAt: new Date() })
        .where(eq(userKeys.id, existing.id));
    } else {
      // Insert
      await db.insert(userKeys).values({
        userId: session.userId,
        providerId,
        apiKeyEncrypted: encryptedKey
      });
    }

    return NextResponse.json({ success: true, message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving user key:', error);
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
  }
}
