'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Input } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';

export default function SettingsPage() {
  const user = useAuthStore(state => state.user);
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = () => {
    // TODO: Wire up to API
    toast('success', 'Profile Updated', 'Your profile has been updated successfully.');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast('warning', 'Missing Fields', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'Mismatch', 'New password and confirmation do not match');
      return;
    }
    // TODO: Wire up to API
    toast('success', 'Password Changed', 'Your password has been updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">General Settings</h1>
          <p className="nx-page__description">Manage your account preferences and profile information.</p>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-6)' }}>
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <span className="nx-card__title">Profile Information</span>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  Email
                </label>
                <Input type="email" value={user?.email || ''} disabled />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  Display Name
                </label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  Role
                </label>
                <Input type="text" value={user?.role || ''} disabled />
              </div>
              <Button variant="primary" size="sm" onClick={handleUpdateProfile} style={{ alignSelf: 'flex-start' }}>
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <span className="nx-card__title">Change Password</span>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  Current Password
                </label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  New Password
                </label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)', marginBottom: 'var(--nx-space-1)', color: 'var(--nx-text-secondary)' }}>
                  Confirm New Password
                </label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
              <Button variant="secondary" size="sm" onClick={handleChangePassword} style={{ alignSelf: 'flex-start' }}>
                Update Password
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
