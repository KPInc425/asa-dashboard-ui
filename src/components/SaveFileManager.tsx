import React, { useState, useEffect } from 'react';
import { containerApi } from '../services/api';

interface SaveFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: 'ark' | 'backup' | 'other';
}

interface SaveFileManagerProps {
  serverName: string;
  serverType: 'native' | 'container' | 'cluster-server';
}

const SaveFileManager: React.FC<SaveFileManagerProps> = ({ serverName, serverType }) => {
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadSaveFiles();
  }, [serverName]);

  const loadSaveFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await containerApi.getSaveFiles(serverName);
      if (response.success) {
        setSaveFiles(response.files);
      } else {
        setError('Failed to load save files');
      }
    } catch (err) {
      setError('Failed to load save files');
      console.error('Error loading save files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.ark') && !file.name.endsWith('.ark.bak')) {
        setError('Please select a valid ARK save file (.ark or .ark.bak)');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await containerApi.uploadSaveFile(serverName, formData);
      if (response.success) {
        setSuccess(`Successfully uploaded ${selectedFile.name}`);
        setSelectedFile(null);
        loadSaveFiles(); // Reload the file list
      } else {
        setError(response.message || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      setDownloading(fileName);
      setError(null);
      
      const response = await containerApi.downloadSaveFile(serverName, fileName);
      if (response.success) {
        // Create a download link
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess(`Successfully downloaded ${fileName}`);
      } else {
        setError('Failed to download file');
      }
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      setError(null);
      
      const response = await containerApi.backupSaveFiles(serverName);
      if (response.success) {
        setSuccess('Save files backed up successfully');
        loadSaveFiles(); // Reload to show new backup files
      } else {
        setError('Failed to backup save files');
      }
    } catch (err) {
      setError('Failed to backup save files');
      console.error('Error backing up files:', err);
    } finally {
      setBackingUp(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      
      const response = await containerApi.deleteSaveFile(serverName, fileName);
      if (response.success) {
        setSuccess(`Successfully deleted ${fileName}`);
        loadSaveFiles(); // Reload the file list
      } else {
        setError('Failed to delete file');
      }
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): SaveFile['type'] => {
    if (fileName.endsWith('.ark')) return 'ark';
    if (fileName.endsWith('.ark.bak') || fileName.includes('backup')) return 'backup';
    return 'other';
  };

  const getFileTypeColor = (type: SaveFile['type']): string => {
    switch (type) {
      case 'ark': return 'badge-primary';
      case 'backup': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  const getFileTypeLabel = (type: SaveFile['type']): string => {
    switch (type) {
      case 'ark': return 'Save';
      case 'backup': return 'Backup';
      default: return 'Other';
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Save Files</h3>
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading save files...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h3 className="card-title">Save Files</h3>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-6 p-4 bg-base-200 rounded-lg">
          <h4 className="font-semibold mb-3">Upload Save File</h4>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".ark,.ark.bak"
              onChange={handleFileSelect}
              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn btn-primary btn-sm"
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 text-sm text-base-content/70">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="btn btn-secondary btn-sm"
          >
            {backingUp ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Backing up...
              </>
            ) : (
              '📦 Create Backup'
            )}
          </button>
          <button
            onClick={loadSaveFiles}
            className="btn btn-outline btn-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* File List */}
        <div className="space-y-2">
          <h4 className="font-semibold">Save Files ({saveFiles.length})</h4>
          
          {saveFiles.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">
              <div className="text-4xl mb-4">📁</div>
              <p>No save files found</p>
              <p className="text-sm">Upload a save file or create a backup</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {saveFiles.map((file) => (
                    <tr key={file.name}>
                      <td className="font-mono text-sm">{file.name}</td>
                      <td>
                        <span className={`badge ${getFileTypeColor(file.type)} badge-xs`}>
                          {getFileTypeLabel(file.type)}
                        </span>
                      </td>
                      <td>{formatFileSize(file.size)}</td>
                      <td>{new Date(file.modified).toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDownload(file.name)}
                            disabled={downloading === file.name}
                            className="btn btn-xs btn-outline btn-info"
                            title="Download"
                          >
                            {downloading === file.name ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              '⬇️'
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(file.name)}
                            className="btn btn-xs btn-outline btn-error"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveFileManager; 