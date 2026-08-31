'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Badge, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';

export default function SettingsPage() {
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

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">General Settings</h1>
          <p className="nx-page__description">Manage your personal preferences and API keys.</p>
        </div>
      </div>
      
      <div className="nx-grid nx-grid--1" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <span className="nx-card__title">Personal AI Keys</span>
          </CardHeader>
          <CardBody>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)' }}>
              Configure your own API keys. When provided, NEXORA will use your personal key instead of the platform's global key for all your operations. Keys are encrypted securely at rest.
            </p>
            
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--nx-space-8)' }}>
                <Spinner size="md" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-6)' }}>
                
                {/* OpenAI */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--nx-space-2)' }}>
                    <label style={{ fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)' }}>
                      OpenAI (GPT-4o, GPT-3.5)
                    </label>
                    <Badge variant={isConfigured('openai') ? 'success' : 'neutral'}>
                      {isConfigured('openai') ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                    <Input 
                      type="password" 
                      placeholder={isConfigured('openai') ? 'sk-proj-... (Configured)' : 'sk-proj-...'} 
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                    <Button 
                      variant="primary" 
                      disabled={!openaiKey.trim() || isSaving === 'openai'} 
                      onClick={() => handleSaveKey('openai', openaiKey)}
                    >
                      {isSaving === 'openai' ? <Spinner size="sm" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Anthropic */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--nx-space-2)' }}>
                    <label style={{ fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)' }}>
                      Anthropic (Claude 3.5 Sonnet)
                    </label>
                    <Badge variant={isConfigured('anthropic') ? 'success' : 'neutral'}>
                      {isConfigured('anthropic') ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                    <Input 
                      type="password" 
                      placeholder={isConfigured('anthropic') ? 'sk-ant-... (Configured)' : 'sk-ant-...'} 
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                    />
                    <Button 
                      variant="primary" 
                      disabled={!anthropicKey.trim() || isSaving === 'anthropic'} 
                      onClick={() => handleSaveKey('anthropic', anthropicKey)}
                    >
                      {isSaving === 'anthropic' ? <Spinner size="sm" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Gemini */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--nx-space-2)' }}>
                    <label style={{ fontWeight: 'var(--nx-weight-medium)', fontSize: 'var(--nx-text-sm)' }}>
                      Google Gemini (1.5 Pro)
                    </label>
                    <Badge variant={isConfigured('gemini') ? 'success' : 'neutral'}>
                      {isConfigured('gemini') ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
                    <Input 
                      type="password" 
                      placeholder={isConfigured('gemini') ? 'AIzaSy... (Configured)' : 'AIzaSy...'} 
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <Button 
                      variant="primary" 
                      disabled={!geminiKey.trim() || isSaving === 'gemini'} 
                      onClick={() => handleSaveKey('gemini', geminiKey)}
                    >
                      {isSaving === 'gemini' ? <Spinner size="sm" /> : 'Save'}
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
