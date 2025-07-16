import React, { useState, useEffect } from 'react';
import { containerApi, type RconResponse } from '../services';

interface ServerLiveDetailsProps {
  serverName: string;
  serverType: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
}

interface ServerInfo {
  players: Array<{
    name: string;
    level: number;
    tribe?: string;
    steamId?: string;
  }>;
  maxPlayers: number;
  currentDay: number;
  currentTime: string;
  mods: Array<{
    id: string;
    name: string;
    version: string;
  }>;
  serverUptime: string;
  memoryUsage: string;
  cpuUsage: string;
  fps: number;
  tps: number;
}

const ServerLiveDetails: React.FC<ServerLiveDetailsProps> = ({ serverName, serverType }) => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchServerInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch server information using RCON commands
      const commands = [
        'listplayers',
        'gettime',
        'getday',
        'getmods',
        'getserverinfo'
      ];

      const responses: RconResponse[] = [];
      
      for (const command of commands) {
        try {
          let response: RconResponse;
          if (serverType === 'native' || serverType === 'cluster-server') {
            response = await containerApi.sendNativeRconCommand(serverName, command);
          } else {
            response = await containerApi.sendRconCommand(serverName, command);
          }
          responses.push(response);
        } catch (err) {
          console.warn(`RCON command ${command} failed for server ${serverName}:`, err);
          responses.push({ success: false, response: '', message: 'Command failed' });
        }
      }

      // Parse responses and build server info
      const info: Partial<ServerInfo> = {
        players: [],
        maxPlayers: 70,
        currentDay: 1,
        currentTime: 'Unknown',
        mods: [],
        serverUptime: 'Unknown',
        memoryUsage: 'Unknown',
        cpuUsage: 'Unknown',
        fps: 0,
        tps: 0
      };

      // Parse listplayers response
      const playersResponse = responses[0];
      if (playersResponse.success && playersResponse.response) {
        const playerLines = playersResponse.response.split('\n').filter(line => line.trim());
        info.players = playerLines.map(line => {
          const match = line.match(/(\d+)\. (.+?) \(Level (\d+)\)/);
          if (match) {
            return {
              name: match[2],
              level: parseInt(match[3]),
              steamId: match[1]
            };
          }
          return { name: line.trim(), level: 0 };
        });
      }

      // Parse time and day
      const timeResponse = responses[1];
      const dayResponse = responses[2];
      
      if (timeResponse.success && timeResponse.response) {
        info.currentTime = timeResponse.response.trim();
      }
      
      if (dayResponse.success && dayResponse.response) {
        const dayMatch = dayResponse.response.match(/(\d+)/);
        if (dayMatch) {
          info.currentDay = parseInt(dayMatch[1]);
        }
      }

      // Parse mods
      const modsResponse = responses[3];
      if (modsResponse.success && modsResponse.response) {
        const modLines = modsResponse.response.split('\n').filter(line => line.trim());
        info.mods = modLines.map(line => {
          const match = line.match(/(\d+): (.+?) v(.+)/);
          if (match) {
            return {
              id: match[1],
              name: match[2],
              version: match[3]
            };
          }
          return { id: '0', name: line.trim(), version: 'Unknown' };
        });
      }

      setServerInfo(info as ServerInfo);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch server information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchServerInfo, 30000);
    
    return () => clearInterval(interval);
  }, [serverName, serverType]);

  if (loading && !serverInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading server information...</p>
        </div>
      </div>
    );
  }

  if (error && !serverInfo) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Failed to load server information: {error}</span>
        <button onClick={fetchServerInfo} className="btn btn-sm btn-outline">Retry</button>
      </div>
    );
  }

  if (!serverInfo) {
    return (
      <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Server information not available</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Server Information</h3>
        <div className="flex items-center space-x-2">
          {lastUpdate && (
            <span className="text-sm text-base-content/50">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchServerInfo}
            disabled={loading}
            className="btn btn-sm btn-outline btn-primary"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Players Information */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title text-sm">👥 Players</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Online:</span>
                <span className="font-semibold">
                  {serverInfo.players.length} / {serverInfo.maxPlayers}
                </span>
              </div>
              {serverInfo.players.length > 0 ? (
                <div className="space-y-1">
                  {serverInfo.players.slice(0, 5).map((player, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="truncate">{player.name}</span>
                      <span className="text-base-content/70">Lv.{player.level}</span>
                    </div>
                  ))}
                  {serverInfo.players.length > 5 && (
                    <div className="text-xs text-base-content/50">
                      +{serverInfo.players.length - 5} more players
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-base-content/50">No players online</div>
              )}
            </div>
          </div>
        </div>

        {/* Game Time Information */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title text-sm">⏰ Game Time</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Day:</span>
                <span className="font-semibold">{serverInfo.currentDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Time:</span>
                <span className="font-semibold">{serverInfo.currentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Uptime:</span>
                <span className="font-semibold">{serverInfo.serverUptime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Information */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title text-sm">📊 Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">FPS:</span>
                <span className="font-semibold">{serverInfo.fps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">TPS:</span>
                <span className="font-semibold">{serverInfo.tps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Memory:</span>
                <span className="font-semibold">{serverInfo.memoryUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">CPU:</span>
                <span className="font-semibold">{serverInfo.cpuUsage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mods Information */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title text-sm">🎮 Mods</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Active:</span>
                <span className="font-semibold">{serverInfo.mods.length}</span>
              </div>
              {serverInfo.mods.length > 0 ? (
                <div className="space-y-1">
                  {serverInfo.mods.slice(0, 3).map((mod, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium truncate">{mod.name}</div>
                      <div className="text-base-content/50">v{mod.version}</div>
                    </div>
                  ))}
                  {serverInfo.mods.length > 3 && (
                    <div className="text-xs text-base-content/50">
                      +{serverInfo.mods.length - 3} more mods
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-base-content/50">No mods active</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error display for partial failures */}
      {error && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Some information may be incomplete: {error}</span>
        </div>
      )}
    </div>
  );
};

export default ServerLiveDetails; 