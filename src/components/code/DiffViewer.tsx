'use client';

import { useMemo } from 'react';

interface DiffViewerProps {
  diffText: string;
  filename: string;
}

export function DiffViewer({ diffText, filename }: DiffViewerProps) {
  const lines = useMemo(() => {
    if (!diffText) return [];
    const lines = diffText.split('\n');
    const parsedLines: { type: 'add' | 'remove' | 'context' | 'header'; text: string; oldLineNum?: number; newLineNum?: number }[] = [];
    
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      if (line.startsWith('diff --git') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
        parsedLines.push({ type: 'header', text: line });
      } else if (line.startsWith('@@')) {
        parsedLines.push({ type: 'header', text: line });
        // Parse the @@ -a,b +c,d @@ to get the line numbers
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[2], 10);
        }
      } else if (line.startsWith('+')) {
        parsedLines.push({ type: 'add', text: line, newLineNum: newLineNum++ });
      } else if (line.startsWith('-')) {
        parsedLines.push({ type: 'remove', text: line, oldLineNum: oldLineNum++ });
      } else {
        // Context line
        // Some diffs might have a space at the start of context lines, others might just be empty
        parsedLines.push({ type: 'context', text: line, oldLineNum: oldLineNum++, newLineNum: newLineNum++ });
      }
    }
    
    return parsedLines;
  }, [diffText]);

  if (!diffText) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--nx-text-muted)' }}>
        No changes found in {filename}
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      fontSize: '13px', 
      lineHeight: '1.5',
      background: 'var(--nx-bg-primary)',
      borderRadius: 'var(--nx-radius)',
      border: '1px solid var(--nx-border)',
      overflow: 'auto',
      height: '100%'
    }}>
      <div style={{
        padding: 'var(--nx-space-2) var(--nx-space-4)',
        borderBottom: '1px solid var(--nx-border)',
        background: 'var(--nx-bg-secondary)',
        fontWeight: 'bold',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {filename}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {lines.map((line, idx) => {
            if (line.type === 'header') {
              return (
                <tr key={idx} style={{ background: 'var(--nx-bg-secondary)', color: 'var(--nx-text-muted)' }}>
                  <td colSpan={2} style={{ width: '80px', padding: '0 8px', textAlign: 'right', borderRight: '1px solid var(--nx-border)' }}></td>
                  <td style={{ padding: '0 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text}</td>
                </tr>
              );
            }

            const isAdd = line.type === 'add';
            const isRemove = line.type === 'remove';
            
            const bgColor = isAdd ? 'rgba(46, 160, 67, 0.15)' : isRemove ? 'rgba(248, 81, 73, 0.15)' : 'transparent';
            const numColor = isAdd ? 'rgba(46, 160, 67, 0.5)' : isRemove ? 'rgba(248, 81, 73, 0.5)' : 'var(--nx-text-muted)';

            return (
              <tr key={idx} style={{ background: bgColor }}>
                <td style={{ width: '40px', padding: '0 8px', textAlign: 'right', color: numColor, userSelect: 'none', borderRight: '1px solid var(--nx-border)' }}>
                  {line.oldLineNum || ''}
                </td>
                <td style={{ width: '40px', padding: '0 8px', textAlign: 'right', color: numColor, userSelect: 'none', borderRight: '1px solid var(--nx-border)' }}>
                  {line.newLineNum || ''}
                </td>
                <td style={{ padding: '0 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--nx-text-primary)' }}>
                  {line.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
