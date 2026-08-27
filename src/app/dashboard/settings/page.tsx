'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Badge, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

interface Provider {
  id: string;
  name: string;
  status: string;
  isConfigured: boolean;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      if (res.ok) {
        setProviders(data.providers);
      } else {
        toast('error', 'Error', data.error);
      }
    } catch (error) {
      toast('error', 'Network Error', 'Failed to fetch providers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveKey = async (id: string) => {
    const key = keys[id];
    if (!key) return;

    setSavingId(id);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, apiKey: key }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast('success', 'Key Saved', `Successfully updated API key for ${id}`);
        setKeys(prev => ({ ...prev, [id]: '' })); // Clear input
        fetchProviders(); // Refresh status
      } else {
        toast('error', 'Update Failed', data.error);
      }
    } catch (error) {
      toast('error', 'Network Error', 'Failed to save key');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <div className="nx-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size="lg" /></div>;
  }

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Global Settings</h1>
          <p className="nx-page__description">
            Manage platform configuration and AI Provider keys.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: 'var(--nx-text-xl)', fontWeight: 'var(--nx-weight-semibold)', marginBottom: 'var(--nx-space-4)', color: 'var(--nx-text-primary)' }}>
          AI Providers (LLMs)
        </h2>
        <p style={{ color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)' }}>
          Configure API keys to enable various LLMs in the orchestration engine. Keys are symmetrically encrypted at rest using the platform JWT secret.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
          {providers.map(provider => (
            <Card key={provider.id}>
              <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-3)' }}>
                  <span style={{ fontSize: '24px' }}>
                    {provider.id === 'openai' ? '🤖' : provider.id === 'anthropic' ? '🧠' : provider.id === 'openrouter' ? '🌌' : '🌐'}
                  </span>
                  <span className="nx-card__title">{provider.name}</span>
                </div>
                <Badge variant={provider.isConfigured ? 'success' : 'neutral'}>
                  {provider.isConfigured ? 'Connected' : 'Not Configured'}
                </Badge>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', gap: 'var(--nx-space-3)', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label={provider.isConfigured ? 'Update API Key' : 'API Key'}
                      type="password"
                      placeholder={`Enter ${provider.name} API Key...`}
                      value={keys[provider.id] || ''}
                      onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                    />
                  </div>
                  <Button 
                    variant={provider.isConfigured ? 'secondary' : 'primary'}
                    disabled={!keys[provider.id]}
                    isLoading={savingId === provider.id}
                    onClick={() => handleSaveKey(provider.id)}
                  >
                    Save Key
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
