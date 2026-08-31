'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Badge, Input, Spinner, EmptyState } from '@/components/ui';
import { toast } from '@/lib/stores';

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  target: string;
  result: string;
  context: any;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        toast('error', 'Error', 'Failed to fetch audit logs');
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.result === filter);

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success': return <Badge variant="success">Success</Badge>;
      case 'failure': return <Badge variant="error">Failed</Badge>;
      case 'denied': return <Badge variant="warning">Denied</Badge>;
      default: return <Badge variant="neutral">{result}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    if (action.includes('role')) return '👤';
    if (action.includes('create')) return '➕';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('key') || action.includes('api')) return '🔑';
    return '📋';
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Security Audit</h1>
          <p className="nx-page__description">Review all security-related events and user actions across the platform.</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--nx-space-4)', display: 'flex', gap: 'var(--nx-space-3)' }}>
        <select
          className="nx-input nx-input--md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="all">All Events</option>
          <option value="success">Success</option>
          <option value="failure">Failures</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <span className="nx-card__title">Audit Trail</span>
          <Badge variant="neutral">{filteredLogs.length} events</Badge>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: 'var(--nx-space-8)' }}>
              <EmptyState
                icon="🛡️"
                title="No audit events"
                description="Security events will appear here as users interact with the platform."
              />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="nx-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Timestamp</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>User</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-xs)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-2)' }}>
                          <span>{getActionIcon(log.action)}</span>
                          <span style={{ fontWeight: 'var(--nx-weight-medium)' }}>{log.action}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--nx-text-secondary)' }}>{log.target}</td>
                      <td style={{ fontSize: 'var(--nx-text-sm)' }}>{log.userName || log.userEmail || log.userId || 'System'}</td>
                      <td>{getResultBadge(log.result)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
