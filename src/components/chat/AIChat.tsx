'use client';

import { useChat } from '@ai-sdk/react';
import { Input, Button, Spinner } from '@/components/ui';
import { toast } from '@/lib/stores';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef } from 'react';

interface AIChatProps {
  workspaceId: string;
  providerId: string;
  modelId: string;
  mode: 'assistant' | 'qa';
  title?: string;
  description?: string;
}

export function AIChat({ workspaceId, providerId, modelId, mode, title, description }: AIChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = (useChat as any)({
    api: '/api/chat',
    body: {
      workspaceId,
      providerId,
      modelId,
      mode
    },
    onError: (err: any) => {
      toast('error', 'Chat Error', err.message);
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--nx-bg-primary)', borderRadius: 'var(--nx-radius)', border: '1px solid var(--nx-border)', overflow: 'hidden' }}>
      
      {/* Header */}
      {(title || description) && (
        <div style={{ padding: 'var(--nx-space-3) var(--nx-space-4)', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)' }}>
          {title && <div style={{ fontWeight: 'var(--nx-weight-semibold)', fontSize: 'var(--nx-text-sm)' }}>{title}</div>}
          {description && <div style={{ fontSize: '12px', color: 'var(--nx-text-muted)' }}>{description}</div>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--nx-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nx-text-muted)', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', marginBottom: 'var(--nx-space-3)' }}>{mode === 'qa' ? '❓' : '💻'}</span>
            <div style={{ fontSize: 'var(--nx-text-sm)', fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>
              {mode === 'qa' ? 'Ask a question about your code.' : 'How can I help you build?'}
            </div>
          </div>
        ) : (
          messages.map((m: any) => (
            <div 
              key={m.id} 
              style={{ 
                display: 'flex', 
                gap: 'var(--nx-space-3)',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%'
              }}
            >
              {m.role === 'assistant' && (
                <div style={{ width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg, var(--nx-accent), var(--nx-accent-hover))', color: 'var(--nx-text-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                  N
                </div>
              )}
              
              <div style={{ 
                background: m.role === 'user' ? 'var(--nx-bg-elevated)' : 'transparent',
                border: m.role === 'user' ? '1px solid var(--nx-border)' : 'none',
                padding: m.role === 'user' ? 'var(--nx-space-2) var(--nx-space-3)' : '0',
                borderRadius: 'var(--nx-radius-lg)',
                color: 'var(--nx-text-primary)',
                fontSize: '13px'
              }}>
                {m.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-2)' }}>
                    {m.content && (
                      <div className="nx-markdown" style={{ lineHeight: 1.5 }}>
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                    {m.toolInvocations?.map((tool: any) => (
                      <div key={tool.toolCallId} style={{ 
                        background: 'var(--nx-bg-sunken)', 
                        border: '1px solid var(--nx-border)', 
                        borderRadius: 'var(--nx-radius-md)', 
                        padding: 'var(--nx-space-2)',
                        fontSize: '12px',
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
                          <pre style={{ marginTop: 'var(--nx-space-2)', background: '#000', color: '#0f0', padding: 'var(--nx-space-2)', borderRadius: '4px', overflowX: 'auto', maxHeight: '150px' }}>
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
          <div style={{ alignSelf: 'flex-start', color: 'var(--nx-text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 'var(--nx-space-2)' }}>
            <Spinner size="sm" /> NEXORA is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 'var(--nx-space-3)', borderTop: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--nx-space-2)' }}>
          <Input 
            value={input}
            onChange={handleInputChange}
            placeholder={mode === 'qa' ? "Ask a question..." : "Instruct the AI to edit code..."}
            disabled={isLoading || !workspaceId || !providerId}
            style={{ flex: 1, fontSize: '13px' }}
          />
          <Button type="submit" disabled={isLoading || !input || !workspaceId || !providerId} variant="primary" size="sm">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
