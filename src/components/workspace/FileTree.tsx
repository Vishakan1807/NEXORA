'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

interface FileTreeProps {
  workspaceId: string;
  onFileSelect?: (path: string) => void;
}

export function FileTree({ workspaceId, onFileSelect }: FileTreeProps) {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNodes(data.files || []);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks
    fetchFiles('/');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleNodeClick = (node: FileNode) => {
    if (node.isDirectory) {
      fetchFiles(node.path);
    } else if (onFileSelect) {
      onFileSelect(node.path);
    }
  };

  const handleBack = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/');
    fetchFiles(newPath);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb / Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-2)', padding: 'var(--nx-space-2) var(--nx-space-3)', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg-secondary)' }}>
        <button 
          onClick={handleBack} 
          disabled={currentPath === '/'}
          style={{ 
            background: 'none', border: 'none', cursor: currentPath === '/' ? 'default' : 'pointer', 
            color: currentPath === '/' ? 'var(--nx-text-disabled)' : 'var(--nx-text-primary)',
            padding: '4px', fontSize: '18px'
          }}
        >
          ⬆️
        </button>
        <span style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-primary)', fontFamily: 'var(--nx-font-mono)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          nexora-workspace:{currentPath}
        </span>
      </div>

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--nx-space-2)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--nx-space-6)' }}>
            <Spinner size="sm" />
          </div>
        ) : error ? (
          <div style={{ padding: 'var(--nx-space-4)', color: 'var(--nx-error-text)', fontSize: 'var(--nx-text-sm)', textAlign: 'center' }}>
            {error}
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ padding: 'var(--nx-space-4)', color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-sm)', textAlign: 'center' }}>
            Empty directory
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {nodes.map(node => (
              <div 
                key={node.path}
                onClick={() => handleNodeClick(node)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--nx-space-2) var(--nx-space-3)',
                  cursor: 'pointer',
                  borderRadius: 'var(--nx-radius-sm)',
                  transition: 'background 0.1s',
                  fontSize: 'var(--nx-text-sm)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--nx-interactive-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ marginRight: 'var(--nx-space-3)', fontSize: '16px' }}>
                  {node.isDirectory ? '📁' : '📄'}
                </span>
                <span style={{ flex: 1, color: node.isDirectory ? 'var(--nx-accent)' : 'var(--nx-text-primary)' }}>
                  {node.name}
                </span>
                {!node.isDirectory && (
                  <span style={{ color: 'var(--nx-text-muted)', fontSize: 'var(--nx-text-xs)' }}>
                    {formatSize(node.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
