import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';

interface GlobalConfig {
  gameIni: string;
  gameUserSettingsIni: string;
  excludedServers: string[];
  customDynamicConfigUrl?: string;
}

const GlobalServerConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<GlobalConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'gameusersettings' | 'exclusions' | 'settings'>('game');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [servers, setServers] = useState<string[]>([]);
  const [newExclusion, setNewExclusion] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load global configs
      const configResponse = await api.get('/api/provisioning/global-configs');
      if (configResponse.data.success) {
        setConfigs({
          gameIni: configResponse.data.gameIni || '',
          gameUserSettingsIni: configResponse.data.gameUserSettingsIni || '',
          excludedServers: configResponse.data.excludedServers || [],
          customDynamicConfigUrl: configResponse.data.customDynamicConfigUrl || ''
        });
      }

      // Load available servers for exclusions
      const serversResponse = await api.get('/api/servers');
      if (serversResponse.data.success) {
        const serverNames = serversResponse.data.servers.map((s: any) => s.name);
        setServers(serverNames);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load global configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!configs) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.put('/api/provisioning/global-configs', {
        gameIni: configs.gameIni,
        gameUserSettingsIni: configs.gameUserSettingsIni,
        customDynamicConfigUrl: configs.customDynamicConfigUrl
      });
      
      if (response.data.success) {
        setSuccess('Global server configurations saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Failed to save configurations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExclusion = async () => {
    if (!newExclusion.trim() || !configs) return;
    
    try {
      const updatedExclusions = [...configs.excludedServers, newExclusion.trim()];
      const response = await api.put('/api/provisioning/config-exclusions', {
        excludedServers: updatedExclusions
      });
      
      if (response.data.success) {
        setConfigs(prev => prev ? { ...prev, excludedServers: updatedExclusions } : null);
        setNewExclusion('');
        setSuccess('Server exclusion added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exclusion');
    }
  };

  const handleRemoveExclusion = async (serverName: string) => {
    if (!configs) return;
    
    try {
      const updatedExclusions = configs.excludedServers.filter(s => s !== serverName);
      const response = await api.put('/api/provisioning/config-exclusions', {
        excludedServers: updatedExclusions
      });
      
      if (response.data.success) {
        setConfigs(prev => prev ? { ...prev, excludedServers: updatedExclusions } : null);
        setSuccess('Server exclusion removed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove exclusion');
    }
  };

  const updateConfigContent = (content: string) => {
    if (!configs) return;
    
    if (activeTab === 'game') {
      setConfigs(prev => prev ? { ...prev, gameIni: content } : null);
    } else {
      setConfigs(prev => prev ? { ...prev, gameUserSettingsIni: content } : null);
    }
  };

  const getCurrentContent = () => {
    if (!configs) return '';
    return activeTab === 'game' ? configs.gameIni : configs.gameUserSettingsIni;
  };

  const hasChanges = () => {
    // This would need to track original content for proper change detection
    // For now, we'll assume there are always changes when content is modified
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-base-content/70">Loading global server configurations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Global Server Settings</h1>
              <p className="text-base-content/70">Configure Game.ini and GameUserSettings.ini for all servers</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={saving}
                className="btn btn-outline btn-sm"
              >
                🔄 Reload
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className="btn btn-primary btn-sm"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  '💾 Save All'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Editor */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                {/* Tab Navigation */}
                <div className="tabs tabs-boxed bg-base-200 mb-4">
                  <button
                    className={`tab ${activeTab === 'game' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('game')}
                  >
                    🎮 Game.ini
                  </button>
                  <button
                    className={`tab ${activeTab === 'gameusersettings' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('gameusersettings')}
                  >
                    👤 GameUserSettings.ini
                  </button>
                  <button
                    className={`tab ${activeTab === 'exclusions' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('exclusions')}
                  >
                    🚫 Exclusions
                  </button>
                  <button
                    className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    ⚙️ Global Settings
                  </button>
                </div>

                {/* Content Area */}
                {activeTab === 'exclusions' ? (
                  <div className="space-y-4">
                    <div className="bg-base-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Server Exclusions</h3>
                      <p className="text-sm text-base-content/70 mb-4">
                        Servers listed below will not use the global configurations and will maintain their own settings.
                      </p>
                      
                      {/* Add Exclusion */}
                      <div className="flex gap-2 mb-4">
                        <select
                          value={newExclusion}
                          onChange={(e) => setNewExclusion(e.target.value)}
                          className="select select-bordered select-sm flex-1"
                        >
                          <option value="">Select a server to exclude...</option>
                          {servers
                            .filter(server => !configs?.excludedServers.includes(server))
                            .map(server => (
                              <option key={server} value={server}>{server}</option>
                            ))
                          }
                        </select>
                        <button
                          onClick={handleAddExclusion}
                          disabled={!newExclusion.trim()}
                          className="btn btn-primary btn-sm"
                        >
                          Add
                        </button>
                      </div>

                      {/* Excluded Servers List */}
                      <div className="space-y-2">
                        {configs?.excludedServers.length === 0 ? (
                          <p className="text-sm text-base-content/50">No servers excluded from global configurations.</p>
                        ) : (
                          configs?.excludedServers.map(server => (
                            <div key={server} className="flex items-center justify-between bg-base-300 rounded-lg p-3">
                              <span className="font-medium">{server}</span>
                              <button
                                onClick={() => handleRemoveExclusion(server)}
                                className="btn btn-error btn-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'settings' ? (
                  <div className="space-y-4">
                    <div className="bg-base-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Global Server Settings</h3>
                      <p className="text-sm text-base-content/70 mb-4">
                        Configure global settings that apply to all servers in the cluster.
                      </p>
                      
                      {/* Dynamic Config URL */}
                      <div className="space-y-2">
                        <label className="label">
                          <span className="label-text font-medium">Global Dynamic Config URL</span>
                        </label>
                        <input
                          type="url"
                          className="input input-bordered w-full"
                          value={configs?.customDynamicConfigUrl || ''}
                          onChange={(e) => setConfigs(prev => prev ? { ...prev, customDynamicConfigUrl: e.target.value } : null)}
                          placeholder="https://example.com/config.json"
                        />
                        <label className="label">
                          <span className="label-text-alt">Optional: Default dynamic config URL for all servers. Individual servers can override this setting.</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {activeTab === 'game' ? 'Game.ini' : 'GameUserSettings.ini'}
                      </h3>
                      <div className="text-sm text-base-content/70">
                        This configuration will be applied to all servers except excluded ones.
                      </div>
                    </div>
                    
                    <Editor
                      height="500px"
                      language="ini"
                      theme="vs-dark"
                      value={getCurrentContent()}
                      onChange={(value) => updateConfigContent(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-lg">📋 About Global Configurations</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    Global server configurations allow you to set default settings for all your ARK servers.
                  </p>
                  <div className="bg-base-200 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">🎮 Game.ini</h4>
                    <p className="text-xs text-base-content/70">
                      Contains server rules, game mechanics, and gameplay settings.
                    </p>
                  </div>
                  <div className="bg-base-200 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">👤 GameUserSettings.ini</h4>
                    <p className="text-xs text-base-content/70">
                      Contains server settings, passwords, and administrative configurations.
                    </p>
                  </div>
                  <div className="bg-base-200 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">🚫 Exclusions</h4>
                    <p className="text-xs text-base-content/70">
                      Servers in the exclusion list will maintain their own configurations.
                    </p>
                  </div>
                  <div className="bg-base-200 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">⚙️ Global Settings</h4>
                    <p className="text-xs text-base-content/70">
                      Configure global settings like dynamic config URLs that apply to all servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-lg">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('game')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    🎮 Edit Game.ini
                  </button>
                  <button
                    onClick={() => setActiveTab('gameusersettings')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    👤 Edit GameUserSettings.ini
                  </button>
                  <button
                    onClick={() => setActiveTab('exclusions')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    🚫 Manage Exclusions
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    ⚙️ Global Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalServerConfigs; 