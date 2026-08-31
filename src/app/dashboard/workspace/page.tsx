'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/lib/stores';
import { WorkspaceUploader } from '@/components/workspace/WorkspaceUploader';
import { toast } from '@/lib/stores';

interface Workspace {
  id: string;
  name: string;
  status: string;
  projectMeta: {
    languages: string[];
    frameworks: string[];
    hasTests: boolean;
    totalFiles: number;
  };
  createdAt: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      if (res.ok) {
        setWorkspaces(data.workspaces || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast('error', 'Failed to load workspaces', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
    fetchWorkspaces();
  }, []);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchWorkspaces();
  };

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Workspaces</h1>
          <p className="nx-page__description">
            Manage your codebases, analyze architecture, and prepare context for the AI.
          </p>
        </div>
        <div className="nx-page__actions">
          <Button variant="primary" onClick={() => setShowUploader(!showUploader)}>
            {showUploader ? 'Cancel' : '+ New Workspace'}
          </Button>
        </div>
      </div>

      {showUploader && (
        <div style={{ marginBottom: 'var(--nx-space-6)' }}>
          <WorkspaceUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--nx-space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : workspaces.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="📂"
              title="No Workspaces Found"
              description="Upload a ZIP archive of your repository to get started."
              action={
                <Button variant="secondary" onClick={() => setShowUploader(true)}>
                  Upload Project
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="nx-grid nx-grid--3">
          {workspaces.map((ws) => (
            <Card key={ws.id} variant="interactive" onClick={() => router.push(`/dashboard/workspace/${ws.id}`)}>
              <CardHeader>
                <span className="nx-card__title">{ws.name}</span>
                <Badge variant={ws.status === 'ready' ? 'success' : 'neutral'}>
                  {ws.status}
                </Badge>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-3)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Languages</span>
                    <div style={{ display: 'flex', gap: 'var(--nx-space-1)', flexWrap: 'wrap', marginTop: '4px' }}>
                      {ws.projectMeta?.languages?.length > 0 ? (
                        ws.projectMeta.languages.map(lang => (
                          <Badge key={lang} variant="neutral">{lang}</Badge>
                        ))
                      ) : (
                        <span style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>Unknown</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Frameworks</span>
                    <div style={{ display: 'flex', gap: 'var(--nx-space-1)', flexWrap: 'wrap', marginTop: '4px' }}>
                      {ws.projectMeta?.frameworks?.length > 0 ? (
                        ws.projectMeta.frameworks.map(fw => (
                          <Badge key={fw} variant="neutral">{fw}</Badge>
                        ))
                      ) : (
                        <span style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>None detected</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--nx-border)', paddingTop: 'var(--nx-space-3)', marginTop: 'var(--nx-space-2)' }}>
                    <div style={{ fontSize: 'var(--nx-text-xs)' }}>
                      <span style={{ color: 'var(--nx-text-muted)' }}>Files: </span>
                      <span style={{ color: 'var(--nx-text-primary)', fontWeight: 'var(--nx-weight-medium)' }}>{ws.projectMeta?.totalFiles || 0}</span>
                    </div>
                    <div style={{ fontSize: 'var(--nx-text-xs)' }}>
                      <span style={{ color: 'var(--nx-text-muted)' }}>Tests: </span>
                      <span style={{ color: 'var(--nx-text-primary)', fontWeight: 'var(--nx-weight-medium)' }}>{ws.projectMeta?.hasTests ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  
                  {/* Manage Access Button for Organizers */}
                  {(useAuthStore.getState().user?.role === 'organizer' || useAuthStore.getState().user?.role === 'admin') && (
                    <div style={{ marginTop: 'var(--nx-space-4)' }}>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        style={{ width: '100%' }}
                        onClick={() => router.push(`/dashboard/workspace/${ws.id}/members`)}
                      >
                        Manage Project Access
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
