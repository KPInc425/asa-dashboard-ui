import React from 'react';

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
  crashInfo?: {
    exitCode: number;
    exitSignal: string;
    exitTime: string;
    error?: string;
  };
  startupErrors?: string;
}

interface ServerCardProps {
  server: Server;
  actionLoading: string | null;
  actionStatus: Record<string, string>;
  onAction: (action: 'start' | 'stop' | 'restart', server: Server) => void;
  onViewDetails: (server: Server) => void;
  onConfigClick?: (server: Server) => void;
  onUpdateClick?: (server: Server) => void;
}

const ServerCard: React.FC<ServerCardProps> = ({
  server,
  actionLoading,
  actionStatus,
  onAction,
  onViewDetails,
  onConfigClick,
  onUpdateClick
}) => {
  // Safety check - if server is invalid, don't render
  if (!server || typeof server !== 'object') {
    console.error('ServerCard received invalid server data:', server);
    return (
      <div className="bg-base-300 rounded-lg p-4">
        <div className="text-error">Invalid server data</div>
      </div>
    );
  }
  
  const getStatusColor = (status: string | undefined, actionStatus?: string) => {
    // If there's an action status, show warning color
    if (actionStatus) {
      return 'badge-warning animate-pulse';
    }
    
    if (!status) return 'badge-outline';
    
    switch (status.toLowerCase()) {
      case 'running':
        return 'badge-success';
      case 'stopped':
        return 'badge-error';
      case 'starting':
      case 'stopping':
      case 'restarting':
        return 'badge-warning animate-pulse';
      case 'crashed':
        return 'badge-error';
      case 'error':
        return 'badge-error';
      default:
        return 'badge-outline';
    }
  };

  const getStatusIcon = (status: string | undefined, actionStatus?: string) => {
    // If there's an action status, show warning icon immediately
    if (actionStatus) {
      return '🟡';
    }
    
    if (!status) return '⚪';
    
    // Use simple status detection for the icon
    switch (status.toLowerCase()) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'starting': return '🟡';
      case 'stopping': return '🟡';
      case 'restarting': return '🟡';
      case 'crashed': return '💥';
      case 'error': return '🔴';
      default: return '⚪';
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

  const getMapDisplayName = (mapCode: string): string => {
    const mapNames: Record<string, string> = {
      'TheIsland': 'The Island',
      'TheIsland_WP': 'The Island',
      'ScorchedEarth': 'Scorched Earth',
      'Aberration': 'Aberration',
      'Extinction': 'Extinction',
      'Genesis': 'Genesis',
      'Genesis2': 'Genesis Part 2',
      'CrystalIsles': 'Crystal Isles',
      'Valguero': 'Valguero',
      'LostIsland': 'Lost Island',
      'Fjordur': 'Fjordur',
      'BobsMissions_WP': 'Club ARK'
    };
    
    return mapNames[mapCode] || mapCode;
  };

  return (
    <div className="bg-base-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base-content">{server.name}</h3>
          <span className={`badge ${getTypeColor(server.type)} badge-xs`}>
            {getTypeLabel(server.type)}
          </span>
          {server.isClusterServer && (
            <span className="badge badge-info badge-xs">
              Cluster
            </span>
          )}
        </div>
        <span className="text-2xl">{getStatusIcon(server.status, actionStatus[server.name])}</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-base-content/70">Status:</span>
          <span className={`badge ${getStatusColor(server.status, actionStatus[server.name])} badge-xs`}>
            {actionStatus[server.name] || (server.status ? server.status.charAt(0).toUpperCase() + server.status.slice(1) : 'Unknown')}
          </span>
        </div>
        
        {/* Only show server count for actual clusters, not individual servers */}
        {server.serverCount && server.serverCount > 1 && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Servers:</span>
            <span className="badge badge-outline badge-xs">{server.serverCount}</span>
          </div>
        )}
        
        {/* Show map name with proper display name */}
        {server.map && server.map !== 'Unknown' && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Map:</span>
            <span className="text-xs text-base-content/70">{getMapDisplayName(server.map)}</span>
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
        
        {server.queryPort && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Query Port:</span>
            <span className="text-xs text-base-content/70">{server.queryPort}</span>
          </div>
        )}
        
        {server.rconPort && (
          <div className="flex justify-between">
            <span className="text-base-content/70">RCON Port:</span>
            <span className="text-xs text-base-content/70">{server.rconPort}</span>
          </div>
        )}
        
        {/* Only show port mapping for Docker containers */}
        {server.ports && server.type === 'container' && (
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
        <button
          title={`Start ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('start', server)}
          disabled={server.status === 'running' || actionLoading === server.name}
          className="btn btn-success btn-xs"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '▶️'
          )}
        </button>
        <button
          title={`Stop ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('stop', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-error btn-xs"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '⏹️'
          )}
        </button>
        <button
          title={`Restart ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('restart', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-warning btn-xs"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '🔄'
          )}
        </button>
        {onConfigClick && (
          <button
            title="Edit Configuration"
            onClick={() => onConfigClick(server)}
            className="btn btn-info btn-xs"
          >
            ⚙️
          </button>
        )}
        {onUpdateClick && (
          <button
            title="Update Server"
            onClick={() => onUpdateClick(server)}
            className="btn btn-accent btn-xs"
          >
            🔄
          </button>
        )}
      </div>
      
      <div className="mt-3">
        <button
          title="View Details"
          onClick={() => onViewDetails(server)}
          className="btn btn-info btn-sm w-full"
        >
          🔍 View Details
        </button>
      </div>

        {/* Show crash information if server crashed */}
        {server.crashInfo && (
          <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-error text-xs">💥 Crashed</span>
            </div>
            <div className="text-xs text-error/80">
              <div>Exit Code: {server.crashInfo.exitCode}</div>
              {server.crashInfo.error && (
                <div className="truncate" title={server.crashInfo.error}>
                  Error: {server.crashInfo.error}
                </div>
              )}
              <div>Time: {new Date(server.crashInfo.exitTime).toLocaleString()}</div>
            </div>
          </div>
        )}
        
        {/* Show startup errors if present */}
        {server.startupErrors && (
          <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-warning text-xs">⚠️ Startup Failed</span>
            </div>
            <div className="text-xs text-warning/80 truncate" title={server.startupErrors}>
              {server.startupErrors}
            </div>
          </div>
        )}
    </div>
  );
};

export default ServerCard; 