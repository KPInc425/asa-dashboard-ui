import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { environmentApi } from '../services';
import ArkServerEditor from './ArkServerEditor';

const EnvironmentEditor = () => {
  const [activeTab, setActiveTab] = useState<'env' | 'docker-compose' | 'ark-servers'>('env');
  const [envContent, setEnvContent] = useState('');
  const [dockerComposeContent, setDockerComposeContent] = useState('');
  const [arkServers, setArkServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (activeTab === 'env') {
        const envData = await environmentApi.getEnvironmentFile();
        setEnvContent(envData.content);
        setOriginalContent(envData.content);
      } else if (activeTab === 'docker-compose') {
        const dockerData = await environmentApi.getDockerComposeFile();
        setDockerComposeContent(dockerData.content);
        setOriginalContent(dockerData.content);
      } else if (activeTab === 'ark-servers') {
        const serversData = await environmentApi.getArkServerConfigs();
        setArkServers(serversData.servers);
      }
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'env' | 'docker-compose' | 'ark-servers') => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
        setActiveTab(tab);
        setHasChanges(false);
        loadData();
      }
    } else {
      setActiveTab(tab);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (activeTab === 'env') {
        await environmentApi.updateEnvironmentFile(envContent);
        setSuccess('Environment file updated successfully!');
      } else if (activeTab === 'docker-compose') {
        await environmentApi.updateDockerComposeFile(dockerComposeContent);
        setSuccess('Docker Compose file updated successfully!');
      }
      setHasChanges(false);
      setOriginalContent(activeTab === 'env' ? envContent : dockerComposeContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadDockerCompose = async () => {
    if (!window.confirm('This will restart all Docker containers. Are you sure?')) {
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await environmentApi.reloadDockerCompose();
      setSuccess('Docker Compose configuration reloaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload Docker Compose');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      if (activeTab === 'env') {
        setEnvContent(value);
        setHasChanges(value !== originalContent);
      } else if (activeTab === 'docker-compose') {
        setDockerComposeContent(value);
        setHasChanges(value !== originalContent);
      }
    }
  };

  const handleReset = () => {
    if (activeTab === 'env') {
      setEnvContent(originalContent);
    } else if (activeTab === 'docker-compose') {
      setDockerComposeContent(originalContent);
    }
    setHasChanges(false);
  };

  const getCurrentContent = () => {
    if (activeTab === 'env') return envContent;
    if (activeTab === 'docker-compose') return dockerComposeContent;
    return '';
  };

  const getLanguage = () => {
    if (activeTab === 'env') return 'properties';
    if (activeTab === 'docker-compose') return 'yaml';
    return 'text';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">
                  Environment Management
                </h1>
                <p className="text-base-content/70">
                  Edit environment variables and Docker Compose configuration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Display */}
        {error && (
          <div className="alert alert-error animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-200/80 backdrop-blur-md border border-base-300/30">
          <button
            className={`tab ${activeTab === 'env' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('env')}
          >
            Environment Variables
          </button>
          <button
            className={`tab ${activeTab === 'docker-compose' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('docker-compose')}
          >
            Docker Compose
          </button>
          <button
            className={`tab ${activeTab === 'ark-servers' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('ark-servers')}
          >
            ARK Servers
          </button>
        </div>

        {/* Content */}
        {activeTab === 'ark-servers' ? (
          <ArkServersManager servers={arkServers} onUpdate={loadData} />
        ) : (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-primary">
                  {activeTab === 'env' ? 'Environment Variables' : 'Docker Compose Configuration'}
                </h2>
                {hasChanges && (
                  <span className="badge badge-warning animate-pulse">Unsaved Changes</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="btn btn-outline btn-secondary btn-sm hover:shadow-lg hover:shadow-secondary/25"
                >
                  Reset
                </button>
                {activeTab === 'docker-compose' && (
                  <button
                    onClick={handleReloadDockerCompose}
                    disabled={isSaving}
                    className="btn btn-outline btn-warning btn-sm hover:shadow-lg hover:shadow-warning/25"
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Reloading...
                      </>
                    ) : (
                      'Reload Docker Compose'
                    )}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="btn btn-primary btn-sm bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/25"
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>

            <div className="h-96 border border-base-300 rounded-lg overflow-hidden">
              <Editor
                height="100%"
                language={getLanguage()}
                value={getCurrentContent()}
                onChange={handleContentChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ARK Servers Management Component
const ArkServersManager = ({ servers, onUpdate }: { servers: any[], onUpdate: () => void }) => {
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveServer = async (serverName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${serverName}?`)) {
      return;
    }
    
    setIsRemoving(true);
    try {
      await environmentApi.removeArkServer(serverName);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove server:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">ARK Server Management</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-primary btn-sm"
        >
          Add New Server
        </button>
      </div>

      {/* ARK Server Editor Modal */}
      {(isAdding || isEditing) && (
        <ArkServerEditor
          server={isEditing ? selectedServer : undefined}
          onSave={() => {
            setIsAdding(false);
            setIsEditing(false);
            setSelectedServer(null);
            onUpdate();
          }}
          onCancel={() => {
            setIsAdding(false);
            setIsEditing(false);
            setSelectedServer(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Server List</h3>
          <div className="space-y-2">
            {servers.map((server) => {
              // Display user-friendly name without prefix
              const displayName = server.name.replace('asa-server-', '');
              return (
                <div
                  key={server.name}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedServer?.name === server.name
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedServer(server)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{displayName}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServer(server);
                          setIsEditing(true);
                        }}
                        className="btn btn-xs btn-outline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveServer(server.name);
                        }}
                        disabled={isRemoving}
                        className="btn btn-xs btn-error"
                      >
                        {isRemoving ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          'Remove'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Details */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Server Details</h3>
          {selectedServer ? (
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Server Name</span>
                </label>
                <input
                  type="text"
                  value={selectedServer.name.replace('asa-server-', '')}
                  className="input input-bordered w-full"
                  readOnly
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Container Status</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div className="badge badge-info">Docker Service</div>
                  <span className="text-sm text-base-content/70">
                    {selectedServer.lines.length} configuration lines
                  </span>
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Quick Actions</span>
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline btn-sm"
                  >
                    Edit Configuration
                  </button>
                  <button
                    onClick={() => handleRemoveServer(selectedServer.name)}
                    disabled={isRemoving}
                    className="btn btn-error btn-sm"
                  >
                    {isRemoving ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Remove Server'
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Raw Configuration</span>
                </label>
                <div className="bg-base-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs">{selectedServer.lines.slice(0, 10).join('\n')}</pre>
                  {selectedServer.lines.length > 10 && (
                    <div className="text-xs text-base-content/50 mt-2">
                      ... and {selectedServer.lines.length - 10} more lines
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-base-content/70 py-8">
              Select a server to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentEditor; 