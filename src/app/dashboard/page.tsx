'use client';

import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Badge, StatusDot, Progress, EmptyState } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';
import { isAdmin } from '@/types';

const QUICK_ACTIONS = [
  { icon: '📂', label: 'Map Workspace', description: 'Connect a project directory', roles: ['admin', 'super_admin', 'organizer', 'developer'] },
  { icon: '📤', label: 'Upload Project', description: 'Upload files or ZIP archive', roles: ['admin', 'super_admin', 'organizer', 'developer'] },
  { icon: '🔍', label: 'Analyze Repository', description: 'Start project intelligence', roles: ['developer'] },
  { icon: '🧪', label: 'Run QA Suite', description: 'Execute full QA pipeline', roles: ['developer'] },
  { icon: '🔒', label: 'Security Scan', description: 'OWASP-aligned analysis', roles: ['developer'] },
  { icon: '✅', label: 'Certify Release', description: 'Production readiness check', roles: ['developer'] },
  { icon: '❓', label: 'Client Q&A', description: 'Ask questions about your projects', actionUrl: '/dashboard/qa', roles: ['client'] },
  { icon: '🔑', label: 'AI API Keys', description: 'Configure your AI provider keys', actionUrl: '/dashboard/ai-keys', roles: ['client', 'developer'] },
];

const SYSTEM_MODULES = [
  { name: 'Workspace Engine', status: 'success' as const, version: 'v0.1.0' },
  { name: 'AI Provider Platform', status: 'warning' as const, version: 'Not configured' },
  { name: 'QA Engine', status: 'success' as const, version: 'v0.1.0' },
  { name: 'Security Engine', status: 'success' as const, version: 'v0.1.0' },
  { name: 'Certification Engine', status: 'success' as const, version: 'v0.1.0' },
  { name: 'Runtime Engine', status: 'neutral' as const, version: 'Standby' },
];

export default function DashboardPage() {
  const router = useRouter();
  const auth = useAuthStore(state => state.user);
  
  const isClient = auth?.role === 'client';
  
  const visibleActions = QUICK_ACTIONS.filter(action => !action.roles || action.roles.includes(auth?.role || ''));

  return (
    <div className="nx-page">
      {/* Page Header */}
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">{isClient ? 'Client Portal' : 'Command Center'}</h1>
          <p className="nx-page__description">
            {isClient ? 'Welcome to your NEXORA Client Portal' : 'Welcome to NEXORA — your AI engineering operating system'}
          </p>
        </div>
        <div className="nx-page__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast('info', 'Command Palette', 'Press ⌘K to open the command palette')}
          >
            ⌘K Command
          </Button>
          {!isClient && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast('success', 'Welcome', 'NEXORA is ready for engineering')}
            >
              + New Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {!isClient && (
        <div className="nx-grid nx-grid--4" style={{ marginBottom: 'var(--nx-space-6)' }}>
          <Card variant="glow">
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--nx-tracking-wider)', marginBottom: '4px' }}>
                    Active Workspaces
                  </p>
                  <p style={{ fontSize: 'var(--nx-text-3xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-text-primary)' }}>
                    0
                  </p>
                </div>
                <span style={{ fontSize: '28px', opacity: 0.6 }}>📂</span>
              </div>
              <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '8px' }}>
                Map or upload a project to begin
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--nx-tracking-wider)', marginBottom: '4px' }}>
                    AI Providers
                  </p>
                  <p style={{ fontSize: 'var(--nx-text-3xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-text-primary)' }}>
                    0 / 3
                  </p>
                </div>
                <span style={{ fontSize: '28px', opacity: 0.6 }}>🤖</span>
              </div>
              <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '8px' }}>
                Configure OpenAI, Anthropic, or Gemini
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--nx-tracking-wider)', marginBottom: '4px' }}>
                    Workflows Executed
                  </p>
                  <p style={{ fontSize: 'var(--nx-text-3xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-text-primary)' }}>
                    0
                  </p>
                </div>
                <span style={{ fontSize: '28px', opacity: 0.6 }}>⚡</span>
              </div>
              <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '8px' }}>
                No workflows run yet
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--nx-tracking-wider)', marginBottom: '4px' }}>
                    System Health
                  </p>
                  <p style={{ fontSize: 'var(--nx-text-3xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-success)' }}>
                    100%
                  </p>
                </div>
                <span style={{ fontSize: '28px', opacity: 0.6 }}>💚</span>
              </div>
              <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '8px' }}>
                All systems operational
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(--nx-space-6)' }}>
        <h2 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'var(--nx-weight-semibold)', marginBottom: 'var(--nx-space-4)', color: 'var(--nx-text-primary)' }}>
          Quick Actions
        </h2>
        <div className="nx-grid nx-grid--3">
          {visibleActions.map((action: any) => (
            <Card
              key={action.label}
              variant="interactive"
              onClick={() => {
                if (action.actionUrl) {
                  router.push(action.actionUrl);
                } else {
                  toast('info', action.label, action.description);
                }
              }}
            >
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                  <span style={{ fontSize: '24px' }}>{action.icon}</span>
                  <div>
                    <p style={{ fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)', fontSize: 'var(--nx-text-sm)' }}>
                      {action.label}
                    </p>
                    <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Two-column: System Status + Recent Activity */}
      <div className="nx-split" style={{ gap: 'var(--nx-space-6)' }}>
        {/* System Modules */}
        {!isClient && (
          <div className="nx-split__primary">
            <Card>
              <CardHeader>
                <span className="nx-card__title">System Modules</span>
                <Badge variant="success" dot>All Operational</Badge>
              </CardHeader>
              <div style={{ padding: 0 }}>
                {SYSTEM_MODULES.map((mod, idx) => (
                  <div
                    key={mod.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--nx-space-3) var(--nx-space-5)',
                      borderBottom: idx < SYSTEM_MODULES.length - 1 ? '1px solid var(--nx-border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                      <StatusDot status={mod.status} pulse={mod.status === 'warning'} />
                      <span style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>
                        {mod.name}
                      </span>
                    </div>
                    <Badge variant={mod.status === 'success' ? 'success' : mod.status === 'warning' ? 'warning' : 'neutral'}>
                      {mod.version}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <div className={isClient ? 'nx-split__primary' : 'nx-split__secondary'} style={{ flex: isClient ? 1 : undefined }}>
          <Card>
            <CardHeader>
              <span className="nx-card__title">Recent Activity</span>
            </CardHeader>
            <CardBody>
              <EmptyState
                icon="📋"
                title="No activity yet"
                description={isClient ? "Your Q&A sessions will appear here." : "Your workflow executions, analyses, and results will appear here."}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
