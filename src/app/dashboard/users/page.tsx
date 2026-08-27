'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Button, Badge, Input, Spinner } from '@/components/ui';
import { useAuthStore, toast } from '@/lib/stores';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const auth = useAuthStore(state => state.user);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast('error', 'Error', data.error);
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast('success', 'Role Updated', data.message);
        fetchUsers();
      } else {
        toast('error', 'Update Failed', data.error);
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to update user role');
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">User Management</h1>
          <p className="nx-page__description">
            Manage engineers, orchestrators, and system administrators.
          </p>
        </div>
        <div className="nx-page__actions">
          <Button variant="secondary" size="sm">Export CSV</Button>
          <Button variant="primary" size="sm">+ Invite User</Button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--nx-space-4)', display: 'flex', gap: 'var(--nx-space-4)' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <Input placeholder="Search users by name or email..." />
        </div>
        <select className="nx-input nx-input--md">
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="developer">Developers</option>
        </select>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                        <div style={{ 
                          width: '32px', height: '32px', 
                          borderRadius: '50%', 
                          background: 'var(--nx-bg-elevated)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', color: 'var(--nx-text-primary)'
                        }}>
                          {user.name ? user.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'accent' : 'neutral'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={user.status === 'active' ? 'success' : 'neutral'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--nx-text-muted)' }}>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                        {user.role === 'developer' ? (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            disabled={isUpdating === user.id}
                            onClick={() => handleRoleChange(user.id, 'admin')}
                          >
                            Promote to Admin
                          </Button>
                        ) : user.role === 'admin' ? (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            disabled={isUpdating === user.id || auth?.id === user.id}
                            onClick={() => handleRoleChange(user.id, 'developer')}
                          >
                            Demote
                          </Button>
                        ) : (
                          <span style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)' }}>Super Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
