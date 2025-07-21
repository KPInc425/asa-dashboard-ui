import React from 'react';

interface Server {
  name: string;
  status: string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  isClusterServer?: boolean;
  crashInfo?: {
    exitCode: number;
    exitSignal: string;
    exitTime: string;
    error?: string;
  };
  startupErrors?: string;
}

interface ServerStatusIndicatorProps {
  server: Server;
  actionStatus: Record<string, string>;
}

const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ server, actionStatus }) => {
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

  return (
    <>
      {/* Header with title and status icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 md:gap-2 flex-wrap min-w-0">
          <h3 className="font-semibold text-sm md:text-base text-base-content truncate">{server.name}</h3>
          <span className={`badge ${getTypeColor(server.type)} badge-xs`}>
            {getTypeLabel(server.type)}
          </span>
          {server.isClusterServer && (
            <span className="badge badge-info badge-xs">
              Cluster
            </span>
          )}
        </div>
        <span className="text-xl md:text-2xl flex-shrink-0">{getStatusIcon(server.status, actionStatus[server.name])}</span>
      </div>

      {/* Status badge */}
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-base-content/70">Status:</span>
        <span className={`badge ${getStatusColor(server.status, actionStatus[server.name])} badge-xs md:badge-sm`}>
          {actionStatus[server.name] || (server.status ? server.status.charAt(0).toUpperCase() + server.status.slice(1) : 'Unknown')}
        </span>
      </div>

      {/* Show crash information if server crashed */}
      {server.crashInfo && (
        <div className="mt-2 p-2 md:p-3 bg-error/10 border border-error/20 rounded">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-error text-xs">💥 Crashed</span>
          </div>
          <div className="text-xs text-error/80 space-y-1">
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
        <div className="mt-2 p-2 md:p-3 bg-warning/10 border border-warning/20 rounded">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-warning text-xs">⚠️ Startup Failed</span>
          </div>
          <div className="text-xs text-warning/80 truncate" title={server.startupErrors}>
            {server.startupErrors}
          </div>
        </div>
      )}
    </>
  );
};

export default ServerStatusIndicator; 