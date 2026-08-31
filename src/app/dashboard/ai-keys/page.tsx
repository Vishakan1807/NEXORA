'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Badge, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

export default function AIKeysPage() {
  const [keys, setKeys] = useState<{ providerId: string; isConfigured: boolean; updatedAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/user/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSaveKey = async (providerId: string, apiKey: string) => {
    if (!apiKey.trim()) {
      toast('warning', 'API Key Required', 'Please enter a valid API key');
      return;
    }
    
    setIsSaving(providerId);
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast('success', 'Key Saved', `Your ${providerId} API key has been securely saved.`);
        if (providerId === 'openai') setOpenaiKey('');
        if (providerId === 'anthropic') setAnthropicKey('');
        if (providerId === 'gemini') setGeminiKey('');
        fetchKeys();
      } else {
        toast('error', 'Save Failed', data.error || 'Failed to save key');
      }
    } catch (err) {
      toast('error', 'Network Error', 'Failed to save key');
    } finally {
      setIsSaving(null);
    }
  };

  const isConfigured = (providerId: string) => keys.some(k => k.providerId === providerId && k.isConfigured);

  const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', models: 'GPT-4o, GPT-4, GPT-3.5', placeholder: 'sk-proj-...', key: openaiKey, setKey: setOpenaiKey },
    { id: 'anthropic', name: 'Anthropic', models: 'Claude 3.5 Sonnet, Claude 3 Opus', placeholder: 'sk-ant-...', key: anthropicKey, setKey: setAnthropicKey },
    { id: 'gemini', name: 'Google Gemini', models: 'Gemini 1.5 Pro, Gemini Flash', placeholder: 'AIzaSy...', key: geminiKey, setKey: setGeminiKey },
  ];

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">AI API Keys</h1>
          <p className="nx-page__description">Configure your personal API keys for AI providers. Your keys are encrypted and stored securely.</p>
        </div>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <span className="nx-card__title">🔑 Personal API Keys</span>
          </CardHeader>
          <CardBody>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)' }}>
              When provided, NEXORA will use your personal key for all your AI operations (Q&A, Code Assistant, etc.) instead of the platform&apos;s global key.
            </p>
            
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--nx-space-8)' }}>
                <Spinner size="md" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-6)' }}>
                {PROVIDERS.map((provider) => (
                  <div key={provider.id} style={{ 
                    padding: 'var(--nx-space-4)', 
                    borderRadius: 'var(--nx-radius-lg)', 
                    border: '1px solid var(--nx-border)',
                    background: 'var(--nx-surface-secondary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--nx-space-3)' }}>
                      <div>
                        <label style={{ fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)' }}>
                          {provider.name}
                        </label>
                        <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: '2px' }}>
                          Models: {provider.models}
                        </p>
                      </div>
                      <Badge variant={isConfigured(provider.id) ? 'success' : 'neutral'}>
                        {isConfigured(provider.id) ? '✓ Configured' : 'Not Configured'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                      <Input 
                        type="password" 
                        placeholder={isConfigured(provider.id) ? `${provider.placeholder} (Already saved)` : provider.placeholder} 
                        value={provider.key}
                        onChange={(e) => provider.setKey(e.target.value)}
                      />
                      <Button 
                        variant="primary" 
                        disabled={!provider.key.trim() || isSaving === provider.id} 
                        onClick={() => handleSaveKey(provider.id, provider.key)}
                      >
                        {isSaving === provider.id ? <Spinner size="sm" /> : 'Save'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
