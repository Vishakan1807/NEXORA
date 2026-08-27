/* ============================================================
   NEXORA — Shared Type Definitions
   Central type system for the platform
   ============================================================ */

// ============================================================
// THEME
// ============================================================
export type NexoraTheme = 'aurora' | 'eclipse' | 'signature';

export interface ThemeConfig {
  id: NexoraTheme;
  name: string;
  description: string;
  icon: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Light, intelligent, futuristic',
    icon: '☀️',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Dark, powerful, focused',
    icon: '🌙',
  },
  {
    id: 'signature',
    name: 'Signature',
    description: 'Premium, distinctive, executive',
    icon: '💎',
  },
];

export const DEFAULT_THEME: NexoraTheme = 'eclipse';

// ============================================================
// USER & AUTH
// ============================================================
export type UserRole =
  | 'viewer'
  | 'developer'
  | 'qa_engineer'
  | 'security_engineer'
  | 'architect'
  | 'admin'
  | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  name: string;
  workspaceId?: string;
  createdAt: string;
  lastActiveAt: string;
}

// ============================================================
// WORKSPACE
// ============================================================
export type WorkspaceSourceType = 'local' | 'upload' | 'zip' | 'git';
export type WorkspaceStatus = 'created' | 'mapped' | 'analyzing' | 'ready' | 'stale' | 'archived';

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  sourceType: WorkspaceSourceType;
  sourcePath: string;
  status: WorkspaceStatus;
  projectMeta?: ProjectMeta;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  relativePath: string;
  name: string;
  fileType: string;
  sizeBytes: number;
  isDirectory: boolean;
  children?: WorkspaceFile[];
  contentHash?: string;
}

export interface ProjectMeta {
  languages: string[];
  frameworks: string[];
  buildSystems: string[];
  packageManagers: string[];
  hasTests: boolean;
  hasDocker: boolean;
  hasCi: boolean;
  entryPoints: string[];
  totalFiles: number;
  totalSize: number;
}

// ============================================================
// AI PROVIDERS
// ============================================================
export type ProviderStatus = 'connected' | 'disconnected' | 'degraded' | 'rate_limited' | 'error';

export interface AIProvider {
  id: string;
  name: string;
  displayName: string;
  status: ProviderStatus;
  isConfigured: boolean;
  models: AIModel[];
  health?: ProviderHealth;
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  tier: 'standard' | 'advanced' | 'premium';
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  maxTokens: number;
  contextWindow: number;
}

export interface ProviderHealth {
  latencyMs: number;
  errorRate: number;
  isAvailable: boolean;
  lastChecked: string;
  rateLimitRemaining?: number;
  rateLimitResetAt?: string;
}

// ============================================================
// WORKFLOWS
// ============================================================
export type WorkflowCategory =
  | 'analysis'
  | 'code'
  | 'qa'
  | 'security'
  | 'performance'
  | 'certification'
  | 'runtime'
  | 'general'
  | 'workspace'
  | 'multimodal';

export type WorkflowStatus =
  | 'pending'
  | 'validated'
  | 'authorized'
  | 'planning'
  | 'executing'
  | 'collecting_evidence'
  | 'validating'
  | 'synthesizing'
  | 'certifying'
  | 'complete'
  | 'complete_with_warnings'
  | 'failed'
  | 'rejected'
  | 'cancelled';

export type ActorType = 'ai' | 'deterministic' | 'hybrid';

export interface WorkflowExecution {
  id: string;
  traceId: string;
  workflowId: string;
  userId: string;
  workspaceId?: string;
  status: WorkflowStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  evidence?: Evidence[];
  durationMs?: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================================
// EVIDENCE
// ============================================================
export type EvidenceType =
  | 'observed'
  | 'measured'
  | 'executed'
  | 'verified'
  | 'inferred'
  | 'predicted'
  | 'recommended'
  | 'not_verified'
  | 'not_available'
  | 'not_applicable';

export interface Evidence {
  type: EvidenceType;
  category: string;
  description: string;
  data?: Record<string, unknown>;
  source: string;
  confidence: number; // 0-1
  timestamp: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  userId: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  isRead: boolean;
  action?: {
    label: string;
    href: string;
  };
  createdAt: string;
}

// ============================================================
// TOAST
// ============================================================
export interface Toast {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================
// CERTIFICATION
// ============================================================
export type CertificationVerdict = 'go' | 'go_with_warnings' | 'no_go' | 'not_verified';

export interface CertificationGateResult {
  gate: string;
  status: 'pass' | 'warn' | 'fail' | 'not_verified';
  evidence: Evidence[];
  blockers: string[];
  recommendations: string[];
}

export interface CertificationResult {
  verdict: CertificationVerdict;
  gates: CertificationGateResult[];
  summary: string;
  timestamp: string;
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'suspended';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  usage: Record<string, number>;
  startsAt: string;
  expiresAt?: string;
}

// ============================================================
// AUDIT
// ============================================================
export interface AuditEntry {
  id: string;
  userId: string;
  traceId?: string;
  action: string;
  target: string;
  result: 'success' | 'failure' | 'denied';
  context?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// CHAT / COMMAND INTERFACE
// ============================================================
export type MessageRole = 'user' | 'assistant' | 'system';
export type AttachmentType = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'zip' | 'other';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  workflowTrace?: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  sizeBytes: number;
  path: string;
}

// ============================================================
// NAVIGATION
// ============================================================
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | number;
  children?: NavItem[];
  requiredPermission?: string;
  category?: string;
}
