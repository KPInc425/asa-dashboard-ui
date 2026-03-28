import React from 'react';
import { ServerLiveStats, ServerActionButtons, ServerStatusIndicator } from './ServerCard/index';

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
  version?: string;
  autoUpdateStatus?: {
    status: string;
    updateAvailable: boolean;
    currentVersion?: string;
    latestVersion?: string;
    lastCheck?: string;
    message?: string;
  };
}

interface ServerCardProps {
  server: Server;
  actionLoading: string | null;
  actionStatus: Record<string, string>;
  onAction: (action: 'start' | 'stop' | 'restart', server: Server) => void;
  onViewDetails: (server: Server) => void;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({
  server,
  actionLoading,
  actionStatus,
  onAction,
  onViewDetails
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

  const getUpdateIndicator = () => {
    if (!server.autoUpdateStatus) {
      return null;
    }

    if (server.autoUpdateStatus.updateAvailable) {
      return {
        label: 'Needs update',
        badgeClass: 'badge-warning',
      };
    }

    switch (server.autoUpdateStatus.status) {
      case 'checking':
        return {
          label: 'Checking updates',
          badgeClass: 'badge-info',
        };
      case 'warning':
      case 'updating':
        return {
          label: 'Updating',
          badgeClass: 'badge-primary',
        };
      case 'failed':
        return {
          label: 'Update failed',
          badgeClass: 'badge-error',
        };
      default:
        return {
          label: 'Up to date',
          badgeClass: 'badge-success',
        };
    }
  };

  const updateIndicator = getUpdateIndicator();
  const currentVersion = server.autoUpdateStatus?.currentVersion ?? server.version;
  const latestVersion = server.autoUpdateStatus?.latestVersion;
  const showLatestVersion = latestVersion && latestVersion !== currentVersion;

  return (
    <div className="bg-base-300 rounded-lg p-3 md:p-4 hover:shadow-lg transition-all duration-200 flex flex-col h-full min-h-[320px] md:min-h-[350px]">
      <ServerStatusIndicator server={server} actionStatus={actionStatus} />
      
      <div className="space-y-1 md:space-y-2 text-xs md:text-sm flex-grow flex flex-col">
        {updateIndicator && (
          <div className="flex justify-between items-start gap-2">
            <span className="text-base-content/70">Update:</span>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className={`badge badge-sm ${updateIndicator.badgeClass}`}>{updateIndicator.label}</span>
              {server.autoUpdateStatus?.message && (
                <span className="text-[11px] text-base-content/50 max-w-[180px] leading-tight">
                  {server.autoUpdateStatus.message}
                </span>
              )}
            </div>
          </div>
        )}

        {(currentVersion || showLatestVersion) && (
          <div className="flex justify-between items-start gap-2">
            <span className="text-base-content/70">Build:</span>
            <div className="flex flex-col items-end text-right">
              {currentVersion && (
                <span className="text-base-content/70 font-mono text-[11px] md:text-xs">Current {currentVersion}</span>
              )}
              {showLatestVersion && (
                <span className="text-warning font-mono text-[11px] md:text-xs">Latest {latestVersion}</span>
              )}
            </div>
          </div>
        )}

        {/* Live Player Count - Show when server is running */}
        <ServerLiveStats server={server} />
        
        {/* Only show server count for actual clusters, not individual servers */}
        {server.serverCount && server.serverCount > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Servers:</span>
            <span className="badge badge-outline badge-xs">{server.serverCount}</span>
          </div>
        )}
        
        {/* Show map name with proper display name */}
        {server.map && server.map !== 'Unknown' && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Map:</span>
            <span className="text-base-content/70 truncate max-w-[60%] text-right">{getMapDisplayName(server.map)}</span>
          </div>
        )}
        
        {server.clusterName && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-base-content/70">Cluster:</span>
            <span className="text-base-content/70 truncate max-w-[60%] text-right">{server.clusterName}</span>
          </div>
        )}

        {server.autoUpdateStatus?.lastCheck && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Last Check:</span>
            <span className="text-base-content/70 text-xs">
              {new Date(server.autoUpdateStatus.lastCheck).toLocaleString()}
            </span>
          </div>
        )}
        
        {server.gamePort && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Port:</span>
            <span className="text-base-content/70">{server.gamePort}</span>
          </div>
        )}
        
        {server.queryPort && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Query Port:</span>
            <span className="text-base-content/70">{server.queryPort}</span>
          </div>
        )}
        
        {server.rconPort && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">RCON Port:</span>
            <span className="text-base-content/70">{server.rconPort}</span>
          </div>
        )}
        
        {/* Only show port mapping for Docker containers */}
        {server.ports && server.type === 'container' && (
          <div className="flex justify-between items-start">
            <span className="text-base-content/70">Ports:</span>
            <span className="text-base-content/70 truncate max-w-[60%] text-right text-xs">{server.ports}</span>
          </div>
        )}
        
        {server.created && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Created:</span>
            <span className="text-base-content/70 text-xs">{new Date(server.created).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {/* Action Buttons - This will stick to the bottom */}
      <div className="mt-auto pt-4">
        <ServerActionButtons
          server={server}
          actionLoading={actionLoading}
          onAction={onAction}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.server.name === nextProps.server.name &&
    prevProps.server.status === nextProps.server.status &&
    prevProps.actionLoading === nextProps.actionLoading &&
    JSON.stringify(prevProps.actionStatus) === JSON.stringify(nextProps.actionStatus) &&
    prevProps.server.players === nextProps.server.players &&
    JSON.stringify(prevProps.server.autoUpdateStatus) === JSON.stringify(nextProps.server.autoUpdateStatus)
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard; 