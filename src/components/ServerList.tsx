import React, { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

interface Server {
  name: string;
  status: string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  image?: string;
  ports?: any[];
  created?: string;
  serverCount?: number;
  maps?: string;
  config?: any;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  players?: number;
  isClusterServer?: boolean;
  autoUpdateStatus?: {
    status: string;
    updateAvailable: boolean;
    currentVersion?: string;
    latestVersion?: string;
    lastCheck?: string;
    message?: string;
  };
}

interface ServerListProps {
  servers: Server[];
  actionLoading: string | null;
  onAction: (action: 'start' | 'stop' | 'restart', server: Server) => void;
  onViewDetails: (server: Server) => void;
  onConfigClick?: (server: Server) => void;
}

function ServerListComponent({
  servers,
  actionLoading,
  onAction,
  onViewDetails,
  onConfigClick
}: ServerListProps) {
  const { showToast } = useToast();

  const handleFixRcon = useCallback(async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/fix-rcon`);
      if (response.data.success) {
        showToast(`${response.data.message} — restart server to apply changes`, 'success');
      } else {
        showToast(`Failed to fix RCON: ${response.data.message}`, 'error');
      }
    } catch (error) {
      showToast(`Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [showToast]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'badge-success';
      case 'stopped': return 'badge-error';
      case 'starting': return 'badge-warning';
      case 'restarting': return 'badge-warning';
      default: return 'badge-outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'starting': return '🟡';
      case 'restarting': return '🟡';
      default: return '⚪';
    }
  };

  const getUpdateBadge = (server: Server) => {
    if (!server.autoUpdateStatus) {
      return null;
    }

    if (server.autoUpdateStatus.updateAvailable) {
      return <span className="badge badge-warning badge-sm">Needs update</span>;
    }

    switch (server.autoUpdateStatus.status) {
      case 'checking':
        return <span className="badge badge-info badge-sm">Checking updates</span>;
      case 'warning':
      case 'updating':
        return <span className="badge badge-primary badge-sm">Updating</span>;
      case 'failed':
        return <span className="badge badge-error badge-sm">Update failed</span>;
      default:
        return <span className="badge badge-success badge-sm">Up to date</span>;
    }
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'badge-outline';
    
    switch (type) {
      case 'container': return 'badge-primary';
      case 'native': return 'badge-secondary';
      case 'cluster': return 'badge-accent';
      default: return 'badge-outline';
    }
  };

  const getTypeLabel = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    switch (type) {
      case 'container': return 'Container';
      case 'native': return 'Native';
      case 'cluster': return 'Cluster';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const renderPort = (portObj: any) => {
    if (typeof portObj === 'string') return portObj;
    if (portObj.IP && portObj.PublicPort && portObj.PrivatePort) {
      return `${portObj.PublicPort}:${portObj.PrivatePort}`;
    }
    return JSON.stringify(portObj);
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Server</th>
            <th>Type</th>
            <th>Status</th>
            <th>Ports</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server, index) => (
            <tr 
              key={server.name}
              className="transition-all duration-200"
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <td>
                <div className="flex items-center space-x-3">
                  <div className="avatar placeholder">
                    <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-10 pt-1">
                      <span className="text-lg pl-2">🦖</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{server.name}</div>
                    {server.image && (
                      <div className="text-sm opacity-50">{server.image}</div>
                    )}
                    {server.autoUpdateStatus?.currentVersion && (
                      <div className="text-xs opacity-60">
                        Build: {server.autoUpdateStatus.currentVersion}
                        {server.autoUpdateStatus.latestVersion && server.autoUpdateStatus.latestVersion !== server.autoUpdateStatus.currentVersion
                          ? ` -> ${server.autoUpdateStatus.latestVersion}`
                          : ''}
                      </div>
                    )}
                    {server.autoUpdateStatus?.lastCheck && (
                      <div className="text-xs opacity-60">
                        Last update check: {new Date(server.autoUpdateStatus.lastCheck).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="flex gap-1 items-center">
                  <span className={`badge ${getTypeColor(server.type)}`}>
                    {getTypeLabel(server.type)}
                  </span>
                  {server.isClusterServer && (
                    <span className="badge badge-info badge-xs">
                      Cluster
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">{getStatusIcon(server.status)}</span>
                  <span className={`badge ${getStatusColor(server.status)}`}>
                    {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                  </span>
                  {getUpdateBadge(server)}
                </div>
              </td>
              <td>
                {server.type === 'container' && server.ports ? (
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(server.ports) ? (
                      server.ports.map((port, i) => (
                        <span key={i} className="badge badge-outline badge-sm">
                          {renderPort(port)}
                        </span>
                      ))
                    ) : (
                      <span className="badge badge-outline badge-sm">
                        {server.ports}
                      </span>
                    )}
                  </div>
                ) : server.type === 'native' ? (
                  <div className="flex flex-col gap-1">
                    {server.gamePort && (
                      <span className="badge badge-outline badge-sm">
                        Port: {server.gamePort}
                      </span>
                    )}
                    {server.queryPort && (
                      <span className="badge badge-outline badge-sm">
                        Query: {server.queryPort}
                      </span>
                    )}
                    {server.rconPort && (
                      <span className="badge badge-outline badge-sm">
                        RCON: {server.rconPort}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-base-content/50">-</span>
                )}
              </td>
              <td>
                {server.created ? (
                  <span className="text-sm text-base-content/70">
                    {new Date(server.created).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-base-content/50">-</span>
                )}
              </td>
              <td>
                <div className="flex gap-2">
                  <button
                    className="btn btn-xs btn-success"
                    title="Start Server"
                    disabled={server.status === 'running' || actionLoading === server.name}
                    onClick={() => onAction('start', server)}
                    aria-label={`Start ${server.name}`}
                  >
                    {actionLoading === server.name ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      '▶'
                    )}
                  </button>
                  <button
                    className="btn btn-xs btn-warning"
                    title="Restart Server"
                    disabled={server.status !== 'running' || actionLoading === server.name}
                    onClick={() => onAction('restart', server)}
                    aria-label={`Restart ${server.name}`}
                  >
                    {actionLoading === server.name ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      '↻'
                    )}
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    title="Stop Server"
                    disabled={server.status !== 'running' || actionLoading === server.name}
                    onClick={() => onAction('stop', server)}
                    aria-label={`Stop ${server.name}`}
                  >
                    {actionLoading === server.name ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      '⏹'
                    )}
                  </button>
                  <button
                    title="View Details"
                    onClick={() => onViewDetails(server)}
                    className="btn btn-xs btn-info"
                    aria-label={`View details for ${server.name}`}
                  >
                    🔍
                  </button>
                  {onConfigClick && (
                    <button
                      title="Edit Configuration"
                      onClick={() => onConfigClick(server)}
                      className="btn btn-xs btn-secondary"
                      aria-label={`Edit configuration for ${server.name}`}
                    >
                      ⚙️
                    </button>
                  )}
                  <button
                    title="Fix RCON authentication issues"
                    onClick={() => handleFixRcon(server.name)}
                    className="btn btn-xs btn-warning"
                    aria-label={`Fix RCON for ${server.name}`}
                  >
                    🔧
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

  const ServerList = React.memo(ServerListComponent);
  ServerList.displayName = 'ServerList';

  export default ServerList;