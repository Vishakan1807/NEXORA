import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, vector } from 'drizzle-orm/pg-core';
import type { UserRole, WorkspaceStatus, WorkspaceSourceType, ProviderStatus, WorkflowStatus } from '@/types';

// ============================================================
// USERS
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').$type<UserRole>().default('client').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// ============================================================
// SESSIONS
// ============================================================
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// WORKSPACES
// ============================================================
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  sourceType: text('source_type').$type<WorkspaceSourceType>().notNull(),
  sourcePath: text('source_path').notNull(),
  status: text('status').$type<WorkspaceStatus>().default('created').notNull(),
  projectMeta: jsonb('project_meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// WORKSPACE MEMBERS (Multi-Tenant Mapping)
// ============================================================
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// AI PROVIDERS
// ============================================================
export const providers = pgTable('providers', {
  id: text('id').primaryKey(), // e.g. 'openai', 'anthropic'
  name: text('name').notNull(),
  status: text('status').$type<ProviderStatus>().default('disconnected').notNull(),
  isConfigured: boolean('is_configured').default(false).notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// WORKFLOWS
// ============================================================
export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  traceId: text('trace_id').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  status: text('status').$type<WorkflowStatus>().default('pending').notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// ============================================================
// AUDIT LOGS
// ============================================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  target: text('target').notNull(),
  result: text('result').notNull(), // 'success', 'failure', 'denied'
  context: jsonb('context'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// WORKSPACE DOCUMENTS (Vector Embeddings)
// ============================================================
export const workspaceDocuments = pgTable('workspace_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  filePath: text('file_path').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // e.g. { chunkIndex: 0, type: 'function', name: 'processData' }
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small dimensions
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ============================================================
// USER API KEYS
// ============================================================
export const userKeys = pgTable('user_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  providerId: text('provider_id').notNull(), // 'openai', 'anthropic', 'gemini'
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
