import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { containerApi } from '../services/api';

interface GlobalConfigManagerProps {
  clusterName: string;
}

const GlobalConfigManager: React.FC<GlobalConfigManagerProps> = ({ clusterName }) => {
  const [activeTab, setActiveTab] = useState<'game' | 'gameusersettings'>('game');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [gameIniContent, setGameIniContent] = useState('');
  const [gameUserSettingsContent, setGameUserSettingsContent] = useState('');
  const [originalGameIni, setOriginalGameIni] = useState('');
  const [originalGameUserSettings, setOriginalGameUserSettings] = useState('');

  useEffect(() => {
    loadConfigs();
  }, [clusterName]);

  const loadConfigs = async () => {
      setLoading(true);
      setError(null);

    try {
      // Load both config files
      const [gameIniResponse, gameUserSettingsResponse] = await Promise.all([
        containerApi.getConfigFile(clusterName, 'Game.ini').catch(() => ({ content: '', fileName: 'Game.ini', serverName: clusterName, configPath: '' })),
        containerApi.getConfigFile(clusterName, 'GameUserSettings.ini').catch(() => ({ content: '', fileName: 'GameUserSettings.ini', serverName: clusterName, configPath: '' }))
      ]);

      setGameIniContent(gameIniResponse.content || '');
      setGameUserSettingsContent(gameUserSettingsResponse.content || '');
      setOriginalGameIni(gameIniResponse.content || '');
      setOriginalGameUserSettings(gameUserSettingsResponse.content || '');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration files');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
      setSaving(true);
      setError(null);
    setSuccess(null);
    
    try {
      const fileName = activeTab === 'game' ? 'Game.ini' : 'GameUserSettings.ini';
      const content = activeTab === 'game' ? gameIniContent : gameUserSettingsContent;
      
      await containerApi.updateConfigFile(clusterName, content, fileName);
      
      setSuccess(`${fileName} saved successfully!`);
      
      // Update original content
      if (activeTab === 'game') {
        setOriginalGameIni(gameIniContent);
      } else {
        setOriginalGameUserSettings(gameUserSettingsContent);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (activeTab === 'game') {
      setGameIniContent(originalGameIni);
    } else {
      setGameUserSettingsContent(originalGameUserSettings);
    }
  };

  const hasChanges = () => {
    if (activeTab === 'game') {
      return gameIniContent !== originalGameIni;
      } else {
      return gameUserSettingsContent !== originalGameUserSettings;
      }
  };

  const getCurrentContent = () => {
    return activeTab === 'game' ? gameIniContent : gameUserSettingsContent;
  };

  const setCurrentContent = (content: string) => {
    if (activeTab === 'game') {
      setGameIniContent(content);
    } else {
      setGameUserSettingsContent(content);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading configuration files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title">Global Configuration Management</h2>
        <div className="text-sm text-base-content/70">
          Cluster: {clusterName}
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>
          <strong>Global Configuration:</strong> Changes made here will apply to all servers in the cluster unless they are excluded from global configs.
        </span>
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

      {/* Success Display */}
      {success && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

        {/* Tab Navigation */}
      <div className="tabs tabs-boxed bg-base-200">
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
        </div>

      {/* Editor */}
      <div className="card bg-base-200">
            <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-lg">
              {activeTab === 'game' ? 'Game.ini' : 'GameUserSettings.ini'}
            </h3>
            <div className="flex items-center space-x-2">
              {hasChanges() && (
                <span className="badge badge-warning">Modified</span>
              )}
              <button
                onClick={handleReset}
                disabled={!hasChanges()}
                className="btn btn-outline btn-sm"
              >
                🔄 Reset
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
                  '💾 Save'
                )}
              </button>
            </div>
          </div>

                <Editor
            height="500px"
                  language="ini"
            value={getCurrentContent()}
            onChange={(value) => setCurrentContent(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
              automaticLayout: true,
              theme: 'vs-dark'
            }}
          />
            </div>
          </div>

      {/* Configuration Help */}
      <div className="card bg-base-200">
            <div className="card-body">
          <h4 className="card-title text-lg">Configuration Help</h4>
              <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-primary">Game.ini</h5>
              <p className="text-sm text-base-content/70">
                Contains server game rules and settings like harvest multipliers, XP rates, taming speeds, etc.
                These settings apply to all servers in the cluster.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-primary">GameUserSettings.ini</h5>
              <p className="text-sm text-base-content/70">
                Contains user-specific settings like server passwords, admin passwords, and other server configuration.
                These settings apply to all servers in the cluster.
              </p>
            </div>
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                <strong>Important:</strong> Changes to these files will affect all servers in the cluster. 
                Make sure to test your changes on a single server first before applying them globally.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalConfigManager; 