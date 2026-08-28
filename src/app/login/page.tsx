'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button } from '@/components/ui';
import { useAuthStore, toast } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setAuth({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        });
        toast('success', `Welcome to NEXORA`, 'Authentication successful');
        router.push('/dashboard');
      } else {
        toast('error', 'Authentication Failed', data.error);
      }
    } catch {
      toast('error', 'Network Error', 'Failed to reach authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--nx-space-4)',
      background: 'var(--nx-bg-primary)'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <CardBody style={{ padding: 'var(--nx-space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--nx-space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--nx-space-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--nx-accent), var(--nx-accent-hover))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--nx-text-on-accent)',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                N
              </div>
            </div>
            <h1 style={{ fontSize: 'var(--nx-text-2xl)', fontWeight: 'var(--nx-weight-bold)', color: 'var(--nx-text-primary)' }}>
              NEXORA
            </h1>
            <p style={{ color: 'var(--nx-text-muted)', marginTop: 'var(--nx-space-2)' }}>
              {isLogin ? 'Sign in to access your dashboard' : 'Create a new account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
            {!isLogin && (
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            )}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 'var(--nx-space-2)' }} isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--nx-space-6)' }}>
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--nx-accent)', cursor: 'pointer', fontSize: 'var(--nx-text-sm)' }}
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
