'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Badge, Button, Spinner, EmptyState } from '@/components/ui';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

// Generate sample system logs (in production, these would come from a logging service)
function generateSampleLogs(): LogEntry[] {
  const sources = ['auth-service', 'workspace-engine', 'ai-orchestrator', 'api-gateway', 'db-pool', 'cache-layer'];
  const messages: Record<string, string[]> = {
    info: ['Service started successfully', 'Health check passed', 'Connection pool refreshed', 'Cache invalidated', 'Session cleanup completed'],
    warn: ['High memory usage detected (82%)', 'Slow query detected (>2s)', 'Rate limit approaching threshold', 'Connection retry attempt 2/3'],
    error: ['Failed to connect to external API', 'Database query timeout', 'Unhandled exception in worker thread'],
    debug: ['Processing request pipeline', 'Cache hit for key: workspace_meta', 'Token validation successful'],
  };

  const logs: LogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const level = (['info', 'info', 'info', 'warn', 'error', 'debug'] as const)[Math.floor(Math.random() * 6)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const msgList = messages[level];
    const message = msgList[Math.floor(Math.random() * msgList.length)];
    
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now.getTime() - i * 120000).toISOString(),
      level,
      source,
      message,
    });
  }

  return logs;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from a logging service
    setTimeout(() => {
      setLogs(generateSampleLogs());
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info': return <Badge variant="accent">INFO</Badge>;
      case 'warn': return <Badge variant="warning">WARN</Badge>;
      case 'error': return <Badge variant="error">ERROR</Badge>;
      case 'debug': return <Badge variant="neutral">DEBUG</Badge>;
      default: return <Badge variant="neutral">{level}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">System Logs</h1>
          <p className="nx-page__description">Monitor real-time system events, warnings, and errors across all services.</p>
        </div>
        <div className="nx-page__actions">
          <Button variant="secondary" size="sm" onClick={() => { setLogs(generateSampleLogs()); }}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="nx-grid nx-grid--4" style={{ marginBottom: 'var(--nx-space-4)' }}>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
            <p style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'bold', color: 'var(--nx-accent)' }}>{logs.filter(l => l.level === 'info').length}</p>
            <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Info</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
            <p style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'bold', color: 'var(--nx-warning)' }}>{logs.filter(l => l.level === 'warn').length}</p>
            <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Warnings</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
            <p style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'bold', color: 'var(--nx-error)' }}>{logs.filter(l => l.level === 'error').length}</p>
            <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Errors</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
            <p style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'bold', color: 'var(--nx-text-muted)' }}>{logs.filter(l => l.level === 'debug').length}</p>
            <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Debug</p>
          </CardBody>
        </Card>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 'var(--nx-space-4)' }}>
        <select className="nx-input nx-input--md" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warnings</option>
          <option value="error">Errors</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      {/* Log Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '80px' }}>Level</th>
                  <th style={{ width: '160px' }}>Source</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-xs)', whiteSpace: 'nowrap', fontFamily: 'var(--nx-font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>{getLevelBadge(log.level)}</td>
                    <td>
                      <code style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-accent)', background: 'var(--nx-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                        {log.source}
                      </code>
                    </td>
                    <td style={{ fontSize: 'var(--nx-text-sm)' }}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
