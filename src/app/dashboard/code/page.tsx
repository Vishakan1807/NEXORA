'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';
import { FileTree } from '@/components/workspace/FileTree';
import { DiffViewer } from '@/components/code/DiffViewer';
import { LinterDiagnostics, ESLintResult } from '@/components/code/LinterDiagnostics';

export default function CodeStudioPage() {
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffText, setDiffText] = useState<string>('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  
  const [lintResults, setLintResults] = useState<ESLintResult[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [hasLinted, setHasLinted] = useState(false);

  // Fetch workspaces
  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(d => {
        setWorkspaces(d.workspaces || []);
        if (d.workspaces?.length > 0) setSelectedWorkspace(d.workspaces[0].id);
      });
  }, []);

  // Load diff when file is selected
  useEffect(() => {
    if (!selectedWorkspace || !selectedFile) {
      setDiffText('');
      return;
    }

    const fetchDiff = async () => {
      setIsLoadingDiff(true);
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/git?action=diff&file=${encodeURIComponent(selectedFile)}`);
        const data = await res.json();
        
        if (res.ok) {
          setDiffText(data.diff || '');
        } else {
          toast('error', 'Failed to load diff', data.error);
          setDiffText('');
        }
      } catch (err) {
        toast('error', 'Network error', 'Failed to load diff');
        setDiffText('');
      } finally {
        setIsLoadingDiff(false);
      }
    };

    fetchDiff();
  }, [selectedWorkspace, selectedFile]);

  const handleRunLinters = async () => {
    if (!selectedWorkspace) return;
    
    setIsLinting(true);
    setHasLinted(false);
    
    try {
      const res = await fetch(`/api/workspaces/${selectedWorkspace}/lint`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok || (res.status === 500 && data.results)) {
        setLintResults(data.results || []);
        toast('success', 'Linting Complete', `Found ${data.results?.length || 0} files with issues.`);
      } else {
        toast('error', 'Linting Failed', data.error);
      }
    } catch (err) {
      toast('error', 'Network error', 'Failed to run linters');
    } finally {
      setIsLinting(false);
      setHasLinted(true);
    }
  };

  const totalErrors = lintResults.reduce((acc, r) => acc + r.errorCount, 0);

  if (workspaces.length === 0) {
    return (
      <div className="nx-page">
        <div className="nx-page__header">
          <h1 className="nx-page__title">Code Studio</h1>
          <p className="nx-page__description">Please map a workspace first to view code and run diagnostics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nx-page" style={{ height: 'calc(100vh - var(--nx-topbar-height) - var(--nx-statusbar-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="nx-page__header" style={{ flexShrink: 0, marginBottom: 'var(--nx-space-4)' }}>
        <div>
          <h1 className="nx-page__title">Code Studio</h1>
          <p className="nx-page__description">Interactive Diff Engine and Automated Linting</p>
        </div>
        <div className="nx-page__actions" style={{ display: 'flex', gap: 'var(--nx-space-4)', alignItems: 'center' }}>
          <select 
            value={selectedWorkspace} 
            onChange={e => setSelectedWorkspace(e.target.value)}
            className="nx-input nx-input--md"
            style={{ minWidth: '200px' }}
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleRunLinters}
            isLoading={isLinting}
          >
            {isLinting ? 'Running Linters...' : 'Run Linters'}
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 'var(--nx-space-4)', minHeight: 0 }}>
        
        {/* Left Pane: Explorer */}
        <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--nx-bg-primary)', borderRadius: 'var(--nx-radius)', border: '1px solid var(--nx-border)' }}>
          <div style={{ padding: 'var(--nx-space-3)', borderBottom: '1px solid var(--nx-border)', fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)' }}>
            Workspace Files
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedWorkspace && (
              <FileTree 
                workspaceId={selectedWorkspace} 
                onFileSelect={(path) => {
                  // File tree paths start with '/', remove it for git diff
                  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                  setSelectedFile(cleanPath);
                }}
              />
            )}
          </div>
        </div>

        {/* Center Pane: Diff Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedFile ? (
            isLoadingDiff ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--nx-border)', borderRadius: 'var(--nx-radius)' }}>
                <Spinner size="md" />
              </div>
            ) : (
              <DiffViewer diffText={diffText} filename={selectedFile} />
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--nx-border)', borderRadius: 'var(--nx-radius)', color: 'var(--nx-text-muted)' }}>
              Select a file from the explorer to view diffs
            </div>
          )}
        </div>

        {/* Right Pane: Linter Results */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader style={{ flexShrink: 0 }}>
              <span className="nx-card__title">Linter Diagnostics</span>
              {hasLinted && <Badge variant={totalErrors > 0 ? "error" : "success"}>{totalErrors > 0 ? `${totalErrors} Errors` : 'Clean'}</Badge>}
            </CardHeader>
            <CardBody style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
              {!hasLinted && !isLinting ? (
                <div style={{ padding: 'var(--nx-space-4)', textAlign: 'center', color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-sm)', marginTop: '40px' }}>
                  Run linters to see diagnostics for this workspace.
                </div>
              ) : isLinting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Spinner size="sm" /> <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--nx-text-muted)' }}>Analyzing code...</span>
                </div>
              ) : (
                <div style={{ height: '100%', padding: 'var(--nx-space-3)' }}>
                   <LinterDiagnostics 
                      results={lintResults} 
                      onFileSelect={(path) => {
                         // Convert absolute path from ESLint to relative workspace path
                         // Hacky for now: just grab the filename if it's absolute
                         const relativePath = path.includes('/') ? path.split('nexora-app/')[1] || path : path;
                         setSelectedFile(relativePath);
                      }} 
                   />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
