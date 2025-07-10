import React, { useState, useEffect } from 'react';
import { Server } from '../pages/Servers';

interface ServerDetailsModalProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServerDetailsModal: React.FC<ServerDetailsModalProps> = ({ server, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'rcon' | 'config' | 'logs'>('details');
  const [rconCommand, setRconCommand] = useState('');
  const [rconResponse, setRconResponse] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const getMapDisplayName = (mapCode: string): string => {
    const mapNames: Record<string, string> = {
      'TheIsland_WP': 'The Island',
      'TheCenter_WP': 'The Center',
      'Ragnarok_WP': 'Ragnarok',
      'ScorchedEarth_WP': 'Scorched Earth',
      'Aberration_WP': 'Aberration',
      'Extinction_WP': 'Extinction',
      'BobsMissions_WP': 'Club ARK',
      'CrystalIsles_WP': 'Crystal Isles',
      'Valguero_WP': 'Valguero',
      'LostIsland_WP': 'Lost Island',
      'Fjordur_WP': 'Fjordur',
      'Genesis_WP': 'Genesis',
      'Genesis2_WP': 'Genesis Part 2',
      'TheIsland': 'The Island',
      'TheCenter': 'The Center',
      'Ragnarok': 'Ragnarok',
      'ScorchedEarth': 'Scorched Earth',
      'Aberration': 'Aberration',
      'Extinction': 'Extinction',
      'BobsMissions': 'Club ARK',
      'CrystalIsles': 'Crystal Isles',
      'Valguero': 'Valguero',
      'LostIsland': 'Lost Island',
      'Fjordur': 'Fjordur',
      'Genesis': 'Genesis',
      'Genesis2': 'Genesis Part 2'
    };
    
    return mapNames[mapCode] || mapCode;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'container': return 'Container';
      case 'native': return 'Native';
      case 'cluster': return 'Cluster';
      case 'cluster-server': return 'Cluster Server';
      case 'individual': return 'Individual Server';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'badge-success';
      case 'stopped': return 'badge-error';
      case 'restarting': return 'badge-warning';
      case 'starting': return 'badge-warning';
      case 'stopping': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const executeRconCommand = async () => {
    if (!server || !rconCommand.trim()) return;
    
    setIsExecuting(true);
    setRconResponse('');
    
    try {
      const response = await fetch(`/api/rcon/${server.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ command: rconCommand })
      });
      
      const data = await response.json();
      setRconResponse(data.success ? data.response : `Error: ${data.message}`);
    } catch (error) {
      setRconResponse(`Error: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!server) return null;

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box w-11/12 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{server.name} - Server Details</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <button 
            className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab ${activeTab === 'rcon' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('rcon')}
          >
            RCON Console
          </button>
          <button 
            className={`tab ${activeTab === 'config' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button 
            className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Server Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Name:</span>
                      <span className="font-medium">{server.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Type:</span>
                      <span className="badge badge-outline">{getTypeLabel(server.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Status:</span>
                      <span className={`badge ${getStatusColor(server.status)}`}>
                        {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                      </span>
                    </div>
                    {server.map && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Map:</span>
                        <span>{getMapDisplayName(server.map)}</span>
                      </div>
                    )}
                    {server.clusterName && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Cluster:</span>
                        <span>{server.clusterName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Network Information</h4>
                  <div className="space-y-2">
                    {server.gamePort && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Game Port:</span>
                        <span>{server.gamePort}</span>
                      </div>
                    )}
                    {server.queryPort && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Query Port:</span>
                        <span>{server.queryPort}</span>
                      </div>
                    )}
                    {server.rconPort && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">RCON Port:</span>
                        <span>{server.rconPort}</span>
                      </div>
                    )}
                    {server.maxPlayers && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Max Players:</span>
                        <span>{server.maxPlayers}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {server.config && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Configuration</h4>
                  <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-64">
                    {JSON.stringify(server.config, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rcon' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">RCON Command</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter RCON command..."
                  className="input input-bordered flex-1"
                  value={rconCommand}
                  onChange={(e) => setRconCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && executeRconCommand()}
                />
                <button
                  className="btn btn-primary"
                  onClick={executeRconCommand}
                  disabled={isExecuting || !rconCommand.trim()}
                >
                  {isExecuting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Execute'
                  )}
                </button>
              </div>
            </div>

            {rconResponse && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Response</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  value={rconResponse}
                  readOnly
                />
              </div>
            )}

            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Common RCON commands: <code>listplayers</code>, <code>saveworld</code>, <code>broadcast</code>, <code>shutdown</code></span>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Configuration editing will be available in a future update.</span>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Log viewing will be available in a future update.</span>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ServerDetailsModal; 