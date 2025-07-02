import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { configApi, type ConfigFile } from '../services';

const ConfigEditor = () => {
  const { map } = useParams<{ map: string }>();
  const [config, setConfig] = useState<ConfigFile | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (map) {
      loadConfig();
    }
  }, [map]);

  const loadConfig = async () => {
    if (!map) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const configData = await configApi.loadConfig(map);
      setConfig(configData);
      setContent(configData.content);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!map || !content.trim()) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      await configApi.saveConfig(map, content);
      setHasChanges(false);
      // Show success message
      const successEvent = new CustomEvent('show-toast', {
        detail: { message: 'Configuration saved successfully!', type: 'success' }
      });
      window.dispatchEvent(successEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== config?.content);
    }
  };

  const handleReset = () => {
    if (config) {
      setContent(config.content);
      setHasChanges(false);
    }
  };

  const getMapIcon = (mapName: string) => {
    const mapIcons: Record<string, string> = {
      'TheIsland': '🏝️',
      'TheCenter': '🏔️',
      'ScorchedEarth': '🏜️',
      'Aberration': '🕳️',
      'Extinction': '🌍',
      'Genesis': '🧬',
      'Genesis2': '🧬',
      'LostIsland': '🗺️',
      'Fjordur': '❄️',
      'CrystalIsles': '💎',
      'Ragnarok': '⚔️',
      'Valguero': '🌋'
    };
    return mapIcons[mapName] || '🗺️';
  };

  const getMapDisplayName = (mapName: string) => {
    const mapNames: Record<string, string> = {
      'TheIsland': 'The Island',
      'TheCenter': 'The Center',
      'ScorchedEarth': 'Scorched Earth',
      'Aberration': 'Aberration',
      'Extinction': 'Extinction',
      'Genesis': 'Genesis',
      'Genesis2': 'Genesis Part 2',
      'LostIsland': 'Lost Island',
      'Fjordur': 'Fjordur',
      'CrystalIsles': 'Crystal Isles',
      'Ragnarok': 'Ragnarok',
      'Valguero': 'Valguero'
    };
    return mapNames[mapName] || mapName;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="ark-rotate inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getMapIcon(map || '')}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">
                  {getMapDisplayName(map || '')} Configuration
                </h1>
                <p className="text-base-content/70">
                  Edit server configuration files
                </p>
              </div>
            </div>
            <Link
              to="/configs"
              className="btn btn-outline btn-primary ark-hover-glow"
            >
              ← Back to Configs
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error ark-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Editor Controls */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-primary">Configuration Editor</h2>
              {hasChanges && (
                <span className="badge badge-warning ark-pulse">Unsaved Changes</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="btn btn-outline btn-secondary btn-sm ark-hover-glow"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="btn btn-primary btn-sm ark-gradient-primary ark-hover-glow"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>

          {/* File Info */}
          {config && (
            <div className="flex items-center space-x-4 text-sm text-base-content/70 mb-4">
              <span>File: {config.filename}</span>
              <span>Map: {config.map}</span>
              <span>Size: {(content.length / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {/* Monaco Editor */}
        <div className="ark-glass rounded-xl overflow-hidden flex-1 ark-slide-in" style={{ animationDelay: '0.2s' }}>
          <Editor
            height="600px"
            defaultLanguage="ini"
            value={content}
            onChange={handleContentChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              glyphMargin: true,
              renderLineHighlight: 'all',
              selectOnLineNumbers: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              mouseWheelZoom: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
                highlightActiveIndentation: true
              }
            }}
            onMount={(editor) => {
              // Customize editor appearance
              editor.updateOptions({
                fontFamily: 'JetBrains Mono, Consolas, monospace'
              });
            }}
          />
        </div>

        {/* Help Section */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold text-primary mb-3">Configuration Help</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-accent mb-2">Common Settings</h4>
              <ul className="space-y-1 text-base-content/70">
                <li><code>MaxPlayers=70</code> - Maximum number of players</li>
                <li><code>ServerPassword=</code> - Server password (leave empty for public)</li>
                <li><code>ServerAdminPassword=</code> - Admin password</li>
                <li><code>DifficultyOffset=1.0</code> - Game difficulty</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-accent mb-2">Rates & Multipliers</h4>
              <ul className="space-y-1 text-base-content/70">
                <li><code>HarvestAmountMultiplier=2.0</code> - Resource gathering rate</li>
                <li><code>XPMultiplier=2.0</code> - Experience gain rate</li>
                <li><code>TamingSpeedMultiplier=3.0</code> - Taming speed</li>
                <li><code>MatingIntervalMultiplier=0.5</code> - Breeding interval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigEditor; 