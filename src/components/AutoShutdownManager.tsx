import React, { useState, useEffect } from 'react';
import { containerApi } from '../services/api';

interface AutoShutdownConfig {
  enabled: boolean;
  emptyTimeoutMinutes: number;
  warningIntervals: number[];
  warningMessage: string;
  excludeServers: string[];
}

interface ServerStatus {
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  players: number;
  maxPlayers: number;
  lastActivity?: Date;
  emptySince?: Date;
}

const AutoShutdownManager: React.FC = () => {
  const [config, setConfig] = useState<AutoShutdownConfig>({
    enabled: false,
    emptyTimeoutMinutes: 30,
    warningIntervals: [15, 10, 5, 2],
    warningMessage: 'Server will shut down in {time} minutes due to inactivity',
    excludeServers: []
  });
  
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadServers();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await containerApi.getAutoShutdownConfig();
      if (response.success) {
        setConfig(response.config);
      }
    } catch (err) {
      console.error('Failed to load auto-shutdown config:', err);
    }
  };

  const loadServers = async () => {
    try {
      setLoading(true);
      const [containers, nativeServers] = await Promise.all([
        containerApi.getContainers().catch(() => []),
        containerApi.getNativeServers().catch(() => [])
      ]);

      const allServers: ServerStatus[] = [
        ...containers.map(c => ({
          name: c.name,
          status: c.status as ServerStatus['status'],
          players: c.players || 0,
          maxPlayers: c.maxPlayers || 70
        })),
        ...nativeServers.map(s => ({
          name: s.name,
          status: s.status as ServerStatus['status'],
          players: s.players || 0,
          maxPlayers: s.maxPlayers || 70
        }))
      ];

      setServers(allServers);
    } catch (err) {
      setError('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await containerApi.updateAutoShutdownConfig(config);
      setSuccess('Auto-shutdown configuration saved successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleServerExclusion = (serverName: string) => {
    setConfig(prev => ({
      ...prev,
      excludeServers: prev.excludeServers.includes(serverName)
        ? prev.excludeServers.filter(name => name !== serverName)
        : [...prev.excludeServers, serverName]
    }));
  };

  const getEmptyServers = () => {
    return servers.filter(server => 
      server.status === 'running' && 
      server.players === 0 &&
      !config.excludeServers.includes(server.name)
    );
  };

  const getActiveServers = () => {
    return servers.filter(server => 
      server.status === 'running' && 
      server.players > 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Auto-Shutdown Manager</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-base-content/70">
            Status: {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <div className={`badge ${config.enabled ? 'badge-success' : 'badge-error'}`}>
            {config.enabled ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Error/Success Display */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Configuration</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Enable Auto-Shutdown</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Empty Timeout (minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={config.emptyTimeoutMinutes}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    emptyTimeoutMinutes: parseInt(e.target.value) || 30 
                  }))}
                  min="5"
                  max="1440"
                />
                <label className="label">
                  <span className="label-text-alt">How long to wait before shutting down empty servers</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Warning Intervals (minutes)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={config.warningIntervals.join(', ')}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    warningIntervals: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                  }))}
                  placeholder="15, 10, 5, 2"
                />
                <label className="label">
                  <span className="label-text-alt">Comma-separated list of warning intervals</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Warning Message</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={config.warningMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, warningMessage: e.target.value }))}
                  placeholder="Server will shut down in {time} minutes due to inactivity"
                  rows={3}
                />
                <label className="label">
                  <span className="label-text-alt">Use {'{time}'} placeholder for the time remaining</span>
                </label>
              </div>

              <button
                onClick={saveConfig}
                disabled={saving}
                className="btn btn-primary w-full"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Server Status */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Server Status</h3>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Servers */}
                <div>
                  <h4 className="font-semibold text-success mb-2">
                    🟢 Active Servers ({getActiveServers().length})
                  </h4>
                  <div className="space-y-2">
                    {getActiveServers().map(server => (
                      <div key={server.name} className="flex items-center justify-between p-2 bg-success/10 rounded">
                        <span className="text-sm">{server.name}</span>
                        <span className="text-sm font-medium">
                          {server.players}/{server.maxPlayers} players
                        </span>
                      </div>
                    ))}
                    {getActiveServers().length === 0 && (
                      <p className="text-sm text-base-content/50">No active servers</p>
                    )}
                  </div>
                </div>

                {/* Empty Servers */}
                <div>
                  <h4 className="font-semibold text-warning mb-2">
                    🟡 Empty Servers ({getEmptyServers().length})
                  </h4>
                  <div className="space-y-2">
                    {getEmptyServers().map(server => (
                      <div key={server.name} className="flex items-center justify-between p-2 bg-warning/10 rounded">
                        <span className="text-sm">{server.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-warning">Empty</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-warning checkbox-xs"
                            checked={config.excludeServers.includes(server.name)}
                            onChange={() => toggleServerExclusion(server.name)}
                          />
                        </div>
                      </div>
                    ))}
                    {getEmptyServers().length === 0 && (
                      <p className="text-sm text-base-content/50">No empty servers</p>
                    )}
                  </div>
                </div>

                {/* Excluded Servers */}
                {config.excludeServers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-info mb-2">
                      🔵 Excluded Servers ({config.excludeServers.length})
                    </h4>
                    <div className="space-y-2">
                      {config.excludeServers.map(serverName => (
                        <div key={serverName} className="flex items-center justify-between p-2 bg-info/10 rounded">
                          <span className="text-sm">{serverName}</span>
                          <button
                            onClick={() => toggleServerExclusion(serverName)}
                            className="btn btn-xs btn-outline btn-info"
                          >
                            Include
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 className="font-bold">Auto-Shutdown Information</h3>
          <div className="text-sm">
            <p>• Servers with no players will be automatically shut down after the specified timeout</p>
            <p>• Warning messages will be broadcast to players at the specified intervals</p>
            <p>• Excluded servers will not be affected by auto-shutdown</p>
            <p>• Only running servers are monitored</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoShutdownManager; 