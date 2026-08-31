'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Badge, Spinner, Input } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuthStore(state => state.user);
  const workspaceId = params.workspaceId as string;
  
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Only allow organizers or admins
    if (auth && auth.role !== 'organizer' && auth.role !== 'admin') {
      router.push('/dashboard/workspace');
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all users
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        
        // Fetch current members of this workspace
        const membersRes = await fetch(`/api/workspaces/${workspaceId}/members`);
        const membersData = await membersRes.json();
        
        if (usersRes.ok && membersRes.ok) {
          // Filter to only show developers and clients for mapping
          const mappableUsers = usersData.users?.filter((u: any) => u.role === 'developer' || u.role === 'client') || [];
          setUsers(mappableUsers);
          setMembers(membersData.members?.map((m: any) => m.userId) || []);
        } else {
          toast('error', 'Error loading data', 'Failed to fetch users or members');
        }
      } catch (err) {
        toast('error', 'Network Error', 'Failed to fetch mapping data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (auth) fetchData();
  }, [workspaceId, auth, router]);

  const toggleMember = async (userId: string, isMapped: boolean) => {
    setIsUpdating(true);
    try {
      const method = isMapped ? 'DELETE' : 'POST';
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (res.ok) {
        if (isMapped) {
          setMembers(prev => prev.filter(id => id !== userId));
          toast('success', 'Unmapped', 'User removed from project');
        } else {
          setMembers(prev => [...prev, userId]);
          toast('success', 'Mapped', 'User added to project');
        }
      } else {
        const data = await res.json();
        toast('error', 'Mapping Failed', data.error);
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to update mapping');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Project Mapping</h1>
          <p className="nx-page__description">Map Developers and Clients to this project.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/dashboard/workspace')}>
          Back to Workspaces
        </Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          <table className="nx-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Global Role</th>
                <th>Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isMapped = members.includes(user.id);
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--nx-text-muted)' }}>{user.email}</div>
                    </td>
                    <td>
                      <Badge variant={user.role === 'developer' ? 'accent' : 'neutral'}>{user.role}</Badge>
                    </td>
                    <td>
                      <Badge variant={isMapped ? 'success' : 'neutral'}>
                        {isMapped ? 'Mapped' : 'No Access'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant={isMapped ? 'danger' : 'primary'}
                        disabled={isUpdating}
                        onClick={() => toggleMember(user.id, isMapped)}
                      >
                        {isMapped ? 'Remove Access' : 'Map to Project'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--nx-space-4)' }}>
                    No mappable developers or clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
