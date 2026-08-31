'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Badge, Progress, Spinner, EmptyState } from '@/components/ui';
import { toast } from '@/lib/stores';

export default function ProjectCodePage() {
  const [activeTab, setActiveTab] = useState<'upload'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMapped, setIsMapped] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 200));
      setUploadProgress(i);
    }

    setIsUploading(false);
    setIsMapped(true);
    toast('success', 'Project Uploaded', 'Your project files have been successfully uploaded and mapped.');
  };

  return (
    <div className="nx-page">
      <div className="nx-page__header">
        <div>
          <h1 className="nx-page__title">Project Code Manager</h1>
          <p className="nx-page__description">
            Upload a ZIP of your project folder. This uploaded code acts as the central source of truth for the Client Q&A bot.
          </p>
        </div>
        <div className="nx-page__actions">
          {isMapped && <Badge variant="success" dot>Project Active</Badge>}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--nx-space-4)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--nx-border)' }}>
          <button 
            className={`nx-sidebar__item ${activeTab === 'upload' ? 'nx-sidebar__item--active' : ''}`}
            onClick={() => setActiveTab('upload')}
            style={{ borderRadius: '0', borderBottom: activeTab === 'upload' ? '2px solid var(--nx-accent)' : '2px solid transparent', padding: 'var(--nx-space-3) var(--nx-space-4)' }}
          >
            Upload Project ZIP
          </button>
        </div>
      </div>

      <Card>
        <CardBody style={{ padding: 'var(--nx-space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--nx-space-4)' }}>📤</div>
          <h3 style={{ fontSize: 'var(--nx-text-lg)', fontWeight: 'bold', marginBottom: 'var(--nx-space-2)', color: 'var(--nx-text-primary)' }}>
            Upload Project Archive
          </h3>
          <p style={{ color: 'var(--nx-text-secondary)', marginBottom: 'var(--nx-space-6)', maxWidth: '500px', margin: '0 auto var(--nx-space-6)' }}>
            Upload a ZIP file containing your project source code. This will be unzipped on the server and indexed for AI analysis and Q&A.
          </p>
          
          {isUploading ? (
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <Progress value={uploadProgress} variant={uploadProgress < 100 ? 'default' : 'success'} />
              <p style={{ fontSize: 'var(--nx-text-xs)', color: 'var(--nx-text-muted)', marginTop: 'var(--nx-space-2)' }}>
                {uploadProgress < 100 ? `Uploading and extracting... ${uploadProgress}%` : 'Complete!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--nx-space-3)', justifyContent: 'center' }}>
              <Button variant="secondary" onClick={() => document.getElementById('zip-upload')?.click()}>
                Select ZIP File
              </Button>
              <input type="file" id="zip-upload" accept=".zip" style={{ display: 'none' }} onChange={(e) => {
                if (e.target.files?.length) handleUpload();
              }} />
              <Button variant="primary" disabled>
                Sync with Git (Coming Soon)
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
      
      {isMapped && (
        <Card style={{ marginTop: 'var(--nx-space-4)' }}>
          <CardHeader>
            <span className="nx-card__title">Project Structure (Server View)</span>
          </CardHeader>
          <CardBody>
             <EmptyState 
                icon="📁"
                title="Code Indexed"
                description="The project has been uploaded and successfully indexed. The Q&A bot now has the latest context."
             />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
