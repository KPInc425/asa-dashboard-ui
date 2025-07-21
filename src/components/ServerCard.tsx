import React, { useState, useEffect } from 'react';
import { containerApi, api } from '../services/api';
import RconDebugModal from './RconDebugModal';
import { useDeveloper } from '../contexts/DeveloperContext';

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
}

interface LiveServerStats {
  players: number;
  currentDay: number;
  currentTime: string;
  serverUptime: string;
}

const ServerCard: React.FC<ServerCardProps> = ({
  server,
  actionLoading,
  actionStatus,
  onAction,
  onViewDetails
}) => {
  const { isDeveloperMode } = useDeveloper();
  const [liveStats, setLiveStats] = useState<LiveServerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch live server stats when server is running
  useEffect(() => {
    if (server.status === 'running' && !statsLoading) {
      fetchLiveStats();
    }
  }, [server.status, server.name]);

  const fetchLiveStats = async () => {
    if (server.status !== 'running') return;
    
    setStatsLoading(true);
    try {
      // Try to use the live-details endpoint first (if available)
      if (server.type === 'native' || server.type === 'cluster-server') {
        try {
          const response = await api.get(`/api/native-servers/${encodeURIComponent(server.name)}/live-details`);
          if (response.data.success && response.data.details) {
            const details = response.data.details;
            setLiveStats({
              players: details.players || 0,
              currentDay: details.day || 1,
              currentTime: details.gameTime || 'Unknown',
              serverUptime: 'Active'
            });
            return;
          }
        } catch (err) {
          console.warn(`Live details API failed for ${server.name}, falling back to RCON:`, err);
        }
      }

      // Fallback to individual RCON commands
      const commands = ['listplayers', 'getday', 'gettime'];
      const responses = [];
      
      for (const command of commands) {
        try {
          let response;
          if (server.type === 'native' || server.type === 'cluster-server') {
            response = await containerApi.sendNativeRconCommand(server.name, command);
          } else {
            response = await containerApi.sendRconCommand(server.name, command);
          }
          
          if (response.success) {
            responses.push(response);
            console.log(`RCON ${command} success for ${server.name}:`, response.response);
          } else {
            console.warn(`RCON ${command} failed for ${server.name}:`, response.message || 'Unknown error');
            responses.push({ success: false, response: '' });
          }
        } catch (err) {
          console.warn(`RCON command ${command} failed for server ${server.name}:`, err);
          responses.push({ success: false, response: '' });
        }
      }

      // Parse responses
      const playersResponse = responses[0];
      const dayResponse = responses[1];
      const timeResponse = responses[2];

      let playerCount = 0;
      if (playersResponse && playersResponse.success && playersResponse.response) {
        // Improved parsing for listplayers command
        const responseText = playersResponse.response.toLowerCase();
        if (responseText.includes('no players') || responseText.trim() === '' || responseText.includes('players online: 0')) {
          playerCount = 0;
        } else {
          // Match lines like '0. Name, ...' or '1. Name (SteamID: ...)' or '1. Name, ...'
          const playerLines = playersResponse.response.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed &&
              !trimmed.toLowerCase().includes('players online') &&
              !trimmed.toLowerCase().includes('total:') &&
              /^\d+\.[\s\w]+[,\(]/i.test(trimmed);
          });
          playerCount = playerLines.length;
        }
      }

      let currentDay = 1;
      if (dayResponse && dayResponse.success && dayResponse.response) {
        const dayMatch = dayResponse.response.match(/day\s*:?\s*(\d+)/i) || dayResponse.response.match(/(\d+)/);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]);
        }
      }

      let currentTime = 'Unknown';
      if (timeResponse && timeResponse.success && timeResponse.response) {
        currentTime = timeResponse.response.trim();
      }

      setLiveStats({
        players: playerCount,
        currentDay,
        currentTime,
        serverUptime: 'Active'
      });
    } catch (err) {
      console.error(`Failed to fetch live stats for ${server.name}:`, err);
      // Set fallback stats to avoid empty display
      setLiveStats({
        players: server.players || 0,
        currentDay: 1,
        currentTime: 'Unknown',
        serverUptime: 'Active'
      });
    } finally {
      setStatsLoading(false);
    }
  };

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
    <div className="bg-base-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
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
      
      <div className="space-y-2 text-sm flex-grow">
        <div className="flex justify-between items-center">
          <span className="text-base-content/70">Status:</span>
          <span className={`badge ${getStatusColor(server.status, actionStatus[server.name])} badge-xs`}>
            {actionStatus[server.name] || (server.status ? server.status.charAt(0).toUpperCase() + server.status.slice(1) : 'Unknown')}
          </span>
        </div>
        
        {/* Live Player Count - Show when server is running */}
        {server.status === 'running' && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Players:</span>
            <span className="font-semibold text-success">
              {statsLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : liveStats ? (
                `${liveStats.players}/${server.maxPlayers || 70}`
              ) : (
                `${server.players || 0}/${server.maxPlayers || 70}`
              )}
            </span>
          </div>
        )}
        
        {/* Game Day - Show when server is running */}
        {server.status === 'running' && liveStats && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Day:</span>
            <span className="font-semibold text-primary">
              {liveStats.currentDay}
            </span>
          </div>
        )}
        
        {/* Game Time - Show when server is running */}
        {server.status === 'running' && liveStats && (
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Time:</span>
            <span className="text-xs text-base-content/70">{liveStats.currentTime}</span>
          </div>
        )}
        
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
      
      {/* Action Buttons - Stick to bottom */}
      <div className="mt-auto pt-4 space-y-2">
        {/* Control buttons in a row */}
        <div className="flex gap-2 flex-wrap">
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
        </div>
        
        {/* Full-width View Details button */}
        <button
          title="View Details"
          onClick={() => onViewDetails(server)}
          className="btn btn-primary btn-sm w-full"
        >
          🔍 View Details
        </button>
        
        {/* Fix RCON button for native servers - Only show in developer mode */}
        {isDeveloperMode && (server.type === 'native' || server.type === 'cluster-server' || server.type === 'individual') && server.rconPort && (
          <div className="flex gap-1">
            <button
              title="Fix RCON authentication issues"
              onClick={async () => {
                try {
                  const response = await api.post(`/api/native-servers/${encodeURIComponent(server.name)}/fix-rcon`);
                  if (response.data.success) {
                    alert(`✅ ${response.data.message}\n\nPlease restart the server to apply the changes.`);
                  } else {
                    alert(`❌ Failed to fix RCON: ${response.data.message}`);
                  }
                } catch (error) {
                  alert(`❌ Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
              className="btn btn-warning btn-sm flex-1"
            >
              🔧 Fix RCON
            </button>
            <button
              title="Debug RCON configuration"
              onClick={async () => {
                try {
                  const response = await api.get(`/api/native-servers/${encodeURIComponent(server.name)}/debug-rcon`);
                  if (response.data.success && response.data.debug) {
                    setDebugInfo(response.data.debug);
                    setDebugModalOpen(true);
                  } else {
                    alert(`❌ Debug failed: ${response.data.message || 'Unknown error'}`);
                  }
                } catch (error) {
                  const errorMessage = (error as any).response?.data?.message || (error as Error).message || 'Unknown error';
                  alert(`❌ Debug error: ${errorMessage}`);
                }
              }}
              className="btn btn-info btn-sm"
            >
              🔍
            </button>
          </div>
        )}
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
        
        {/* RCON Debug Modal */}
        <RconDebugModal
          isOpen={debugModalOpen}
          onClose={() => setDebugModalOpen(false)}
          debugInfo={debugInfo}
          serverName={server.name}
        />
    </div>
  );
};

export default ServerCard; 