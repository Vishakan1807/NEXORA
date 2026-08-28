'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, Button, Spinner, Input } from '@/components/ui';
import { toast } from '@/lib/stores';
import { useRouter } from 'next/navigation';

export function WorkspaceUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [activeTab, setActiveTab] = useState<'zip' | 'local'>('zip');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [localPath, setLocalPath] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab !== 'zip') return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeTab !== 'zip') return;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast('error', 'Invalid File', 'Only ZIP archives are supported.');
      return;
    }

    setIsUploading(true);
    setProgress(10); 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.zip', ''));

    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const res = await fetch('/api/workspaces/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast('success', 'Workspace Uploaded', 'Your project has been successfully analyzed.');
      
      if (onUploadComplete) onUploadComplete();
      else router.refresh();
      
    } catch (error) {
      toast('error', 'Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    }
  };

  const handleMapLocalPath = async () => {
    if (!localPath) {
      toast('error', 'Path Required', 'Please enter a local directory path.');
      return;
    }

    setIsUploading(true);
    setProgress(30);

    try {
      const res = await fetch('/api/workspaces/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localPath, name: workspaceName }),
      });

      setProgress(80);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Mapping failed');
      }

      setProgress(100);
      toast('success', 'Workspace Mapped', 'Local directory successfully mapped to NEXORA.');
      
      if (onUploadComplete) onUploadComplete();
      else router.refresh();
      
    } catch (error) {
      toast('error', 'Mapping Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <Card 
      variant={isDragging ? 'accent' : 'interactive'}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        borderStyle: activeTab === 'zip' ? 'dashed' : 'solid',
        borderWidth: activeTab === 'zip' ? '2px' : '1px',
        borderColor: isDragging ? 'var(--nx-accent)' : 'var(--nx-border)',
        backgroundColor: isDragging ? 'var(--nx-accent-subtle)' : 'var(--nx-bg-elevated)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg-primary)' }}>
        <button 
          onClick={() => setActiveTab('zip')}
          style={{ flex: 1, padding: 'var(--nx-space-3)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'zip' ? '2px solid var(--nx-accent)' : '2px solid transparent', color: activeTab === 'zip' ? 'var(--nx-accent)' : 'var(--nx-text-muted)', fontWeight: activeTab === 'zip' ? 'var(--nx-weight-semibold)' : 'var(--nx-weight-medium)' }}
        >
          Upload ZIP Archive
        </button>
        <button 
          onClick={() => setActiveTab('local')}
          style={{ flex: 1, padding: 'var(--nx-space-3)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'local' ? '2px solid var(--nx-accent)' : '2px solid transparent', color: activeTab === 'local' ? 'var(--nx-accent)' : 'var(--nx-text-muted)', fontWeight: activeTab === 'local' ? 'var(--nx-weight-semibold)' : 'var(--nx-weight-medium)' }}
        >
          Map Local Path
        </button>
      </div>

      <CardBody style={{ padding: 'var(--nx-space-8)', textAlign: 'center' }}>
        
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--nx-space-4)' }}>
            <Spinner size="lg" />
            <div>
              <p style={{ fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>
                {activeTab === 'zip' ? 'Analyzing Uploaded Workspace...' : 'Mapping Local Directory...'}
              </p>
              <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)' }}>
                Extracting and parsing project structure
              </p>
            </div>
            <div className="nx-progress" style={{ maxWidth: '300px' }}>
              <div className="nx-progress__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : activeTab === 'zip' ? (
          <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept=".zip"
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '48px', opacity: 0.6, marginBottom: 'var(--nx-space-4)' }}>📦</div>
            <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)', marginBottom: 'var(--nx-space-2)' }}>
              Upload Project Archive
            </h3>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)' }}>
              Drag and drop a .ZIP file containing your repository, or click to browse.
            </p>
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Select ZIP File
            </Button>
          </div>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ fontSize: '48px', opacity: 0.6, marginBottom: 'var(--nx-space-4)', textAlign: 'center' }}>🔗</div>
            <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)', marginBottom: 'var(--nx-space-2)', textAlign: 'center' }}>
              Map Local Directory
            </h3>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)', textAlign: 'center' }}>
              Provide the absolute path to a local folder on this machine. NEXORA will index it without copying files.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--nx-space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-1)' }}>Workspace Name (Optional)</label>
                <Input 
                  placeholder="e.g. My Awesome App" 
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-1)' }}>Absolute Local Path</label>
                <Input 
                  placeholder="e.g. C:\Users\visha\Projects\MyCode" 
                  value={localPath}
                  onChange={e => setLocalPath(e.target.value)}
                />
              </div>
              <Button variant="primary" onClick={handleMapLocalPath} style={{ width: '100%', marginTop: 'var(--nx-space-2)' }}>
                Map Directory
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
