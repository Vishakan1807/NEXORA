'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Input, Spinner, EmptyState } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const user = useAuthStore(state => state.user);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.workspaces || []);
      }
    } catch (err) {
      toast('error', 'Error', 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() })
      });

      if (res.ok) {
        toast('success', 'Project Created', 'New project has been successfully created.');
        setNewProjectName('');
        setShowModal(false);
        fetchProjects();
      } else {
        const data = await res.json();
        toast('error', 'Failed', data.error || 'Failed to create project');
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Projects</h1>
          <p className="nx-page__description">Manage organizational projects and assign members.</p>
        </div>
        <div className="nx-page__actions">
          {user?.role === 'organizer' && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Add New Project</Button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardBody style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState 
              icon="📁" 
              title="No Projects Yet" 
              description="Create your first project to start mapping developers and clients." 
            />
          </CardBody>
        </Card>
      ) : (
        <div className="nx-grid nx-grid--3" style={{ gap: 'var(--nx-space-4)' }}>
          {projects.map(project => (
            <Link href={`/dashboard/projects/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
              <Card variant="interactive" style={{ height: '100%' }}>
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                      <span style={{ fontSize: '24px' }}>📁</span>
                      <h3 style={{ fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)' }}>{project.name}</h3>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--nx-space-3)', borderTop: '1px solid var(--nx-border)' }}>
                    <Badge variant="neutral">{new Date(project.createdAt).toLocaleDateString()}</Badge>
                    <span style={{ color: 'var(--nx-accent)', fontSize: 'var(--nx-text-sm)', fontWeight: 'var(--nx-weight-medium)' }}>View Details →</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--nx-bg-primary)', padding: 'var(--nx-space-6)',
            borderRadius: 'var(--nx-radius-lg)', border: '1px solid var(--nx-border)',
            maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'bold', marginBottom: 'var(--nx-space-2)', color: 'var(--nx-text-primary)' }}>Create New Project</h3>
            <p style={{ color: 'var(--nx-text-secondary)', marginBottom: 'var(--nx-space-4)' }}>Enter a name for the new organizational project.</p>
            
            <Input 
              autoFocus
              placeholder="e.g. Acme Corp Redesign" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--nx-space-3)', marginTop: 'var(--nx-space-6)' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  padding: 'var(--nx-space-2) var(--nx-space-4)', borderRadius: 'var(--nx-radius-md)',
                  background: 'transparent', border: '1px solid var(--nx-border)', color: 'var(--nx-text-primary)', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <Button variant="primary" disabled={!newProjectName.trim() || isCreating} onClick={handleCreateProject}>
                {isCreating ? <Spinner size="sm" /> : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
