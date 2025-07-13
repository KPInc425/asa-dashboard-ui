import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { environmentApi } from '../services/api';

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

// interface ConfigFile {
//   content: string;
//   filename: string;
//   map: string;
// }



// interface ArkServerConfigs {
//   success: boolean;
//   servers: Server[];
//   count: number;
// }

const Configs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'env' | 'docker' | 'system'>('env');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Environment file state
  const [envFile, setEnvFile] = useState<EnvironmentFile | null>(null);

  // Docker compose state
  const [dockerCompose, setDockerCompose] = useState<DockerComposeFile | null>(null);
  const [dockerContent, setDockerContent] = useState('');

  // System config state
  const [editingSystemConfig, setEditingSystemConfig] = useState<Record<string, string>>({});



  // List of safe environment variables that admins can edit
  const safeEnvVars = [
    'PORT',
    'HOST',
    'NODE_ENV',
    'DOCKER_SOCKET_PATH',
    'SERVER_MODE',
    'NATIVE_BASE_PATH',
    'NATIVE_CONFIG_FILE',
    'STEAMCMD_PATH',
    'AUTO_INSTALL_STEAMCMD',
    'ASA_CONFIG_SUB_PATH',
    'RCON_DEFAULT_PORT',
    'RATE_LIMIT_MAX',
    'RATE_LIMIT_TIME_WINDOW',
    'CORS_ORIGIN',
    'LOG_LEVEL',
    'LOG_FILE_PATH',
    'METRICS_ENABLED'
  ];

  // System config state
  // const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, [searchParams]);

  // Function to get environment variable descriptions
  const getEnvVarDescription = (varName: string): string => {
    const descriptions: Record<string, string> = {
      'PORT': 'Server port for the API',
      'HOST': 'Server host address',
      'NODE_ENV': 'Node.js environment (development/production)',
      'DOCKER_SOCKET_PATH': 'Path to Docker socket (Linux)',
      'SERVER_MODE': 'Server mode (native/docker)',
      'NATIVE_BASE_PATH': 'Base path for native servers',
      'NATIVE_CONFIG_FILE': 'Native servers configuration file',
      'STEAMCMD_PATH': 'Path to SteamCMD installation',
      'AUTO_INSTALL_STEAMCMD': 'Auto-install SteamCMD if not found',
      'ASA_CONFIG_SUB_PATH': 'ASA server config subdirectory',
      'RCON_DEFAULT_PORT': 'Default RCON port for servers',
      'RATE_LIMIT_MAX': 'Maximum API requests per time window',
      'RATE_LIMIT_TIME_WINDOW': 'Rate limiting time window (ms)',
      'CORS_ORIGIN': 'CORS allowed origin',
      'LOG_LEVEL': 'Logging level (debug/info/warn/error)',
      'LOG_FILE_PATH': 'Path to log file',
      'METRICS_ENABLED': 'Enable metrics collection'
    };
    return descriptions[varName] || 'Configuration variable';
  };



  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load environment file
      const envData = await environmentApi.getEnvironmentFile();
      setEnvFile(envData);

      // Load docker compose
      const dockerData = await environmentApi.getDockerComposeFile();
      setDockerCompose(dockerData);
      setDockerContent(dockerData.content);

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
        // setSystemConfig(data.config);
        setEditingSystemConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    }
  };

  const handleSaveEnv = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!envFile) {
        throw new Error('No environment file loaded');
      }

      // Build the new environment content from the variables
      const newContent = Object.entries(envFile.variables)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      await environmentApi.updateEnvironmentFile(newContent);
      alert('Environment variables saved successfully!');
      
      // Reload the environment file to get the updated content
      const updatedEnvData = await environmentApi.getEnvironmentFile();
      setEnvFile(updatedEnvData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save environment variables');
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
        // setSystemConfig(editingSystemConfig);
      } else {
        setError(data.message || 'Failed to save system configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system configuration');
    } finally {
      setSaving(false);
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
                
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>
                    <strong>Security Note:</strong> Only safe configuration variables are shown below. Sensitive variables (passwords, API keys, secrets) are hidden for security reasons.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeEnvVars.map((varName) => {
                    const currentValue = envFile?.variables?.[varName] || '';
                    return (
                      <div key={varName} className="form-control">
                  <label className="label">
                          <span className="label-text font-medium">{varName}</span>
                          <span className="label-text-alt text-base-content/60">
                            {getEnvVarDescription(varName)}
                          </span>
                  </label>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEnvFile(prev => prev ? {
                              ...prev,
                              variables: {
                                ...prev.variables,
                                [varName]: newValue
                              }
                            } : null);
                          }}
                          className="input input-bordered"
                          placeholder={`Enter value for ${varName}`}
                        />
                      </div>
                    );
                  })}
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
                      'Save Environment Variables'
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