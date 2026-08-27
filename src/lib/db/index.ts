import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexora';

// Client for queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Client for migrations (can be exposed via a script)
export const migrationClient = postgres(connectionString, { max: 1 });
