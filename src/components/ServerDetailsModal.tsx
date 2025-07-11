import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Server } from '../utils/serverUtils';

interface ServerDetailsModalProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServerDetailsModal: React.FC<ServerDetailsModalProps> = ({ server, isOpen, onClose }) => {
  const navigate = useNavigate();

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

  const handleOpenFullDetails = () => {
    if (server) {
      navigate(`/servers/${encodeURIComponent(server.name)}`);
      onClose();
    }
  };

  if (!server) return null;

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{server.name} - Quick Overview</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>

        <div className="space-y-4">
          {/* Server Information */}
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

          {/* Quick Actions */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="card-title">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenFullDetails}
                  className="btn btn-primary"
                >
                  🚀 Open Full Management
                </button>
                <button
                  onClick={() => {
                    if (server) {
                      navigate(`/servers/${encodeURIComponent(server.name)}?tab=config`);
                      onClose();
                    }
                  }}
                  className="btn btn-outline"
                >
                  ⚙️ Edit Configuration
                </button>
                <button
                  onClick={() => {
                    if (server) {
                      navigate(`/servers/${encodeURIComponent(server.name)}?tab=rcon`);
                      onClose();
                    }
                  }}
                  className="btn btn-outline"
                >
                  🖥️ RCON Console
                </button>
                <button
                  onClick={() => {
                    if (server) {
                      navigate(`/servers/${encodeURIComponent(server.name)}?tab=mods`);
                      onClose();
                    }
                  }}
                  className="btn btn-outline"
                >
                  🎮 Manage Mods
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Preview */}
          {server.config && (
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Configuration Preview</h4>
                <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-32">
                  {JSON.stringify(server.config, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ServerDetailsModal; 