'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Card, CardBody, Input, Button, Badge } from '@/components/ui';
import { toast } from '@/lib/stores';
import ReactMarkdown from 'react-markdown';

// Define available models for each provider
const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Fast & Capable)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
  ],
  google: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
    { id: 'mistralai/mistral-large', name: 'Mistral Large' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OR)' }
  ]
};

export default function ChatPage() {
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; status: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; isConfigured: boolean }[]>([]);
  
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  // Fetch contexts on load
  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(d => {
        setWorkspaces(d.workspaces || []);
        if (d.workspaces?.length > 0) setSelectedWorkspace(d.workspaces[0].id);
      });

    fetch('/api/providers')
      .then(r => r.json())
      .then(d => {
        setProviders(d.providers || []);
        // Select first configured provider
        const firstActive = d.providers?.find((p: any) => p.isConfigured);
        if (firstActive) {
          setSelectedProvider(firstActive.id);
          setSelectedModel(MODELS[firstActive.id]?.[0]?.id || '');
        }
      });
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = (useChat as any)({
    api: '/api/chat',
    body: {
      workspaceId: selectedWorkspace,
      providerId: selectedProvider,
      modelId: selectedModel,
      mode: 'qa'
    },
    onError: (err: any) => {
      toast('error', 'Chat Error', err.message);
    }
  });

  return (
    <div className="nx-page" style={{ height: 'calc(100vh - var(--nx-topbar-height) - var(--nx-statusbar-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="nx-page__header" style={{ marginBottom: 'var(--nx-space-4)' }}>
        <div>
          <h1 className="nx-page__title">Q & A</h1>
          <p className="nx-page__description">Ask questions and learn about your repository.</p>
        </div>
        
        {/* Top Controls */}
        <div style={{ display: 'flex', gap: 'var(--nx-space-4)', alignItems: 'center' }}>
          
          <select 
            value={selectedWorkspace} 
            onChange={e => setSelectedWorkspace(e.target.value)}
            className="nx-input nx-input--md"
            style={{ minWidth: '200px' }}
          >
            <option value="" disabled>Select Workspace...</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select 
            value={selectedProvider} 
            onChange={e => {
              setSelectedProvider(e.target.value);
              setSelectedModel(MODELS[e.target.value]?.[0]?.id || '');
            }}
            className="nx-input nx-input--md"
            style={{ minWidth: '150px' }}
          >
            {providers.map(p => (
              <option key={p.id} value={p.id} disabled={!p.isConfigured}>
                {p.name} {!p.isConfigured ? '(No Key)' : ''}
              </option>
            ))}
          </select>

          <select 
            value={selectedModel} 
            onChange={e => setSelectedModel(e.target.value)}
            className="nx-input nx-input--md"
            style={{ minWidth: '150px' }}
          >
            {MODELS[selectedProvider]?.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

        </div>
      </div>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Chat Messages Area */}
        <CardBody style={{ flex: 1, overflowY: 'auto', padding: 'var(--nx-space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-6)' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-muted)' }}>
              <span style={{ fontSize: '48px', marginBottom: 'var(--nx-space-4)' }}>💬</span>
              <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>
                How can I help you build today?
              </h3>
              <p style={{ marginTop: 'var(--nx-space-2)' }}>Ask about your architecture, request code, or trace bugs.</p>
            </div>
          ) : (
            messages.map((m: any) => (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  gap: 'var(--nx-space-4)',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--nx-accent), var(--nx-accent-hover))', color: 'var(--nx-text-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    N
                  </div>
                )}
                
                <div style={{ 
                  background: m.role === 'user' ? 'var(--nx-bg-elevated)' : 'transparent',
                  border: m.role === 'user' ? '1px solid var(--nx-border)' : 'none',
                  padding: m.role === 'user' ? 'var(--nx-space-4)' : '0',
                  borderRadius: 'var(--nx-radius-lg)',
                  color: 'var(--nx-text-primary)'
                }}>
                  {m.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-3)' }}>
                      {m.content && (
                        <div className="nx-markdown" style={{ lineHeight: 1.6 }}>
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                      {m.toolInvocations?.map((tool: any) => (
                        <div key={tool.toolCallId} style={{ 
                          background: 'var(--nx-bg-primary)', 
                          border: '1px solid var(--nx-border)', 
                          borderRadius: 'var(--nx-radius-md)', 
                          padding: 'var(--nx-space-3)',
                          fontSize: 'var(--nx-text-sm)',
                          fontFamily: 'monospace'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-2)', color: 'var(--nx-text-muted)' }}>
                            <span style={{ color: 'var(--nx-accent)' }}>🛠️</span>
                            <span>
                              {tool.toolName === 'readFile' ? `Reading file: ${tool.args.filePath}` : 
                               tool.toolName === 'writeToFile' ? `Writing to: ${tool.args.filePath}` : 
                               tool.toolName === 'runCommand' ? `Running: ${tool.args.command}` : 
                               `Using tool: ${tool.toolName}`}
                            </span>
                            {tool.state === 'result' ? <span style={{ color: 'var(--nx-success)' }}>✓</span> : <span style={{ color: 'var(--nx-warning)' }}>...</span>}
                          </div>
                          {tool.state === 'result' && tool.toolName === 'runCommand' && (
                            <pre style={{ marginTop: 'var(--nx-space-2)', background: '#000', color: '#0f0', padding: 'var(--nx-space-2)', borderRadius: '4px', overflowX: 'auto', maxHeight: '200px' }}>
                              {tool.result.substring(0, 500) + (tool.result.length > 500 ? '...\n(Output truncated)' : '')}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-sm)' }}>
              NEXORA is thinking...
            </div>
          )}
        </CardBody>

        {/* Input Area */}
        <div style={{ padding: 'var(--nx-space-4)', borderTop: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
            <Input 
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your codebase..."
              disabled={isLoading || !selectedWorkspace}
              style={{ flex: 1 }}
            />
            <Button type="submit" disabled={isLoading || !input || !selectedWorkspace} variant="primary">
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
