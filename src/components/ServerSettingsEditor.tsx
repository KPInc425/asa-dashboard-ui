import React, { useState } from 'react';
import { api } from '../services/api';

interface ServerSettings {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
  rconPassword: string;
  clusterId?: string;
  clusterPassword?: string;
  harvestMultiplier?: number;
  xpMultiplier?: number;
  tamingMultiplier?: number;
  sessionName?: string;
}

interface ServerSettingsEditorProps {
  server: any;
  onClose: () => void;
  onSave: () => void;
}

const ServerSettingsEditor: React.FC<ServerSettingsEditorProps> = ({ server, onClose, onSave }) => {
  const [settings, setSettings] = useState<ServerSettings>({
    name: server.name || '',
    map: server.map || 'TheIsland',
    gamePort: server.gamePort || server.port || 7777,
    queryPort: server.queryPort || 27015,
    rconPort: server.rconPort || 32330,
    maxPlayers: server.maxPlayers || 70,
    adminPassword: server.adminPassword || 'admin123',
    serverPassword: server.serverPassword || '',
    rconPassword: server.rconPassword || 'rcon123',
    clusterId: server.clusterId || '',
    clusterPassword: server.clusterPassword || '',
    harvestMultiplier: server.harvestMultiplier || 1.0,
    xpMultiplier: server.xpMultiplier || 1.0,
    tamingMultiplier: server.tamingMultiplier || 1.0,
    sessionName: server.sessionName || server.name || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mapOptions = [
    { value: 'TheIsland', label: 'The Island' },
    { value: 'TheCenter', label: 'The Center' },
    { value: 'Ragnarok_WP', label: 'Ragnarok' },
    { value: 'ScorchedEarth_WP', label: 'Scorched Earth' },
    { value: 'Aberration_WP', label: 'Aberration' },
    { value: 'Extinction_WP', label: 'Extinction' },
    { value: 'BobsMissions_WP', label: 'Club ARK' },
    { value: 'CrystalIsles_WP', label: 'Crystal Isles' },
    { value: 'Valguero_WP', label: 'Valguero' },
    { value: 'LostIsland_WP', label: 'Lost Island' },
    { value: 'Fjordur_WP', label: 'Fjordur' },
    { value: 'Genesis_WP', label: 'Genesis' },
    { value: 'Genesis2_WP', label: 'Genesis Part 2' }
  ];

  const handleInputChange = (field: keyof ServerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const validateSettings = (): string | null => {
    if (!settings.name.trim()) {
      return 'Server name is required';
    }
    if (settings.gamePort < 1024 || settings.gamePort > 65535) {
      return 'Game port must be between 1024 and 65535';
    }
    if (settings.queryPort < 1024 || settings.queryPort > 65535) {
      return 'Query port must be between 1024 and 65535';
    }
    if (settings.rconPort < 1024 || settings.rconPort > 65535) {
      return 'RCON port must be between 1024 and 65535';
    }
    if (settings.maxPlayers < 1 || settings.maxPlayers > 255) {
      return 'Max players must be between 1 and 255';
    }
    if (!settings.adminPassword.trim()) {
      return 'Admin password is required';
    }
    if (!settings.rconPassword.trim()) {
      return 'RCON password is required';
    }
    
    // Check for port conflicts
    if (settings.gamePort === settings.queryPort || 
        settings.gamePort === settings.rconPort || 
        settings.queryPort === settings.rconPort) {
      return 'Game port, query port, and RCON port must be different';
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(server.name)}/update-settings`, {
        settings: settings,
        regenerateConfigs: true,
        regenerateScripts: true
      });

      if (response.data.success) {
        setSuccess('Server settings updated successfully!');
        setTimeout(() => {
          onSave();
          onClose();
        }, 1500);
      } else {
        setError(`Failed to update settings: ${response.data.message}`);
      }
    } catch (err) {
      setError(`Failed to update settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Edit Server Settings: {server.name}</h3>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base-content/80">Basic Settings</h4>
            
            <div>
              <label className="label">
                <span className="label-text">Server Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Server Name"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Map</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={settings.map}
                onChange={(e) => handleInputChange('map', e.target.value)}
              >
                {mapOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Session Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={settings.sessionName}
                onChange={(e) => handleInputChange('sessionName', e.target.value)}
                placeholder="Session Name"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Max Players</span>
              </label>
              <input
                type="number"
                min="1"
                max="255"
                className="input input-bordered w-full"
                value={settings.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Port Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base-content/80">Port Settings</h4>
            
            <div>
              <label className="label">
                <span className="label-text">Game Port</span>
              </label>
              <input
                type="number"
                min="1024"
                max="65535"
                className="input input-bordered w-full"
                value={settings.gamePort}
                onChange={(e) => handleInputChange('gamePort', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Query Port</span>
              </label>
              <input
                type="number"
                min="1024"
                max="65535"
                className="input input-bordered w-full"
                value={settings.queryPort}
                onChange={(e) => handleInputChange('queryPort', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">RCON Port</span>
              </label>
              <input
                type="number"
                min="1024"
                max="65535"
                className="input input-bordered w-full"
                value={settings.rconPort}
                onChange={(e) => handleInputChange('rconPort', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Password Settings */}
        <div className="mt-6">
          <h4 className="font-semibold text-base-content/80 mb-4">Password Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Admin Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={settings.adminPassword}
                onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                placeholder="Admin Password"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Server Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={settings.serverPassword}
                onChange={(e) => handleInputChange('serverPassword', e.target.value)}
                placeholder="Server Password (optional)"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">RCON Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={settings.rconPassword}
                onChange={(e) => handleInputChange('rconPassword', e.target.value)}
                placeholder="RCON Password"
              />
            </div>
          </div>
        </div>

        {/* Cluster Settings */}
        {server.isClusterServer && (
          <div className="mt-6">
            <h4 className="font-semibold text-base-content/80 mb-4">Cluster Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Cluster ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={settings.clusterId}
                  onChange={(e) => handleInputChange('clusterId', e.target.value)}
                  placeholder="Cluster ID"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Cluster Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={settings.clusterPassword}
                  onChange={(e) => handleInputChange('clusterPassword', e.target.value)}
                  placeholder="Cluster Password"
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Settings */}
        <div className="mt-6">
          <h4 className="font-semibold text-base-content/80 mb-4">Game Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Harvest Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="input input-bordered w-full"
                value={settings.harvestMultiplier}
                onChange={(e) => handleInputChange('harvestMultiplier', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">XP Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="input input-bordered w-full"
                value={settings.xpMultiplier}
                onChange={(e) => handleInputChange('xpMultiplier', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Taming Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="input input-bordered w-full"
                value={settings.tamingMultiplier}
                onChange={(e) => handleInputChange('tamingMultiplier', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerSettingsEditor; 