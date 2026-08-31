'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [project, setProject] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  const auth = useAuthStore(state => state.user);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch project details (we can filter from workspaces)
      const wsRes = await fetch('/api/workspaces');
      if (wsRes.ok) {
        const data = await wsRes.json();
        const found = (data.workspaces || []).find((w: any) => w.id === projectId);
        setProject(found);
      }

      // Fetch all users for dropdown
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        // Filter out the current user from being added
        setAllUsers((data.users || []).filter((u: any) => u.id !== auth?.id));
      }

      // Fetch current members mapped to this workspace
      await fetchMembers();
    } catch (err) {
      toast('error', 'Error', 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/workspaces/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });
      
      if (res.ok) {
        toast('success', 'Member Added', 'User has been added to the project');
        setSelectedUser('');
        fetchMembers();
      } else {
        const data = await res.json();
        toast('error', 'Failed', data.error || 'Could not add member');
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/workspaces/${projectId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        toast('success', 'Member Removed', 'User has been removed from the project');
        fetchMembers();
      } else {
        const data = await res.json();
        toast('error', 'Failed', data.error || 'Could not remove member');
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to remove member');
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  if (!project) {
    return (
      <div className="nx-page">
        <EmptyState icon="❌" title="Project Not Found" description="The project you are looking for does not exist or you don't have access." />
      </div>
    );
  }

  // Get full user details for members by mapping member.userId to allUsers list
  const mappedMembers = members.map(m => {
    const u = allUsers.find(user => user.id === m.userId);
    return u ? { ...m, ...u } : m;
  });

  // Filter out users who are already members for the dropdown
  const availableUsers = allUsers.filter(u => !members.some(m => m.userId === u.id));

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">{project.name}</h1>
          <p className="nx-page__description">
            Status: <Badge variant="neutral">{project.status}</Badge> · Created: {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <span className="nx-card__title">Project Members</span>
          <Badge variant="neutral">{mappedMembers.length} Members</Badge>
        </CardHeader>
        <CardBody style={{ paddingTop: 0 }}>
          
          {/* Add Member Form - Only for Organizers/Admins */}
          {(auth?.role === 'organizer' || auth?.role === 'admin' || auth?.role === 'super_admin') && (
            <div style={{ display: 'flex', gap: 'var(--nx-space-3)', paddingBottom: 'var(--nx-space-4)', marginBottom: 'var(--nx-space-4)', borderBottom: '1px solid var(--nx-border)' }}>
              <select 
                className="nx-input nx-input--md" 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ flex: 1, maxWidth: '400px' }}
              >
                <option value="">Select a user to add...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
              <Button variant="primary" disabled={!selectedUser || isAdding} onClick={handleAddMember}>
                {isAdding ? <Spinner size="sm" /> : '+ Add Member'}
              </Button>
            </div>
          )}

          {/* Members List */}
          {mappedMembers.length === 0 ? (
            <EmptyState icon="👥" title="No Members" description="Add clients or developers to this project so they can access it." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="nx-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--nx-bg-elevated)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--nx-text-primary)'
                          }}>
                            {member.name ? member.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>{member.name || 'Unknown'}</div>
                            <div style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>{member.email || member.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {member.role ? (
                           <Badge variant={member.role === 'developer' ? 'accent' : 'neutral'}>{member.role}</Badge>
                        ) : '-'}
                      </td>
                      <td style={{ color: 'var(--nx-text-muted)' }}>{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td>
                        {(auth?.role === 'organizer' || auth?.role === 'admin' || auth?.role === 'super_admin') ? (
                          <Button variant="secondary" size="sm" onClick={() => handleRemoveMember(member.userId)}>Remove</Button>
                        ) : '-'}
                      </td>
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
