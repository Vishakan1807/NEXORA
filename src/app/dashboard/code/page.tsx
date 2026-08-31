'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';
import { FileTree } from '@/components/workspace/FileTree';
import { DiffViewer } from '@/components/code/DiffViewer';
import { LinterDiagnostics, ESLintResult } from '@/components/code/LinterDiagnostics';
import { AIChat } from '@/components/chat/AIChat';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeStudioPage() {
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; isConfigured: boolean }[]>([]);
  
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffText, setDiffText] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const [lintResults, setLintResults] = useState<ESLintResult[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [hasLinted, setHasLinted] = useState(false);

  const [activeTab, setActiveTab] = useState<'assistant' | 'linters'>('assistant');

  // Fetch workspaces and providers
  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(d => {
        setWorkspaces(d.workspaces || []);
        if (d.workspaces?.length > 0) setSelectedWorkspace(d.workspaces[0].id);
      });

    fetch('/api/providers')
      .then(r => r.json())
      .then(d => {
        setProviders(d.providers || []);
        const firstActive = d.providers?.find((p: any) => p.isConfigured);
        if (firstActive) {
          setSelectedProvider(firstActive.id);
          // Set a default model based on provider
          if (firstActive.id === 'openai') setSelectedModel('gpt-4o');
          else if (firstActive.id === 'anthropic') setSelectedModel('claude-3-5-sonnet-20240620');
          else if (firstActive.id === 'google') setSelectedModel('gemini-1.5-pro');
        }
      });
  }, []);

  // Load diff AND content when file is selected
  useEffect(() => {
    if (!selectedWorkspace || !selectedFile) {
      setDiffText('');
      setFileContent('');
      return;
    }

    const fetchDiffAndContent = async () => {
      setIsLoadingDiff(true);
      setIsLoadingFile(true);
      
      try {
        // Fetch Diff
        const diffRes = await fetch(`/api/workspaces/${selectedWorkspace}/git?action=diff&file=${encodeURIComponent(selectedFile)}`);
        const diffData = await diffRes.json();
        
        if (diffRes.ok) {
          setDiffText(diffData.diff || '');
        } else {
          setDiffText('');
        }

        // Fetch Content
        const fileRes = await fetch(`/api/workspaces/${selectedWorkspace}/files?path=/${encodeURIComponent(selectedFile)}`);
        const fileData = await fileRes.json();
        if (fileRes.ok && fileData.isFile) {
          setFileContent(fileData.content || '');
        } else {
          setFileContent('');
        }
        
      } catch (err) {
        setDiffText('');
        setFileContent('');
      } finally {
        setIsLoadingDiff(false);
        setIsLoadingFile(false);
      }
    };

    fetchDiffAndContent();
  }, [selectedWorkspace, selectedFile]);

  const handleRunLinters = async () => {
    if (!selectedWorkspace) return;
    
    setIsLinting(true);
    setHasLinted(false);
    setActiveTab('linters');
    
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
          <p className="nx-page__description">Please upload a project first to view code and run diagnostics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nx-page" style={{ height: 'calc(100vh - var(--nx-topbar-height) - var(--nx-statusbar-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="nx-page__header" style={{ flexShrink: 0, marginBottom: 'var(--nx-space-4)' }}>
        <div>
          <h1 className="nx-page__title">Code Studio</h1>
          <p className="nx-page__description">Interactive Diff Engine, File Viewer, and AI Assistant</p>
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
            Project Files
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedWorkspace ? (
              <FileTree 
                workspaceId={selectedWorkspace} 
                onFileSelect={(path) => {
                  // File tree paths start with '/', remove it for git diff
                  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                  setSelectedFile(cleanPath);
                }}
              />
            ) : (
              <div style={{ padding: 'var(--nx-space-4)', color: 'var(--nx-error)', textAlign: 'center', fontSize: 'var(--nx-text-sm)' }}>
                Project not found
              </div>
            )}
          </div>
        </div>

        {/* Center Pane: Diff/File Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedFile ? (
            isLoadingDiff || isLoadingFile ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--nx-border)', borderRadius: 'var(--nx-radius)' }}>
                <Spinner size="md" />
              </div>
            ) : diffText ? (
              <DiffViewer diffText={diffText} filename={selectedFile} />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--nx-border)', borderRadius: 'var(--nx-radius)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--nx-space-2) var(--nx-space-4)', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)', fontWeight: 'bold', fontSize: '13px' }}>
                  {selectedFile} (No changes)
                </div>
                <div style={{ flex: 1, overflow: 'auto', background: '#1d1f21' }}>
                  <SyntaxHighlighter
                    language={selectedFile.split('.').pop() || 'typescript'}
                    style={atomDark}
                    customStyle={{ margin: 0, padding: '16px', fontSize: '13px', background: 'transparent' }}
                    showLineNumbers={true}
                    wrapLines={true}
                  >
                    {fileContent || '// Empty file or failed to load'}
                  </SyntaxHighlighter>
                </div>
              </div>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--nx-border)', borderRadius: 'var(--nx-radius)', color: 'var(--nx-text-muted)' }}>
              Select a file from the explorer to view code
            </div>
          )}
        </div>

        {/* Right Pane: AI Assistant & Linters */}
        <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', borderBottom: '1px solid var(--nx-border)' }}>
              <button 
                onClick={() => setActiveTab('assistant')}
                style={{ flex: 1, padding: 'var(--nx-space-3)', background: activeTab === 'assistant' ? 'var(--nx-bg-secondary)' : 'transparent', border: 'none', borderRight: '1px solid var(--nx-border)', cursor: 'pointer', fontWeight: activeTab === 'assistant' ? 'bold' : 'normal', color: activeTab === 'assistant' ? 'var(--nx-text-primary)' : 'var(--nx-text-muted)' }}
              >
                Code Assistant
              </button>
              <button 
                onClick={() => setActiveTab('linters')}
                style={{ flex: 1, padding: 'var(--nx-space-3)', background: activeTab === 'linters' ? 'var(--nx-bg-secondary)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'linters' ? 'bold' : 'normal', color: activeTab === 'linters' ? 'var(--nx-text-primary)' : 'var(--nx-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Diagnostics
                {totalErrors > 0 && <Badge variant="error">{totalErrors}</Badge>}
              </button>
            </div>

            <CardBody style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
              {activeTab === 'assistant' ? (
                <AIChat 
                  workspaceId={selectedWorkspace}
                  providerId={selectedProvider}
                  modelId={selectedModel}
                  mode="assistant"
                />
              ) : (
                !hasLinted && !isLinting ? (
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
                           const relativePath = path.includes('/') ? path.split('nexora-app/')[1] || path : path;
                           setSelectedFile(relativePath);
                        }} 
                     />
                  </div>
                )
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
