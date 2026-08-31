'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

interface RuntimeProcess {
  id: string;
  name: string;
  command: string;
  status: 'running' | 'stopped' | 'error';
  pid: number | null;
  port: number | null;
  uptime: string;
  cpu: string;
  memory: string;
}

const SAMPLE_PROCESSES: RuntimeProcess[] = [
  { id: '1', name: 'Dev Server', command: 'npm run dev', status: 'stopped', pid: null, port: 3000, uptime: '-', cpu: '-', memory: '-' },
  { id: '2', name: 'Database', command: 'docker compose up db', status: 'stopped', pid: null, port: 5432, uptime: '-', cpu: '-', memory: '-' },
  { id: '3', name: 'Redis Cache', command: 'docker compose up redis', status: 'stopped', pid: null, port: 6379, uptime: '-', cpu: '-', memory: '-' },
];

export default function RuntimePage() {
  const [processes, setProcesses] = useState<RuntimeProcess[]>(SAMPLE_PROCESSES);
  const [starting, setStarting] = useState<string | null>(null);

  const toggleProcess = async (id: string) => {
    setStarting(id);
    await new Promise(r => setTimeout(r, 1500));

    setProcesses(prev => prev.map(p => {
      if (p.id === id) {
        const isNowRunning = p.status !== 'running';
        return {
          ...p,
          status: isNowRunning ? 'running' as const : 'stopped' as const,
          pid: isNowRunning ? Math.floor(Math.random() * 50000) + 10000 : null,
          uptime: isNowRunning ? '0m 1s' : '-',
          cpu: isNowRunning ? `${(Math.random() * 5).toFixed(1)}%` : '-',
          memory: isNowRunning ? `${Math.floor(Math.random() * 200 + 50)} MB` : '-',
        };
      }
      return p;
    }));

    const proc = processes.find(p => p.id === id);
    const action = proc?.status === 'running' ? 'stopped' : 'started';
    toast('success', `Process ${action}`, `${proc?.name} has been ${action}`);
    setStarting(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge variant="success" dot>Running</Badge>;
      case 'stopped': return <Badge variant="neutral">Stopped</Badge>;
      case 'error': return <Badge variant="error">Error</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Runtime Manager</h1>
          <p className="nx-page__description">Start, stop, and monitor workspace services and background processes.</p>
        </div>
      </div>

      {/* Process Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
        {processes.map(proc => (
          <Card key={proc.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-4)', flex: 1 }}>
                  <div style={{ minWidth: '180px' }}>
                    <p style={{ fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)' }}>{proc.name}</p>
                    <code style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>{proc.command}</code>
                  </div>
                  <div>{getStatusBadge(proc.status)}</div>
                  {proc.status === 'running' && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>PID</p>
                        <p style={{ fontSize: 'var(--nx-text-sm)', fontFamily: 'var(--nx-font-mono)' }}>{proc.pid}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Port</p>
                        <p style={{ fontSize: 'var(--nx-text-sm)', fontFamily: 'var(--nx-font-mono)' }}>{proc.port}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>CPU</p>
                        <p style={{ fontSize: 'var(--nx-text-sm)' }}>{proc.cpu}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Memory</p>
                        <p style={{ fontSize: 'var(--nx-text-sm)' }}>{proc.memory}</p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant={proc.status === 'running' ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={starting === proc.id}
                  onClick={() => toggleProcess(proc.id)}
                >
                  {starting === proc.id ? <Spinner size="sm" /> : proc.status === 'running' ? '⏹ Stop' : '▶ Start'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
