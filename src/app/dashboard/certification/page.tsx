'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Progress, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

interface Gate {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'pending';
  score: number;
  details: string;
}

const CERTIFICATION_GATES: Gate[] = [
  { name: 'Code Quality', status: 'pending', score: 0, details: 'Lint rules, code complexity, and style compliance' },
  { name: 'Test Coverage', status: 'pending', score: 0, details: 'Unit test coverage must exceed 80%' },
  { name: 'Security Scan', status: 'pending', score: 0, details: 'No critical or high vulnerabilities' },
  { name: 'Dependency Audit', status: 'pending', score: 0, details: 'All dependencies must be up to date' },
  { name: 'Build Verification', status: 'pending', score: 0, details: 'Production build must succeed without errors' },
  { name: 'Performance Budget', status: 'pending', score: 0, details: 'Bundle size under 500KB, LCP under 2.5s' },
];

export default function CertificationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [gates, setGates] = useState<Gate[]>(CERTIFICATION_GATES);
  const [currentGate, setCurrentGate] = useState(0);

  const runCertification = async () => {
    setIsRunning(true);
    setIsComplete(false);
    setGates(CERTIFICATION_GATES.map(g => ({ ...g, status: 'pending', score: 0 })));
    setCurrentGate(0);

    for (let i = 0; i < CERTIFICATION_GATES.length; i++) {
      setCurrentGate(i);
      await new Promise(r => setTimeout(r, 1200));

      const score = Math.floor(Math.random() * 30) + 70;
      const status: Gate['status'] = score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail';

      setGates(prev => prev.map((g, idx) => idx === i ? { ...g, score, status } : g));
    }

    setIsRunning(false);
    setIsComplete(true);
    toast('success', 'Certification Complete', 'All gates have been evaluated');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warn': return '⚠️';
      case 'fail': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge variant="success">Pass</Badge>;
      case 'warn': return <Badge variant="warning">Warning</Badge>;
      case 'fail': return <Badge variant="error">Fail</Badge>;
      case 'pending': return <Badge variant="neutral">Pending</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const passCount = gates.filter(g => g.status === 'pass').length;
  const warnCount = gates.filter(g => g.status === 'warn').length;
  const failCount = gates.filter(g => g.status === 'fail').length;
  const overallVerdict = failCount > 0 ? 'NO GO' : warnCount > 0 ? 'GO WITH WARNINGS' : isComplete ? 'GO' : 'PENDING';

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Release Certification</h1>
          <p className="nx-page__description">Run all quality gates to certify your workspace for production readiness.</p>
        </div>
        <div className="nx-page__actions">
          <Button variant="primary" size="sm" onClick={runCertification} disabled={isRunning}>
            {isRunning ? <><Spinner size="sm" /> Running...</> : '✅ Certify Release'}
          </Button>
        </div>
      </div>

      {isComplete && (
        <Card style={{ marginBottom: 'var(--nx-space-4)' }}>
          <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-6)' }}>
            <p style={{
              fontSize: 'var(--nx-text-3xl)', fontWeight: 'bold',
              color: overallVerdict === 'GO' ? 'var(--nx-success)' : overallVerdict === 'NO GO' ? 'var(--nx-error)' : 'var(--nx-warning)'
            }}>
              {overallVerdict}
            </p>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginTop: 'var(--nx-space-2)' }}>
              {passCount} passed · {warnCount} warnings · {failCount} failed
            </p>
          </CardBody>
        </Card>
      )}

      {!isComplete && !isRunning && (
        <Card style={{ marginBottom: 'var(--nx-space-4)' }}>
          <CardBody style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon="✅" title="Ready to Certify" description="Click 'Certify Release' to evaluate all quality gates for production readiness." />
          </CardBody>
        </Card>
      )}

      {/* Gates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-3)' }}>
        {gates.map((gate, idx) => (
          <Card key={gate.name} variant={isRunning && currentGate === idx ? 'glow' : undefined}>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)', flex: 1 }}>
                  <span style={{ fontSize: '20px' }}>{isRunning && currentGate === idx ? '🔄' : getStatusIcon(gate.status)}</span>
                  <div>
                    <p style={{ fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>{gate.name}</p>
                    <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>{gate.details}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                  {gate.status !== 'pending' && (
                    <span style={{ fontWeight: 'bold', fontSize: 'var(--nx-text-sm)', color: gate.score >= 90 ? 'var(--nx-success)' : gate.score >= 70 ? 'var(--nx-warning)' : 'var(--nx-error)' }}>
                      {gate.score}/100
                    </span>
                  )}
                  {getStatusBadge(gate.status)}
                </div>
              </div>
              {gate.status !== 'pending' && (
                <div style={{ marginTop: 'var(--nx-space-2)' }}>
                  <Progress value={gate.score} variant={gate.score >= 90 ? 'success' : gate.score >= 70 ? 'warning' : 'error'} />
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
