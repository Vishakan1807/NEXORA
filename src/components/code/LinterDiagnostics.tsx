'use client';

import { Card, CardBody, Badge, EmptyState } from '@/components/ui';

export interface ESLintMessage {
  ruleId: string;
  severity: number; // 1 = warning, 2 = error
  message: string;
  line: number;
  column: number;
}

export interface ESLintResult {
  filePath: string;
  messages: ESLintMessage[];
  errorCount: number;
  warningCount: number;
}

interface LinterDiagnosticsProps {
  results: ESLintResult[];
  onFileSelect: (filePath: string) => void;
}

export function LinterDiagnostics({ results, onFileSelect }: LinterDiagnosticsProps) {
  const allMessages = results.flatMap(file => 
    file.messages.map(msg => ({ ...msg, file: file.filePath }))
  );

  const errorCount = results.reduce((acc, r) => acc + r.errorCount, 0);
  const warningCount = results.reduce((acc, r) => acc + r.warningCount, 0);

  if (!results.length || allMessages.length === 0) {
    return (
      <Card>
        <CardBody style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState 
            icon="✅"
            title="Clean Codebase"
            description="No linting errors or warnings were found in this workspace."
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        gap: 'var(--nx-space-2)', 
        marginBottom: 'var(--nx-space-4)',
        padding: '0 var(--nx-space-2)'
      }}>
        <Badge variant="error">{errorCount} Errors</Badge>
        <Badge variant="warning">{warningCount} Warnings</Badge>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-2)' }}>
        {results.map((file) => {
          if (file.messages.length === 0) return null;
          
          // Convert absolute path to relative if possible for cleaner UI
          const relativePath = file.filePath.split(/[\\/]/).pop() || file.filePath;

          return (
            <Card 
              key={file.filePath} 
              variant="interactive" 
              onClick={() => onFileSelect(file.filePath)}
              style={{ padding: 0 }}
            >
              <div style={{ 
                padding: 'var(--nx-space-2) var(--nx-space-3)', 
                borderBottom: '1px solid var(--nx-border)',
                background: 'var(--nx-bg-secondary)',
                fontWeight: 'var(--nx-weight-medium)',
                fontSize: 'var(--nx-text-sm)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{relativePath}</span>
                <span style={{ color: 'var(--nx-text-muted)' }}>{file.messages.length} issues</span>
              </div>
              <div style={{ padding: 'var(--nx-space-2) 0' }}>
                {file.messages.map((msg, idx) => (
                  <div key={idx} style={{ 
                    padding: 'var(--nx-space-2) var(--nx-space-3)',
                    display: 'flex',
                    gap: 'var(--nx-space-3)',
                    fontSize: 'var(--nx-text-sm)',
                    borderBottom: idx < file.messages.length - 1 ? '1px solid var(--nx-border)' : 'none'
                  }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {msg.severity === 2 ? '❌' : '⚠️'}
                    </div>
                    <div>
                      <p style={{ color: 'var(--nx-text-primary)' }}>{msg.message}</p>
                      <div style={{ display: 'flex', gap: 'var(--nx-space-3)', marginTop: 'var(--nx-space-1)', color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-xs)' }}>
                        <span>Line {msg.line}:{msg.column}</span>
                        <span style={{ fontFamily: 'monospace' }}>{msg.ruleId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
