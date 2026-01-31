import React from 'react';
import { 
  getStatusIcon, 
  getStatusLabel, 
  getStatusBadgeClass 
} from '../../utils/statusStyles';
import { ServerStatus as ServerStatusEnum } from '../../types/serverStatus';

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
  transition?: {
    status: string;
    previousStatus?: string;
    transitionStartedAt?: string;
  };
}

interface ServerStatusIndicatorProps {
  server: Server;
  actionStatus: Record<string, string>;
  isTransitioning?: boolean;
  transitionDuration?: number;
}

const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ 
  server, 
  actionStatus,
  isTransitioning = false,
  transitionDuration = 0,
}) => {
  // Check if server is in transition state
  const isInTransition = isTransitioning || 
    server.status === 'starting' || 
    server.status === 'stopping' ||
    !!actionStatus[server.name];
  
  const getStatusBadgeWithAction = () => {
    if (actionStatus[server.name]) {
      return 'badge-warning animate-pulse';
    }
    return getStatusBadgeClass(server.status, true);
  };

  const getStatusIconWithAction = () => {
    if (actionStatus[server.name]) {
      return '🟡';
    }
    return getStatusIcon(server.status);
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

  // Format transition duration for display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return '0s';
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000);
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Check if status is unknown for special styling
  const isUnknownStatus = server.status === ServerStatusEnum.UNKNOWN || server.status === 'unknown';

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
        <span className="text-xl md:text-2xl flex-shrink-0">{getStatusIconWithAction()}</span>
      </div>

      {/* Status badge */}
      <div className="flex justify-between items-center">
        <span className="text-xs md:text-sm text-base-content/70">Status:</span>
        <div className="flex items-center gap-2">
          {isInTransition && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          <span className={`badge ${getStatusBadgeWithAction()} badge-xs md:badge-sm ${isUnknownStatus ? 'status-striped' : ''}`}>
            {actionStatus[server.name] || getStatusLabel(server.status)}
          </span>
        </div>
      </div>

      {/* Transition duration indicator */}
      {isInTransition && transitionDuration > 0 && (
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-base-content/50">Elapsed:</span>
          <span className={`${transitionDuration > 300000 ? 'text-warning' : 'text-base-content/50'}`}>
            {formatDuration(transitionDuration)}
          </span>
        </div>
      )}

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