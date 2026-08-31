'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Progress, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

interface PerfMetric {
  name: string;
  value: string;
  score: number;
  status: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

const SAMPLE_METRICS: PerfMetric[] = [
  { name: 'Build Time', value: '4.2s', score: 85, status: 'good', description: 'Time to compile and bundle the project' },
  { name: 'Bundle Size', value: '342 KB', score: 72, status: 'needs-improvement', description: 'Total JavaScript bundle size (gzipped)' },
  { name: 'First Load JS', value: '89 KB', score: 90, status: 'good', description: 'JavaScript loaded on first page visit' },
  { name: 'Largest Contentful Paint', value: '1.8s', score: 78, status: 'needs-improvement', description: 'Time for largest content element to render' },
  { name: 'Time to Interactive', value: '2.1s', score: 82, status: 'good', description: 'Time until page becomes fully interactive' },
  { name: 'Tree Shaking Efficiency', value: '94%', score: 94, status: 'good', description: 'Percentage of unused code eliminated' },
  { name: 'Code Duplication', value: '3.2%', score: 88, status: 'good', description: 'Percentage of duplicated code blocks' },
  { name: 'Import Cost', value: '156 KB', score: 65, status: 'needs-improvement', description: 'Total weight of imported dependencies' },
];

export default function PerformancePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [metrics, setMetrics] = useState<PerfMetric[]>([]);
  const [progress, setProgress] = useState(0);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setMetrics([]);
    setProgress(0);

    for (let i = 0; i <= 100; i += 12) {
      await new Promise(r => setTimeout(r, 250));
      setProgress(Math.min(i, 100));
    }

    setMetrics(SAMPLE_METRICS);
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    const avg = Math.round(SAMPLE_METRICS.reduce((a, m) => a + m.score, 0) / SAMPLE_METRICS.length);
    toast('success', 'Analysis Complete', `Overall performance score: ${avg}/100`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'var(--nx-success)';
      case 'needs-improvement': return 'var(--nx-warning)';
      case 'poor': return 'var(--nx-error)';
      default: return 'var(--nx-text-muted)';
    }
  };

  const overallScore = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.score, 0) / metrics.length) : 0;

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Performance Analyzer</h1>
          <p className="nx-page__description">Analyze build performance, bundle size, and runtime metrics of your workspace.</p>
        </div>
        <div className="nx-page__actions">
          <Button variant="primary" size="sm" onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? <><Spinner size="sm" /> Analyzing...</> : '⚡ Run Analysis'}
          </Button>
        </div>
      </div>

      {isAnalyzing && (
        <Card style={{ marginBottom: 'var(--nx-space-4)' }}>
          <CardBody>
            <p style={{ fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-2)', color: 'var(--nx-text-secondary)' }}>Running performance analysis...</p>
            <Progress value={progress} variant="default" />
          </CardBody>
        </Card>
      )}

      {!analysisComplete && !isAnalyzing && (
        <Card>
          <CardBody style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon="⚡" title="No analysis yet" description="Click 'Run Analysis' to benchmark your workspace's build and runtime performance." />
          </CardBody>
        </Card>
      )}

      {analysisComplete && (
        <>
          {/* Overall Score */}
          <Card style={{ marginBottom: 'var(--nx-space-4)' }}>
            <CardBody style={{ textAlign: 'center', padding: 'var(--nx-space-6)' }}>
              <p style={{ fontSize: '64px', fontWeight: 'bold', color: overallScore >= 80 ? 'var(--nx-success)' : overallScore >= 60 ? 'var(--nx-warning)' : 'var(--nx-error)' }}>{overallScore}</p>
              <p style={{ fontSize: 'var(--nx-text-lg)', color: 'var(--nx-text-secondary)' }}>Overall Performance Score</p>
            </CardBody>
          </Card>

          {/* Metrics Grid */}
          <div className="nx-grid nx-grid--2" style={{ gap: 'var(--nx-space-4)' }}>
            {metrics.map((metric) => (
              <Card key={metric.name}>
                <CardBody>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--nx-space-3)' }}>
                    <div>
                      <p style={{ fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>{metric.name}</p>
                      <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '2px' }}>{metric.description}</p>
                    </div>
                    <span style={{ fontSize: 'var(--nx-text-xl)', fontWeight: 'bold', color: getStatusColor(metric.status) }}>{metric.value}</span>
                  </div>
                  <Progress value={metric.score} variant={metric.score >= 80 ? 'success' : metric.score >= 60 ? 'warning' : 'error'} />
                  <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: 'var(--nx-space-1)', textAlign: 'right' }}>{metric.score}/100</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
