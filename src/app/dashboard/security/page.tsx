'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Progress, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
}

const SAMPLE_FINDINGS: Finding[] = [
  { id: '1', severity: 'high', category: 'Dependency', title: 'Outdated dependency with known CVE', description: 'Package "lodash@4.17.15" has a known prototype pollution vulnerability (CVE-2020-28500).', file: 'package.json', line: 12 },
  { id: '2', severity: 'medium', category: 'Secrets', title: 'Potential hardcoded secret detected', description: 'A string matching API key pattern was found in source code. Consider using environment variables.', file: 'src/config.ts', line: 8 },
  { id: '3', severity: 'low', category: 'Best Practice', title: 'Missing Content-Security-Policy header', description: 'The application does not set a Content-Security-Policy header, which helps prevent XSS attacks.' },
  { id: '4', severity: 'info', category: 'Configuration', title: 'Debug mode enabled', description: 'Debug logging is enabled. Ensure this is disabled in production deployments.' },
  { id: '5', severity: 'critical', category: 'Authentication', title: 'JWT secret using default value', description: 'The JWT_SECRET environment variable is using a default fallback. Set a strong unique secret in production.', file: 'src/lib/auth/jwt.ts', line: 5 },
];

export default function SecurityPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  const runScan = async () => {
    setIsScanning(true);
    setScanComplete(false);
    setFindings([]);
    setScanProgress(0);

    // Simulate a scan progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setScanProgress(i);
    }

    setFindings(SAMPLE_FINDINGS);
    setIsScanning(false);
    setScanComplete(true);
    toast('success', 'Scan Complete', `Found ${SAMPLE_FINDINGS.length} findings`);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="error">Critical</Badge>;
      case 'high': return <Badge variant="error">High</Badge>;
      case 'medium': return <Badge variant="warning">Medium</Badge>;
      case 'low': return <Badge variant="accent">Low</Badge>;
      case 'info': return <Badge variant="neutral">Info</Badge>;
      default: return <Badge variant="neutral">{severity}</Badge>;
    }
  };

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Security Scanner</h1>
          <p className="nx-page__description">OWASP-aligned security analysis for your workspace codebase.</p>
        </div>
        <div className="nx-page__actions">
          <Button variant="primary" size="sm" onClick={runScan} disabled={isScanning}>
            {isScanning ? <><Spinner size="sm" /> Scanning...</> : '🔒 Run Security Scan'}
          </Button>
        </div>
      </div>

      {isScanning && (
        <Card style={{ marginBottom: 'var(--nx-space-4)' }}>
          <CardBody>
            <p style={{ fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-2)', color: 'var(--nx-text-secondary)' }}>
              Scanning workspace for vulnerabilities...
            </p>
            <Progress value={scanProgress} variant={scanProgress < 100 ? 'default' : 'success'} />
            <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: 'var(--nx-space-2)' }}>
              {scanProgress < 30 ? 'Analyzing dependencies...' : scanProgress < 60 ? 'Scanning for secrets...' : scanProgress < 90 ? 'Checking configurations...' : 'Finalizing report...'}
            </p>
          </CardBody>
        </Card>
      )}

      {!scanComplete && !isScanning && (
        <Card>
          <CardBody style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon="🔒" title="No scans yet" description="Click 'Run Security Scan' to analyze your workspace for vulnerabilities, secrets, and misconfigurations." />
          </CardBody>
        </Card>
      )}

      {scanComplete && (
        <>
          {/* Summary */}
          <div className="nx-grid nx-grid--5" style={{ marginBottom: 'var(--nx-space-4)' }}>
            {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
              const count = findings.filter(f => f.severity === sev).length;
              const colors: Record<string, string> = { critical: 'var(--nx-error)', high: 'var(--nx-error)', medium: 'var(--nx-warning)', low: 'var(--nx-accent)', info: 'var(--nx-text-muted)' };
              return (
                <Card key={sev}>
                  <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
                    <p style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'bold', color: colors[sev] }}>{count}</p>
                    <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', textTransform: 'capitalize' }}>{sev}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Findings */}
          <Card>
            <CardHeader>
              <span className="nx-card__title">Findings</span>
              <Badge variant="neutral">{findings.length} total</Badge>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {findings.map((finding, idx) => (
                <div key={finding.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--nx-space-3)', padding: 'var(--nx-space-4) var(--nx-space-5)', borderBottom: idx < findings.length - 1 ? '1px solid var(--nx-border)' : 'none' }}>
                  <div style={{ minWidth: '80px' }}>{getSeverityBadge(finding.severity)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>{finding.title}</p>
                    <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '4px' }}>{finding.description}</p>
                    {finding.file && (
                      <code style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-accent)', marginTop: '4px', display: 'inline-block' }}>
                        {finding.file}{finding.line ? `:${finding.line}` : ''}
                      </code>
                    )}
                  </div>
                  <Badge variant="neutral" style={{ fontSize: 'var(--nx-text-xs)' }}>{finding.category}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
