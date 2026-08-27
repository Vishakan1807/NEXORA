'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, Button, Spinner, StatusDot } from '@/components/ui';
import { toast } from '@/lib/stores';
import { useRouter } from 'next/navigation';

export function WorkspaceUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    setProgress(10); // Fake initial progress

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.zip', ''));

    try {
      // Fake progress increment
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
      
      if (onUploadComplete) {
        onUploadComplete();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast('error', 'Upload Failed', error.message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
      onClick={() => !isUploading && fileInputRef.current?.click()}
      style={{
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderColor: isDragging ? 'var(--nx-accent)' : 'var(--nx-border)',
        backgroundColor: isDragging ? 'var(--nx-accent-subtle)' : 'var(--nx-bg-elevated)',
        transition: 'all 0.2s ease',
      }}
    >
      <CardBody style={{ padding: 'var(--nx-space-10)', textAlign: 'center' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          accept=".zip"
          style={{ display: 'none' }}
        />
        
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--nx-space-4)' }}>
            <Spinner size="lg" />
            <div>
              <p style={{ fontWeight: 'var(--nx-weight-medium)', color: 'var(--nx-text-primary)' }}>
                Analyzing Workspace...
              </p>
              <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)' }}>
                Extracting and parsing project structure
              </p>
            </div>
            <div className="nx-progress" style={{ maxWidth: '300px' }}>
              <div className="nx-progress__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '48px', opacity: 0.6, marginBottom: 'var(--nx-space-4)' }}>
              📦
            </div>
            <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'var(--nx-weight-semibold)', color: 'var(--nx-text-primary)', marginBottom: 'var(--nx-space-2)' }}>
              Upload Project Archive
            </h3>
            <p style={{ fontSize: 'var(--nx-text-sm)', color: 'var(--nx-text-muted)', marginBottom: 'var(--nx-space-6)' }}>
              Drag and drop a .ZIP file containing your repository, or click to browse.
            </p>
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Select ZIP File
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
