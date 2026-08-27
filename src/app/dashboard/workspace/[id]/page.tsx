'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, Badge, Button, Spinner } from '@/components/ui';
import { FileTree } from '@/components/workspace/FileTree';
import { toast } from '@/lib/stores';

interface WorkspaceDetail {
  id: string;
  name: string;
  status: string;
  projectMeta: any;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/workspaces`);
        const data = await res.json();
        if (res.ok) {
          const ws = data.workspaces.find((w: any) => w.id === params.id);
          if (ws) setWorkspace(ws);
          else {
            toast('error', 'Not Found', 'Workspace not found');
            router.push('/dashboard/workspace');
          }
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        toast('error', 'Error', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [params.id, router]);

  const handleRunIntelligence = async () => {
    setIsIndexing(true);
    toast('info', 'Indexing Started', 'Chunking files and generating vector embeddings...');
    try {
      const res = await fetch(`/api/workspaces/${params.id}/index`, { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast('success', 'Intelligence Complete', data.message);
    } catch (err: any) {
      toast('error', 'Indexing Failed', err.message);
    } finally {
      setIsIndexing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="nx-page" style={{ height: 'calc(100vh - var(--nx-topbar-height) - var(--nx-statusbar-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="nx-page__header" style={{ marginBottom: 'var(--nx-space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
            <button 
              onClick={() => router.push('/dashboard/workspace')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--nx-text-muted)' }}
            >
              ←
            </button>
            <h1 className="nx-page__title">{workspace.name}</h1>
            <Badge variant={workspace.status === 'ready' ? 'success' : 'neutral'}>{workspace.status}</Badge>
          </div>
        </div>
        <div className="nx-page__actions">
          <Button variant="secondary" size="sm">Settings</Button>
          <Button variant="primary" size="sm" onClick={handleRunIntelligence} isLoading={isIndexing}>
            {isIndexing ? 'Indexing...' : 'Run Intelligence'}
          </Button>
        </div>
      </div>

      <div className="nx-split" style={{ flex: 1, minHeight: 0 }}>
        {/* Sidebar: File Explorer */}
        <div className="nx-split__secondary" style={{ display: 'flex', flexDirection: 'column' }}>
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CardHeader style={{ padding: 'var(--nx-space-3) var(--nx-space-4)' }}>
              <span className="nx-card__title" style={{ fontSize: 'var(--nx-text-sm)' }}>Explorer</span>
            </CardHeader>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FileTree 
                workspaceId={workspace.id} 
                onFileSelect={(path) => setSelectedFile(path)}
              />
            </div>
          </Card>
        </div>

        {/* Main Area: File Viewer / Intelligence */}
        <div className="nx-split__primary" style={{ display: 'flex', flexDirection: 'column' }}>
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {selectedFile ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: 'var(--nx-space-3) var(--nx-space-4)', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--nx-space-2)' }}>
                  <span style={{ fontSize: '16px' }}>📄</span>
                  <span style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)', fontFamily: 'var(--nx-font-mono)' }}>
                    {selectedFile}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-muted)', background: 'var(--nx-bg-sunken)' }}>
                  <p>File content viewer will be implemented in Phase 2.3</p>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-muted)' }}>
                <span style={{ fontSize: '48px', opacity: 0.2, marginBottom: 'var(--nx-space-4)' }}>N</span>
                <p>Select a file from the explorer to view its contents</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
