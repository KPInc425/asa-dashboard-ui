import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { environmentApi, configApi } from '../services/api';

interface EnvironmentFile {
  success: boolean;
  content: string;
  variables: Record<string, string>;
  path: string;
}

interface DockerComposeFile {
  success: boolean;
  content: string;
  path: string;
}

interface ConfigFile {
  content: string;
  filename: string;
  map: string;
}

interface Server {
  name: string;
  lines: string[];
  startLine: number;
  endLine: number;
}

interface ArkServerConfigs {
  success: boolean;
  servers: Server[];
  count: number;
}

const Configs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'env' | 'docker' | 'server' | 'system'>('env');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Environment file state
  const [envFile, setEnvFile] = useState<EnvironmentFile | null>(null);
  const [envContent, setEnvContent] = useState('');

  // Docker compose state
  const [dockerCompose, setDockerCompose] = useState<DockerComposeFile | null>(null);
  const [dockerContent, setDockerContent] = useState('');

  // Server configs state
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverConfigs, setServerConfigs] = useState<Record<string, string>>({});
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>('TheIsland');

  // System config state
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});
  const [editingSystemConfig, setEditingSystemConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if a specific server was requested via URL params
    const serverParam = searchParams.get('server');
    if (serverParam) {
      setSelectedServer(serverParam);
      setActiveTab('server');
    }

    loadInitialData();
  }, [searchParams]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load environment file
      const envData = await environmentApi.getEnvironmentFile();
      setEnvFile(envData);
      setEnvContent(envData.content);

      // Load docker compose
      const dockerData = await environmentApi.getDockerComposeFile();
      setDockerCompose(dockerData);
      setDockerContent(dockerData.content);

      // Load server configs
      const serverData = await environmentApi.getArkServerConfigs();
      setServers(serverData.servers);
      setAvailableMaps(['TheIsland', 'TheCenter', 'ScorchedEarth', 'Ragnarok', 'Aberration', 'Extinction', 'Valguero', 'Genesis', 'CrystalIsles', 'Genesis2', 'LostIsland', 'Fjordur']);

      // Load system config
      await loadSystemConfig();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration data');
      console.error('Error loading config data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/configs');
      const data = await response.json();
      if (data.success) {
        setSystemConfig(data.config);
        setEditingSystemConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    }
  };

  const loadServerConfig = async (serverName: string) => {
    try {
      const config = await configApi.getConfigFile(serverName, 'Game.ini');
      setServerConfigs(prev => ({
        ...prev,
        [serverName]: config.content
      }));
    } catch (err) {
      console.error(`Failed to load config for ${serverName}:`, err);
    }
  };

  const handleSaveEnv = async () => {
    setSaving(true);
    setError(null);

    try {
      await environmentApi.updateEnvironmentFile(envContent);
      alert('Environment file saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save environment file');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocker = async () => {
    setSaving(true);
    setError(null);

    try {
      await environmentApi.updateDockerComposeFile(dockerContent);
      alert('Docker Compose file saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Docker Compose file');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServerConfig = async (serverName: string) => {
    setSaving(true);
    setError(null);

    try {
      const content = serverConfigs[serverName];
      if (content) {
        await configApi.updateConfigFile(serverName, content, 'Game.ini');
        alert(`Server config for ${serverName} saved successfully!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server config');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemConfig = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: editingSystemConfig })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('System configuration saved successfully!');
        setSystemConfig(editingSystemConfig);
      } else {
        setError(data.message || 'Failed to save system configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleServerSelect = (serverName: string) => {
    setSelectedServer(serverName);
    if (!serverConfigs[serverName]) {
      loadServerConfig(serverName);
    }
  };

  const handleMapSelect = async (map: string) => {
    setSelectedMap(map);
    try {
      const config = await configApi.loadConfig(map);
      setServerConfigs(prev => ({
        ...prev,
        [map]: config.content
      }));
    } catch (err) {
      console.error(`Failed to load config for map ${map}:`, err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
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
                <h1 className="text-4xl font-bold text-primary mb-2">Configuration Management</h1>
                <p className="text-base-content/70">
                  Manage environment variables, Docker Compose, and server configurations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${activeTab === 'env' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('env')}
          >
            🌍 Environment (.env)
          </button>
          <button
            className={`tab ${activeTab === 'docker' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('docker')}
          >
            🐳 Docker Compose
          </button>
          <button
            className={`tab ${activeTab === 'server' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('server')}
          >
            🦖 Server Configs
          </button>
          <button
            className={`tab ${activeTab === 'system' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            ⚙️ System Config
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {/* Environment Tab */}
            {activeTab === 'env' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Environment Variables</h2>
                  <div className="text-sm text-base-content/70">
                    {envFile?.path && `Path: ${envFile.path}`}
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Environment File Content</span>
                  </label>
                  <Editor
                    height="400px"
                    language="properties"
                    value={envContent}
                    onChange={(value) => setEnvContent(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                    theme="vs-dark"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleSaveEnv}
                    disabled={saving}
                    className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Environment File'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Docker Compose Tab */}
            {activeTab === 'docker' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Docker Compose Configuration</h2>
                  <div className="text-sm text-base-content/70">
                    {dockerCompose?.path && `Path: ${dockerCompose.path}`}
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Docker Compose File Content</span>
                  </label>
                  <Editor
                    height="400px"
                    language="yaml"
                    value={dockerContent}
                    onChange={(value) => setDockerContent(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                    theme="vs-dark"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleSaveDocker}
                    disabled={saving}
                    className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Docker Compose File'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Server Configs Tab */}
            {activeTab === 'server' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Server Configurations</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Server List */}
                  <div className="lg:col-span-1">
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h3 className="card-title text-lg">Servers</h3>
                        <div className="space-y-2">
                          {servers.map((server) => (
                            <button
                              key={server.name}
                              onClick={() => handleServerSelect(server.name)}
                              className={`btn btn-sm w-full justify-start ${
                                selectedServer === server.name ? 'btn-primary' : 'btn-ghost'
                              }`}
                            >
                              🦖 {server.name}
                            </button>
                          ))}
                        </div>

                        <div className="divider">OR</div>

                        <h3 className="card-title text-lg">Map Templates</h3>
                        <div className="space-y-2">
                          {availableMaps.map((map) => (
                            <button
                              key={map}
                              onClick={() => handleMapSelect(map)}
                              className={`btn btn-sm w-full justify-start ${
                                selectedMap === map ? 'btn-secondary' : 'btn-ghost'
                              }`}
                            >
                              🗺️ {map}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Config Editor */}
                  <div className="lg:col-span-3">
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="card-title text-lg">
                            {selectedServer ? `Server: ${selectedServer}` : `Map: ${selectedMap}`}
                          </h3>
                          {selectedServer && (
                            <button
                              onClick={() => handleSaveServerConfig(selectedServer)}
                              disabled={saving}
                              className={`btn btn-primary btn-sm ${saving ? 'btn-disabled' : ''}`}
                            >
                              {saving ? (
                                <>
                                  <span className="loading loading-spinner loading-sm"></span>
                                  Saving...
                                </>
                              ) : (
                                'Save Config'
                              )}
                            </button>
                          )}
                        </div>

                        <Editor
                          height="500px"
                          language="ini"
                          value={selectedServer ? serverConfigs[selectedServer] || '' : serverConfigs[selectedMap] || ''}
                          onChange={(value) => {
                            if (selectedServer) {
                              setServerConfigs(prev => ({
                                ...prev,
                                [selectedServer]: value || ''
                              }));
                            } else {
                              setServerConfigs(prev => ({
                                ...prev,
                                [selectedMap]: value || ''
                              }));
                            }
                          }}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                          }}
                          theme="vs-dark"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Config Tab */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">System Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(editingSystemConfig).map(([key, value]) => (
                    <div key={key} className="form-control">
                      <label className="label">
                        <span className="label-text">{key}</span>
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setEditingSystemConfig(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="input input-bordered"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleSaveSystemConfig}
                    disabled={saving}
                    className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      'Save System Configuration'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configs; 