import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { apiService } from '../services/api';

interface GlobalConfigManagerProps {
  onClose: () => void;
}

const GlobalConfigManager: React.FC<GlobalConfigManagerProps> = ({ onClose }) => {
  const [gameIni, setGameIni] = useState('');
  const [gameUserSettingsIni, setGameUserSettingsIni] = useState('');
  const [excludedServers, setExcludedServers] = useState<string[]>([]);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'usersettings' | 'exclusions'>('game');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load global configs
      const configsResponse = await apiService.provisioning.getGlobalConfigs();
      if (configsResponse.success) {
        setGameIni(configsResponse.gameIni || '');
        setGameUserSettingsIni(configsResponse.gameUserSettingsIni || '');
      }

      // Load config exclusions
      const exclusionsResponse = await apiService.provisioning.getConfigExclusions();
      if (exclusionsResponse.success) {
        setExcludedServers(exclusionsResponse.excludedServers);
      }

      // Load available servers
      const clustersResponse = await apiService.provisioning.listClusters();
      if (clustersResponse.success) {
        const servers: string[] = [];
        clustersResponse.clusters.forEach((cluster: any) => {
          if (cluster.servers) {
            cluster.servers.forEach((server: any) => {
              servers.push(server.name);
            });
          }
        });
        setAvailableServers(servers);
      }
    } catch (err: any) {
      setError('Failed to load global configs');
      console.error('Error loading configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save global configs
      const configsResponse = await apiService.provisioning.updateGlobalConfigs({
        gameIni: gameIni,
        gameUserSettingsIni: gameUserSettingsIni
      });

      if (!configsResponse.success) {
        setError(configsResponse.message || 'Failed to save global configs');
        return;
      }

      // Save config exclusions
      const exclusionsResponse = await apiService.provisioning.updateConfigExclusions(excludedServers);

      if (!exclusionsResponse.success) {
        setError(exclusionsResponse.message || 'Failed to save config exclusions');
        return;
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save global configs');
      console.error('Error saving configs:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleServerExclusion = (serverName: string) => {
    setExcludedServers(prev => {
      if (prev.includes(serverName)) {
        return prev.filter(name => name !== serverName);
      } else {
        return [...prev, serverName];
      }
    });
  };



  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="flex flex-col items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-base-content/70">Loading global configs...</p>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-base-content">
            ⚙️ Global Configs Management
          </h2>
          <button
            onClick={onClose}
            className="btn btn-circle btn-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeTab === 'game' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            Game.ini
          </button>
          <button
            className={`tab ${activeTab === 'usersettings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('usersettings')}
          >
            GameUserSettings.ini
          </button>
          <button
            className={`tab ${activeTab === 'exclusions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('exclusions')}
          >
            Server Exclusions
          </button>
        </div>

        {/* Game.ini Tab */}
        {activeTab === 'game' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-primary">Global Game.ini</h3>
              <p className="text-sm text-base-content/70 mb-4">
                This configuration will be applied to all servers unless excluded. 
                Common settings include server rules, game mechanics, and performance options.
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language="ini"
                  value={gameIni}
                  onChange={(value) => setGameIni(value || '')}
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

              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-bold">Common Game.ini Settings</h3>
                  <div className="text-xs">
                    <p>• [ServerSettings] - Server configuration</p>
                    <p>• [GameRules] - Game mechanics and rules</p>
                    <p>• [Engine.GameEngine] - Performance settings</p>
                    <p>• [ShooterGame.ShooterGameMode] - Game mode settings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GameUserSettings.ini Tab */}
        {activeTab === 'usersettings' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-secondary">Global GameUserSettings.ini</h3>
              <p className="text-sm text-base-content/70 mb-4">
                This configuration contains user-specific settings and multipliers. 
                Common settings include breeding rates, harvest rates, and experience multipliers.
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language="ini"
                  value={gameUserSettingsIni}
                  onChange={(value) => setGameUserSettingsIni(value || '')}
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

              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-bold">Common GameUserSettings.ini Settings</h3>
                  <div className="text-xs">
                    <p>• [/script/shootergame.shootergamemode] - Game mode multipliers</p>
                    <p>• MatingIntervalMultiplier - Breeding cooldown</p>
                    <p>• EggHatchSpeedMultiplier - Egg hatching speed</p>
                    <p>• HarvestAmountMultiplier - Resource gathering</p>
                    <p>• XPMultiplier - Experience gain rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server Exclusions Tab */}
        {activeTab === 'exclusions' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-accent">Server Exclusions</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Select servers that should NOT use the global configs. 
                These servers will use their default configurations instead.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                  {availableServers.map(serverName => (
                    <div key={serverName} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <span className="font-medium text-base-content">{serverName}</span>
                      <button
                        onClick={() => handleToggleServerExclusion(serverName)}
                        className={`btn btn-xs ${
                          excludedServers.includes(serverName)
                            ? 'btn-error'
                            : 'btn-success'
                        }`}
                      >
                        {excludedServers.includes(serverName) ? 'Excluded' : 'Included'}
                      </button>
                    </div>
                  ))}
                </div>

                {availableServers.length === 0 && (
                  <div className="text-center py-8 text-base-content/60">
                    <div className="text-4xl mb-2">🖥️</div>
                    <p className="text-sm italic">No servers found</p>
                    <p className="text-xs">Create some servers first to manage exclusions</p>
                  </div>
                )}
              </div>

              <div className="alert alert-warning mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-bold">Excluded Servers</h3>
                  <div className="text-xs">
                    Excluded servers will use their default configurations and will not inherit global settings. 
                    This is useful for special servers like Club ARK or test servers.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card bg-info/10 border-info/20 mt-6">
          <div className="card-body">
            <h4 className="card-title text-info">📊 Summary</h4>
            <div className="stats stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Total Servers</div>
                <div className="stat-value text-primary">{availableServers.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Excluded Servers</div>
                <div className="stat-value text-warning">{excludedServers.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Using Global Configs</div>
                <div className="stat-value text-success">{availableServers.length - excludedServers.length}</div>
              </div>
            </div>
            <div className="alert alert-info mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold">Automatic Updates</h3>
                <div className="text-xs">When you save global config changes, all server configurations are automatically regenerated. Excluded servers will maintain their individual settings.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Global Configs'
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default GlobalConfigManager; 