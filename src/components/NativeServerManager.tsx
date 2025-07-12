import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { containerApi } from '../services/api';

interface NativeServerConfig {
  serverPath: string;
  mapName: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  serverName: string;
  maxPlayers: number;
  serverPassword: string;
  adminPassword: string;
  mods: string[];
  additionalArgs: string;
}

interface NativeServer {
  name: string;
  status: string;
  image: string;
  ports: string;
  created: string;
  type?: 'individual' | 'cluster' | 'cluster-server';
  serverCount?: number;
  maps?: string;
  config?: NativeServerConfig;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
}

const NativeServerManager: React.FC = () => {
  const [servers, setServers] = useState<NativeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<NativeServer | null>(null);
  const [showStartBatModal, setShowStartBatModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<NativeServer | null>(null);
  const [startBatContent, setStartBatContent] = useState('');
  const [formData, setFormData] = useState<Partial<NativeServerConfig>>({
    serverPath: 'C:\\ARK\\servers',
    mapName: 'TheIsland',
    gamePort: 7777,
    queryPort: 27015,
    rconPort: 32330,
    serverName: 'ASA Server',
    maxPlayers: 70,
    serverPassword: '',
    adminPassword: 'admin123',
    mods: [],
    additionalArgs: ''
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/native-servers');
      if (response.data.success) {
        console.log('NativeServerManager - Servers loaded:', response.data.servers);
        console.log('NativeServerManager - Server types:', response.data.servers.map((s: any) => ({ name: s.name, type: s.type })));
        setServers(response.data.servers);
      }
    } catch (error) {
      console.error('Failed to load native servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serverPath) {
      alert('Server path is required');
      return;
    }

    try {
      const serverName = editingServer?.name || `native-server-${Date.now()}`;
      const response = await api.post('/api/native-servers', {
        name: serverName,
        config: formData
      });

      if (response.data.success) {
        setShowAddModal(false);
        setEditingServer(null);
        setFormData({
          serverPath: 'C:\\ARK\\servers',
          mapName: 'TheIsland',
          gamePort: 7777,
          queryPort: 27015,
          rconPort: 32330,
          serverName: 'ASA Server',
          maxPlayers: 70,
          serverPassword: '',
          adminPassword: 'admin123',
          mods: [],
          additionalArgs: ''
        });
        loadServers();
      }
    } catch (error) {
      console.error('Failed to save server configuration:', error);
      alert('Failed to save server configuration');
    }
  };

  const handleStart = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/start`);
      if (response.data.success) {
        loadServers();
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Failed to start server');
    }
  };

  const handleStop = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/stop`);
      if (response.data.success) {
        loadServers();
      }
    } catch (error) {
      console.error('Failed to stop server:', error);
      alert('Failed to stop server');
    }
  };

  const handleRestart = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/restart`);
      if (response.data.success) {
        loadServers();
      }
    } catch (error) {
      console.error('Failed to restart server:', error);
      alert('Failed to restart server');
    }
  };

  const handleDelete = async (serverName: string) => {
    if (!confirm(`Are you sure you want to delete server "${serverName}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/native-servers/${serverName}`);
      if (response.data.success) {
        loadServers();
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
      alert('Failed to delete server');
    }
  };

  const handleEdit = (server: NativeServer) => {
    if (server.type === 'cluster') {
      alert('Clusters cannot be edited through this interface. Use the Server Provisioner to manage clusters.');
      return;
    }
    
    if (server.type === 'cluster-server') {
      alert('Cluster servers cannot be edited through this interface. Use the Server Provisioner to manage cluster servers.');
      return;
    }
    
    if (!server.config) {
      alert('Server configuration not available for editing.');
      return;
    }
    
    setEditingServer(server);
    setFormData(server.config);
    setShowAddModal(true);
  };

  const handleViewStartBat = async (server: NativeServer) => {
    if (server.type !== 'cluster-server') {
      alert('Start.bat files are only available for cluster servers.');
      return;
    }

    try {
      const response = await api.get(`/api/native-servers/${server.name}/start-bat`);
      if (response.data.success) {
        setStartBatContent(response.data.content);
        setSelectedServer(server);
        setShowStartBatModal(true);
      }
    } catch (error) {
      console.error('Failed to get start.bat:', error);
      alert('Failed to get start.bat file');
    }
  };

  const handleUpdateStartBat = async () => {
    if (!selectedServer) return;

    try {
      const response = await api.put(`/api/native-servers/${selectedServer.name}/start-bat`, {
        content: startBatContent
      });
      if (response.data.success) {
        alert('Start.bat updated successfully!');
        setShowStartBatModal(false);
      }
    } catch (error) {
      console.error('Failed to update start.bat:', error);
      alert('Failed to update start.bat file');
    }
  };

  const handleRegenerateStartBat = async (serverName: string) => {
    try {
      const response = await containerApi.regenerateNativeServerStartBat(serverName);
      if (response.success) {
        alert(response.message);
        // Optionally refresh the server list to show updated status
        loadServers();
      } else {
        alert('Failed to regenerate start.bat: ' + response.message);
      }
    } catch (error) {
      console.error('Failed to regenerate start.bat:', error);
      alert('Failed to regenerate start.bat file');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return '🟢';
      case 'stopped':
        return '🔴';
      case 'restarting':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'text-success';
      case 'stopped':
        return 'text-error';
      case 'restarting':
        return 'text-warning';
      default:
        return 'text-base-content/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-base-content/70">Loading native servers...</p>
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
              <h1 className="text-3xl font-bold text-primary mb-2">Native Servers & Clusters</h1>
              <p className="text-base-content/70">Manage your Windows ASA servers and clusters</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadServers()}
                className="btn btn-outline btn-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-sm"
              >
                ➕ Add Server
              </button>
            </div>
          </div>
        </div>

        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Server Status</h2>
          
          {servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No native servers found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                Add Your First Server
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {servers.map((server) => {
                console.log('NativeServerManager - Rendering server card:', { name: server.name, type: server.type, status: server.status });
                return (
                <div key={server.name} className="bg-base-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base-content">{server.name}</h3>
                      {server.type === 'cluster' && (
                        <span className="badge badge-primary badge-xs">Cluster</span>
                      )}
                      {server.type === 'cluster-server' && (
                        <span className="badge badge-accent badge-xs">Cluster Server</span>
                      )}
                      {server.type === 'individual' && (
                        <span className="badge badge-secondary badge-xs">Individual Server</span>
                      )}
                    </div>
                    <span className="text-2xl">{getStatusIcon(server.status)}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Status:</span>
                      <span className={getStatusColor(server.status)}>
                        {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                      </span>
                    </div>
                    
                    {server.serverCount && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Servers:</span>
                        <span className="badge badge-outline badge-xs">{server.serverCount}</span>
                      </div>
                    )}
                    
                    {server.maps && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Maps:</span>
                        <span className="text-xs text-base-content/70 truncate">{server.maps}</span>
                      </div>
                    )}
                    
                    {server.map && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Map:</span>
                        <span className="text-xs text-base-content/70">{server.map}</span>
                      </div>
                    )}
                    
                    {server.clusterName && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Cluster:</span>
                        <span className="text-xs text-base-content/70">{server.clusterName}</span>
                      </div>
                    )}
                    
                    {server.gamePort && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Port:</span>
                        <span className="text-xs text-base-content/70">{server.gamePort}</span>
                      </div>
                    )}
                    
                    {server.ports && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Ports:</span>
                        <span className="text-xs text-base-content/70 truncate">{server.ports}</span>
                      </div>
                    )}
                    
                    {server.created && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Created:</span>
                        <span className="text-xs">{new Date(server.created).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {/* Cluster summary card controls */}
                    {server.type === 'cluster' && (
                      <>
                        <button
                          title="Start all servers in this cluster"
                          onClick={() => handleStart(server.name)}
                          disabled={server.status === 'running'}
                          className="btn btn-success btn-xs flex-1"
                        >
                          ▶️ Start Cluster
                        </button>
                        <button
                          title="Stop all servers in this cluster"
                          onClick={() => handleStop(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-error btn-xs flex-1"
                        >
                          ⏹️ Stop Cluster
                        </button>
                        <button
                          title="Restart all servers in this cluster"
                          onClick={() => handleRestart(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-warning btn-xs flex-1"
                        >
                          🔄 Restart Cluster
                        </button>
                      </>
                    )}
                    {/* Cluster server controls */}
                    {server.type === 'cluster-server' && (
                      <>
                        <button
                          title="Start this cluster server"
                          onClick={() => handleStart(server.name)}
                          disabled={server.status === 'running'}
                          className="btn btn-success btn-xs flex-1"
                        >
                          ▶️ Start
                        </button>
                        <button
                          title="Stop this cluster server"
                          onClick={() => handleStop(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-error btn-xs flex-1"
                        >
                          ⏹️ Stop
                        </button>
                        <button
                          title="Restart this cluster server"
                          onClick={() => handleRestart(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-warning btn-xs flex-1"
                        >
                          🔄 Restart
                        </button>
                        <button
                          title="View or edit start.bat for this server"
                          onClick={() => handleViewStartBat(server)}
                          className="btn btn-info btn-xs flex-1"
                        >
                          📄 Start.bat
                        </button>
                        <button
                          title="Regenerate start.bat with latest mods and config"
                          onClick={() => handleRegenerateStartBat(server.name)}
                          className="btn btn-warning btn-xs flex-1"
                        >
                          🔄 Regenerate
                        </button>
                      </>
                    )}
                    {/* Individual server controls */}
                    {server.type === 'individual' && (
                      <>
                        <button
                          title="Start this server"
                          onClick={() => handleStart(server.name)}
                          disabled={server.status === 'running'}
                          className="btn btn-success btn-xs flex-1"
                        >
                          ▶️ Start
                        </button>
                        <button
                          title="Stop this server"
                          onClick={() => handleStop(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-error btn-xs flex-1"
                        >
                          ⏹️ Stop
                        </button>
                        <button
                          title="Restart this server"
                          onClick={() => handleRestart(server.name)}
                          disabled={server.status === 'stopped'}
                          className="btn btn-warning btn-xs flex-1"
                        >
                          🔄 Restart
                        </button>
                        <button
                          title="Edit this server's configuration"
                          onClick={() => handleEdit(server)}
                          className="btn btn-info btn-xs flex-1"
                        >
                          ✏️ Edit
                        </button>
                      </>
                    )}
                    {/* Delete button for all except cluster summary */}
                    {server.type !== 'cluster' && (
                      <button
                        title="Delete this server"
                        onClick={() => handleDelete(server.name)}
                        className="btn btn-error btn-xs flex-1"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Server Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Server Path</span>
                  </label>
                  <input
                    type="text"
                    placeholder="C:\ARK\servers"
                    className="input input-bordered w-full"
                    value={formData.serverPath}
                    onChange={(e) => setFormData(prev => ({ ...prev, serverPath: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Server Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ASA Server"
                    className="input input-bordered w-full"
                    value={formData.serverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, serverName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Map</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.mapName}
                    onChange={(e) => setFormData(prev => ({ ...prev, mapName: e.target.value }))}
                  >
                    <option value="TheIsland">The Island</option>
                    <option value="TheCenter">The Center</option>
                    <option value="ScorchedEarth">Scorched Earth</option>
                    <option value="Ragnarok">Ragnarok</option>
                    <option value="Aberration">Aberration</option>
                    <option value="Extinction">Extinction</option>
                    <option value="Valguero">Valguero</option>
                    <option value="Genesis">Genesis</option>
                    <option value="CrystalIsles">Crystal Isles</option>
                    <option value="Genesis2">Genesis Part 2</option>
                    <option value="LostIsland">Lost Island</option>
                    <option value="Fjordur">Fjordur</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Game Port</span>
                  </label>
                  <input
                    type="number"
                    min="1024"
                    max="65535"
                    className="input input-bordered w-full"
                    value={formData.gamePort}
                    onChange={(e) => setFormData(prev => ({ ...prev, gamePort: parseInt(e.target.value) }))}
                    required
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
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Query Port</span>
                  </label>
                  <input
                    type="number"
                    min="1024"
                    max="65535"
                    className="input input-bordered w-full"
                    value={formData.queryPort}
                    onChange={(e) => setFormData(prev => ({ ...prev, queryPort: parseInt(e.target.value) }))}
                    required
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
                    value={formData.rconPort}
                    onChange={(e) => setFormData(prev => ({ ...prev, rconPort: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Server Password (optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for no password"
                    className="input input-bordered w-full"
                    value={formData.serverPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, serverPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Admin Password</span>
                  </label>
                  <input
                    type="text"
                    placeholder="admin123"
                    className="input input-bordered w-full"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Additional Arguments (optional)</span>
                </label>
                <textarea
                  placeholder="-log -nosteam -servergamelog"
                  className="textarea textarea-bordered w-full"
                  value={formData.additionalArgs}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalArgs: e.target.value }))}
                  rows={3}
                />
              </div>
            </form>
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingServer(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
              >
                {editingServer ? 'Update Server' : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start.bat Editor Modal */}
      {showStartBatModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh]">
            <h3 className="font-bold text-lg mb-4">
              Edit Start.bat - {selectedServer?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Start.bat Content</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full font-mono text-sm"
                  rows={20}
                  value={startBatContent}
                  onChange={(e) => setStartBatContent(e.target.value)}
                  placeholder="@echo off&#10;echo Starting server..."
                />
              </div>
              <div className="text-xs text-base-content/50">
                <p><strong>Note:</strong> This file controls how the server starts. Be careful when editing!</p>
                <p>Common variables: %PORT%, %QUERYPORT%, %RCONPORT%, %MAP%, %SERVERNAME%</p>
              </div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowStartBatModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStartBat}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NativeServerManager; 