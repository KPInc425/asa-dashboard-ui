import React, { useState, useEffect, useCallback, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Editor from '@monaco-editor/react';
import { getArkConfigFile, updateArkConfigFile } from '../services/api';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MonacoErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Monaco Editor Error Boundary caught an error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Monaco Editor failed to initialize. Switching to fallback editor.</span>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ServerConfigEditorProps {
  serverName: string;
  onClose?: () => void;
}

const ServerConfigEditor: React.FC<ServerConfigEditorProps> = ({ serverName, onClose }) => {
  const [selectedConfigFile, setSelectedConfigFile] = useState<'Game.ini' | 'GameUserSettings.ini'>('Game.ini');
  const [configContent, setConfigContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useTextarea, setUseTextarea] = useState(false);

  // Load config file content
  const loadConfigFile = useCallback(async (fileName: 'Game.ini' | 'GameUserSettings.ini') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getArkConfigFile(serverName, fileName);
      
      // Handle nested response structure from backend
      let content = '';
      if (response.content && typeof response.content === 'object' && response.content.content) {
        content = response.content.content;
      } else if (typeof response.content === 'string') {
        content = response.content;
      } else {
        content = '';
      }
      
      setConfigContent(prev => ({
        ...prev,
        [fileName]: content
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load config file');
      console.error(`Failed to load ${fileName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [serverName]);

  // Save config file content
  const saveConfigFile = async (fileName: 'Game.ini' | 'GameUserSettings.ini') => {
    if (!configContent[fileName]) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await updateArkConfigFile(serverName, fileName, configContent[fileName]);
      alert(`${fileName} saved successfully!`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save config file');
      console.error(`Failed to save ${fileName}:`, error);
    } finally {
      setSaving(false);
    }
  };

  // Load initial config file
  useEffect(() => {
    if (!configContent[selectedConfigFile]) {
      loadConfigFile(selectedConfigFile);
    }
  }, [selectedConfigFile, configContent, loadConfigFile]);

  return (
    <div className="space-y-4">
      {/* Config File Selection */}
      <div className="flex items-center justify-between">
        <h2 className="card-title">Server Configuration Files</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-base-content/70">Select file:</span>
          <select
            value={selectedConfigFile}
            onChange={(e) => setSelectedConfigFile(e.target.value as 'Game.ini' | 'GameUserSettings.ini')}
            className="select select-bordered select-sm"
          >
            <option value="Game.ini">Game.ini</option>
            <option value="GameUserSettings.ini">GameUserSettings.ini</option>
          </select>
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

      {/* File Description */}
      <details className="collapse collapse-arrow bg-base-200">
        <summary className="collapse-title text-lg font-medium">
          📋 {selectedConfigFile} - Configuration Details
        </summary>
        <div className="collapse-content">
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 className="font-bold">
            {selectedConfigFile === 'Game.ini' ? 'Game.ini' : 'GameUserSettings.ini'}
          </h3>
          <div className="text-xs">
            {selectedConfigFile === 'Game.ini' 
              ? 'Contains server game settings, mod configurations, and advanced server parameters.'
              : 'Contains user-specific settings like server name, passwords, and basic server configuration.'
            }
              </div>
              {selectedConfigFile === 'Game.ini' && (
                <div className="mt-2 text-xs">
                  <p><strong>Common settings:</strong> HarvestMultiplier, XPMultiplier, TamingSpeedMultiplier, Mods, ServerSettings</p>
                </div>
              )}
              {selectedConfigFile === 'GameUserSettings.ini' && (
                <div className="mt-2 text-xs">
                  <p><strong>Common settings:</strong> ServerName, ServerPassword, AdminPassword, MaxPlayers, ServerCrosshair</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </details>

      {/* Config Editor */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-lg">
              {selectedConfigFile} - {serverName}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadConfigFile(selectedConfigFile)}
                disabled={loading}
                className="btn btn-sm btn-outline"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  '🔄 Reload'
                )}
              </button>
              {useTextarea && (
                <button
                  onClick={() => setUseTextarea(false)}
                  className="btn btn-sm btn-outline btn-info"
                >
                  🎨 Try Monaco Editor
                </button>
              )}
              <button
                onClick={() => saveConfigFile(selectedConfigFile)}
                disabled={saving || !configContent[selectedConfigFile]}
                className="btn btn-sm btn-primary"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  '💾 Save'
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg mb-4"></div>
                <p className="text-base-content/70">Loading {selectedConfigFile}...</p>
              </div>
            </div>
          ) : useTextarea ? (
            <div className="space-y-2">
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Using fallback text editor. Monaco Editor failed to load.</span>
              </div>
              <textarea
                className="textarea textarea-bordered w-full h-96 font-mono text-sm"
                value={configContent[selectedConfigFile] || ''}
                onChange={(e) => setConfigContent(prev => ({
                  ...prev,
                  [selectedConfigFile]: e.target.value
                }))}
                placeholder={`Editing ${selectedConfigFile}...`}
              />
            </div>
          ) : (
            <MonacoErrorBoundary onError={() => setUseTextarea(true)}>
              <Editor
                height="500px"
                language="ini"
                value={configContent[selectedConfigFile] || ''}
                onChange={(value) => setConfigContent(prev => ({
                  ...prev,
                  [selectedConfigFile]: value || ''
                }))}
                onMount={() => {
                  // Successfully mounted
                  console.log('Monaco Editor mounted successfully');
                }}
                // onError={(error) => {
                  // console.error('Monaco Editor error:', error);
                  // setUseTextarea(true);
                // }}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="loading loading-spinner loading-lg mb-4"></div>
                      <p className="text-base-content/70">Initializing editor...</p>
                    </div>
                  </div>
                }
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
            </MonacoErrorBoundary>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const content = configContent[selectedConfigFile] || '';
                navigator.clipboard.writeText(content);
                alert('Configuration copied to clipboard!');
              }}
              className="btn btn-sm btn-outline"
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={() => {
                const content = configContent[selectedConfigFile] || '';
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${serverName}_${selectedConfigFile}`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-sm btn-outline"
            >
              💾 Download File
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reload the configuration file? Any unsaved changes will be lost.')) {
                  loadConfigFile(selectedConfigFile);
                }
              }}
              className="btn btn-sm btn-outline btn-warning"
            >
              🔄 Reset Changes
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-sm btn-outline btn-neutral"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigEditor; 