import React, { useState, useEffect } from 'react';
import { containerApi, api } from '../../services/api';

interface LiveServerStats {
  players: number;
  currentDay: number;
  currentTime: string;
  serverUptime: string;
  version?: string;
  map?: string;
  cached?: boolean;
  error?: string;
  lastUpdated?: string;
}

interface ServerLiveStatsProps {
  server: {
    name: string;
    status: string;
    type: string;
  };
}

const ServerLiveStats: React.FC<ServerLiveStatsProps> = ({ server }) => {
  const [liveStats, setLiveStats] = useState<LiveServerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Fetch live server stats when server is running
  useEffect(() => {
    if (server.status === 'running' && !statsLoading) {
      fetchLiveStats();
    }
  }, [server.status, server.name]);

  const fetchLiveStats = async () => {
    if (server.status !== 'running') return;
    
    // Prevent too frequent requests (minimum 5 seconds between requests)
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      return;
    }
    
    setStatsLoading(true);
    let usedFallback = false;
    
    try {
      // Try to use the live-details endpoint first (if available)
      if (server.type === 'native' || server.type === 'cluster-server') {
        try {
          const response = await api.get(`/api/native-servers/${encodeURIComponent(server.name)}/live-details`);
          if (response.data.success && response.data.details && Object.keys(response.data.details).length > 0) {
            const details = response.data.details;
            
            // --- Version parsing logic ---
            let version = undefined;
            if (details.version && typeof details.version === 'string') {
              version = details.version;
            } else if (details.raw && details.raw.attributes) {
              // Try to combine BUILDID and MINORBUILDID for float version
              const build = details.raw.attributes.BUILDID_s;
              const minor = details.raw.attributes.MINORBUILDID_s;
              if (build && minor) {
                version = `${build}.${minor}`;
              } else if (build) {
                version = build;
              }
            }
            
            // --- Map parsing logic ---
            let map = details.map;
            if (!map && details.raw && details.raw.attributes) {
              map = details.raw.attributes.MAPNAME_s || details.raw.attributes.FRIENDLYMAPNAME_s;
            }
            
            setLiveStats({
              players: details.players || 0,
              currentDay: details.day || 1,
              currentTime: details.gameTime || 'Unknown',
              serverUptime: 'Active',
              version,
              map,
              lastUpdated: details.lastUpdated || new Date().toISOString()
            });
            
            setErrorCount(0); // Reset error count on success
            setLastFetchTime(now);
            setStatsLoading(false);
            return;
          } else {
            // If details is empty, trigger fallback
            usedFallback = true;
            console.warn(`Live details API returned empty for ${server.name}, falling back to RCON.`);
          }
        } catch (err) {
          usedFallback = true;
          console.warn(`Live details API failed for ${server.name}, falling back to RCON:`, err);
        }
      } else {
        usedFallback = true;
      }

      // Fallback to individual RCON commands if needed
      if (usedFallback) {
        const commands = ['listplayers', 'getday', 'gettime'];
        const responses = [];
        let rconErrors: string[] = [];
        let cachedDataUsed = false;
        
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
              
              // Check if cached data was used
              if (response.cached) {
                cachedDataUsed = true;
                console.log(`RCON ${command} used cached data for ${server.name}`);
              }
            } else {
              const errorMsg = response.message || 'Unknown RCON error';
              rconErrors.push(`${command}: ${errorMsg}`);
              console.warn(`RCON ${command} failed for ${server.name}:`, errorMsg);
              responses.push({ success: false, response: '' });
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'RCON command failed';
            rconErrors.push(`${command}: ${errorMsg}`);
            console.warn(`RCON command ${command} failed for server ${server.name}:`, err);
            responses.push({ success: false, response: '' });
          }
        }
        
        // Parse responses with improved error handling
        const playersResponse = responses[0];
        const dayResponse = responses[1];
        const timeResponse = responses[2];
        let playerCount = 0;
        
        if (playersResponse && playersResponse.success && playersResponse.response) {
          try {
            // Improved regex for ARK listplayers output (matches e.g. '0. Willow, 0002214a4a6742d9a347bd449b2dc143')
            const lines = playersResponse.response.split('\n');
            const playerLines = lines.filter(line => {
              const trimmed = line.trim();
              // Multiple patterns for different ARK ASA formats
              return /^\d+\.\s+[^,]+,\s*[0-9a-fA-F]+$/.test(trimmed) || // "0. PlayerName, steamid"
                     /^Player\s+\d+:\s+.+$/.test(trimmed) || // "Player 1: PlayerName"
                     (/^[^0-9]*$/.test(trimmed) && trimmed.length > 0 && !trimmed.includes('Player')); // Just player name
            });
            playerCount = playerLines.length;
            console.log(`Parsed ${playerCount} players from ${playerLines.length} valid lines`);
          } catch (parseError) {
            console.warn('Error parsing player count:', parseError);
            playerCount = 0;
          }
        }
        
        // Parse day number with better error handling
        let dayNumber = 1;
        if (dayResponse && dayResponse.success && dayResponse.response) {
          try {
            const dayMatch = dayResponse.response.match(/\d+/);
            if (dayMatch) {
              dayNumber = parseInt(dayMatch[0], 10);
            }
          } catch (parseError) {
            console.warn('Error parsing day number:', parseError);
            dayNumber = 1;
          }
        }
        
        // Parse time with better error handling
        let gameTime = 'Unknown';
        if (timeResponse && timeResponse.success && timeResponse.response) {
          try {
            const timeStr = timeResponse.response.trim();
            if (timeStr && timeStr !== '') {
              gameTime = timeStr;
            }
          } catch (parseError) {
            console.warn('Error parsing game time:', parseError);
            gameTime = 'Unknown';
          }
        }
        
        // Set stats with enhanced information
        const uptimeStatus = rconErrors.length === 0 ? 'Active' : 
                           cachedDataUsed ? 'Active (Cached)' : 
                           `Active (${rconErrors.length} RCON errors)`;
        
        setLiveStats({
          players: playerCount,
          currentDay: dayNumber,
          currentTime: gameTime,
          serverUptime: uptimeStatus,
          cached: cachedDataUsed,
          error: rconErrors.length > 0 ? rconErrors.join('; ') : undefined,
          lastUpdated: new Date().toISOString()
        });
        
        // Update error count
        if (rconErrors.length > 0) {
          setErrorCount(prev => prev + 1);
          console.warn(`RCON errors for ${server.name}:`, rconErrors);
        } else {
          setErrorCount(0);
        }
        
        setLastFetchTime(now);
        setStatsLoading(false);
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Failed to fetch live stats for ${server.name}:`, err);
      
      // Increment error count
      setErrorCount(prev => prev + 1);
      
      // Set error state with context
      setLiveStats({
        players: 0,
        currentDay: 1,
        currentTime: 'Unknown',
        serverUptime: `Error: ${errorMessage}`,
        error: errorMessage,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setStatsLoading(false);
    }
  };

  if (server.status !== 'running') {
    return null;
  }

  return (
    <div className="space-y-1 text-sm md:text-base">
      {statsLoading ? (
        <div className="text-base-content/60">Loading live stats...</div>
      ) : liveStats ? (
        <>
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Players:</span>
            <span className="font-bold text-primary text-lg md:text-xl">{liveStats.players}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Day:</span>
            <span className="text-base-content/70 font-semibold">{liveStats.currentDay ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Time:</span>
            <span className="text-base-content/70 font-semibold">{liveStats.currentTime ?? 'N/A'}</span>
          </div>
          {liveStats.version && (
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">Version:</span>
              <span className="text-base-content/70 font-semibold text-xs md:text-sm">{liveStats.version}</span>
            </div>
          )}
          {/* Show status indicators */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-base-content/70">Status:</span>
            <span className={`font-semibold ${
              liveStats.error ? 'text-error' : 
              liveStats.cached ? 'text-warning' : 
              'text-success'
            }`}>
              {liveStats.serverUptime}
            </span>
          </div>
          {/* Show error count if there are persistent errors */}
          {errorCount > 0 && (
            <div className="text-xs text-error">
              {errorCount} error{errorCount > 1 ? 's' : ''} in recent attempts
            </div>
          )}
          {/* Show when data is cached */}
          {liveStats.cached && (
            <div className="text-xs text-warning">
              Using cached data
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-error">Live stats unavailable</div>
      )}
    </div>
  );
};

export default ServerLiveStats; 