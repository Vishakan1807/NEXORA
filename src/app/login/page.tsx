'use client';

import { useState } from 'react';
import { Card, CardBody, Input, Button, StatusDot } from '@/components/ui';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'developer' | 'admin'>('developer');

  // For Phase 1 development, we just mock the login
  // In Phase 1.6 completion, this will hit a real API endpoint to set the HTTP-only cookie
  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // We mock the API call that would set the cookie
    try {
      await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="nx-app" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--nx-bg-primary)' }}>
      <Card variant="glow" style={{ width: '100%', maxWidth: '400px' }}>
        <CardBody style={{ padding: 'var(--nx-space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--nx-space-6)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: 'var(--nx-radius-lg)', background: 'linear-gradient(135deg, var(--nx-accent), var(--nx-accent-hover))', color: 'var(--nx-text-on-accent)', fontWeight: 'var(--nx-weight-extrabold)', fontSize: 'var(--nx-text-2xl)', marginBottom: 'var(--nx-space-4)' }}>
              N
            </div>
            <h1 style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-text-primary)' }}>
              Sign in to NEXORA
            </h1>
            <p style={{ color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-sm)', marginTop: 'var(--nx-space-2)' }}>
              AI Engineering & Orchestration Platform
            </p>
          </div>

          <form onSubmit={handleMockLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="engineer@nexora.ai"
              defaultValue="test@nexora.ai"
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              defaultValue="password"
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-2)', marginTop: 'var(--nx-space-2)' }}>
              <label className="nx-input-label">Select Demo Role (For Dev Only)</label>
              <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                <Button 
                  type="button" 
                  variant={role === 'developer' ? 'primary' : 'secondary'} 
                  size="sm" 
                  fullWidth 
                  onClick={() => setRole('developer')}
                >
                  Developer
                </Button>
                <Button 
                  type="button" 
                  variant={role === 'admin' ? 'primary' : 'secondary'} 
                  size="sm" 
                  fullWidth 
                  onClick={() => setRole('admin')}
                >
                  Admin
                </Button>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} style={{ marginTop: 'var(--nx-space-4)' }}>
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
