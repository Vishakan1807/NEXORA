'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Badge, Spinner, EmptyState } from '@/components/ui';
import { toast, useAuthStore } from '@/lib/stores';
import { isAdmin } from '@/types';

interface Provider {
  id: string;
  name: string;
  status: string;
  isConfigured: boolean;
  updatedAt: string;
}

const MODEL_INFO: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  openrouter: ['meta-llama/llama-3-70b-instruct', 'mistralai/mixtral-8x7b'],
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const auth = useAuthStore(state => state.user);
  const userIsAdmin = isAdmin(auth?.role || '');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (err) {
      toast('error', 'Error', 'Failed to fetch providers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key?.trim()) return;

    setSaving(providerId);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerId, apiKey: key })
      });

      if (res.ok) {
        toast('success', 'Provider Updated', `${providerId} API key saved successfully`);
        setApiKeys(prev => ({ ...prev, [providerId]: '' }));
        fetchProviders();
      } else {
        const data = await res.json();
        toast('error', 'Error', data.error);
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to save key');
    } finally {
      setSaving(null);
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'openai': return '🟢';
      case 'anthropic': return '🟠';
      case 'google': return '🔵';
      case 'openrouter': return '🟣';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">AI Providers</h1>
          <p className="nx-page__description">
            {userIsAdmin ? 'Configure global AI provider API keys for the platform.' : 'View the status of available AI providers. Configure your personal keys in AI API Keys.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--nx-space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                  <span style={{ fontSize: '28px' }}>{getProviderIcon(provider.id)}</span>
                  <div>
                    <h3 style={{ fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)' }}>{provider.name}</h3>
                    <div style={{ display: 'flex', gap: 'var(--nx-space-2)', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(MODEL_INFO[provider.id] || []).map(model => (
                        <code key={model} style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', background: 'var(--nx-bg-elevated)', padding: '1px 6px', borderRadius: '4px' }}>
                          {model}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
                <Badge variant={provider.isConfigured ? 'success' : 'neutral'} dot>
                  {provider.isConfigured ? 'Connected' : 'Not Configured'}
                </Badge>
              </div>

              {userIsAdmin && (
                <div style={{ display: 'flex', gap: 'var(--nx-space-2)', marginTop: 'var(--nx-space-3)' }}>
                  <Input
                    type="password"
                    placeholder={provider.isConfigured ? 'Enter new key to update...' : 'Enter API key...'}
                    value={apiKeys[provider.id] || ''}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                  />
                  <Button
                    variant="primary"
                    disabled={!apiKeys[provider.id]?.trim() || saving === provider.id}
                    onClick={() => handleSaveKey(provider.id)}
                  >
                    {saving === provider.id ? <Spinner size="sm" /> : 'Save'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
