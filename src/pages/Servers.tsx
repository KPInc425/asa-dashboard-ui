import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ServerDetailsModal from '../components/ServerDetailsModal';
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
}

const Servers: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'cards' | 'list'>('cards'); // Default to cards (native style)
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({}); // Track action status per server
  const [statusPolling, setStatusPolling] = useState<Record<string, NodeJS.Timeout>>({}); // Track polling intervals
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
    loadAllServers(true); // Show loading on initial load
    
    // Set up periodic status refresh - reduced frequency to prevent rate limiting
    const interval = setInterval(() => {
      loadAllServers(false); // Don't show loading on background refresh
    }, 15000); // Refresh every 15 seconds instead of 5
    
    return () => {
      clearInterval(interval);
      // Clear any active polling
      Object.values(statusPolling).forEach(clearInterval);
    };
  }, []);

  const loadAllServers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Load both container and native servers
      const [containersResponse, nativeResponse] = await Promise.all([
        api.get('/api/containers').catch(() => ({ data: { success: false, containers: [] } })),
        api.get('/api/native-servers').catch(() => ({ data: { success: false, servers: [] } }))
      ]);

      const allServers: Server[] = [];
      const seenServerNames = new Set<string>();

      // Add native servers FIRST (prioritize native server data)
      if (nativeResponse.data.success && nativeResponse.data.servers) {
        const nativeServers = nativeResponse.data.servers.map((s: any) => {
          console.log('Processing native server:', s.name, 'Type:', s.type, 'Map:', s.map);
          return {
            ...s,
            type: s.type || 'native' as const,
            name: s.name,
            status: s.status,
            image: s.image || 'ASA Server',
            ports: s.ports,
            created: s.created,
            map: s.map || 'Unknown',
            gamePort: s.gamePort,
            queryPort: s.queryPort,
            rconPort: s.rconPort,
            maxPlayers: s.maxPlayers,
            clusterName: s.clusterName,
            // Only show serverCount for actual clusters, not individual servers
            serverCount: s.type === 'cluster' ? s.serverCount : undefined
          };
        });
        
        nativeServers.forEach(server => {
          seenServerNames.add(server.name);
          allServers.push(server);
        });
      }

      // Add container servers SECOND (only if not already added as native server)
      if (containersResponse.data.success && containersResponse.data.containers) {
        const containerServers = containersResponse.data.containers
          .filter((c: any) => !c.name.startsWith('asa-control-')) // Filter out system containers
          .filter((c: any) => !seenServerNames.has(c.name)) // Don't override native servers
          .map((c: any) => ({
            ...c,
            type: 'container' as const,
            name: c.name,
            status: c.status,
            image: c.image,
            ports: c.ports,
            created: c.created,
            // Remove serverCount for individual servers
            serverCount: undefined
          }));
        
        containerServers.forEach(server => {
          if (!seenServerNames.has(server.name)) {
            seenServerNames.add(server.name);
            allServers.push(server);
          }
        });
      }

      setServers(allServers);
    } catch (err) {
      console.error('Error loading servers:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart', server: Server) => {
    setActionLoading(server.name);
    setActionStatus(prev => ({ ...prev, [server.name]: `${action}ing...` }));
    
    try {
      if (server.type === 'container') {
        // Handle container actions
        switch (action) {
          case 'start':
            await api.post(`/api/containers/${server.name}/start`);
            break;
          case 'stop':
            await api.post(`/api/containers/${server.name}/stop`);
            break;
          case 'restart':
            await api.post(`/api/containers/${server.name}/restart`);
            break;
        }
      } else {
        // Handle native server actions
        switch (action) {
          case 'start':
            await api.post(`/api/native-servers/${server.name}/start`);
            break;
          case 'stop':
            await api.post(`/api/native-servers/${server.name}/stop`);
            break;
          case 'restart':
            await api.post(`/api/native-servers/${server.name}/restart`);
            break;
        }
      }
      
      // Set up status polling for this server
      startStatusPolling(server.name, action);
      
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
      setActionStatus(prev => ({ ...prev, [server.name]: `Failed to ${action}` }));
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[server.name];
          return newStatus;
        });
      }, 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const startStatusPolling = (serverName: string, action: string) => {
    // Clear any existing polling for this server
    if (statusPolling[serverName]) {
      clearInterval(statusPolling[serverName]);
    }

    let pollCount = 0;
    const maxPolls = 30; // Maximum 30 polls (60 seconds for start, 30 seconds for stop)

    // Start polling for status updates
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        const server = servers.find(s => s.name === serverName);
        if (!server) return;

        // Check server status
        const isRunning = await checkServerStatus(serverName, server.type);
        
        if (action === 'start' && isRunning) {
          setActionStatus(prev => ({ ...prev, [serverName]: 'Running' }));
          clearInterval(pollInterval);
          setStatusPolling(prev => {
            const newPolling = { ...prev };
            delete newPolling[serverName];
            return newPolling;
          });
          
          // Clear status after 3 seconds
          setTimeout(() => {
            setActionStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[serverName];
              return newStatus;
            });
          }, 3000);
          
          // Refresh server list without showing loading
          loadAllServers(false);
        } else if (action === 'stop' && !isRunning) {
          setActionStatus(prev => ({ ...prev, [serverName]: 'Stopped' }));
          clearInterval(pollInterval);
          setStatusPolling(prev => {
            const newPolling = { ...prev };
            delete newPolling[serverName];
            return newPolling;
          });
          
          // Clear status after 3 seconds
          setTimeout(() => {
            setActionStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[serverName];
              return newStatus;
            });
          }, 3000);
          
          // Refresh server list without showing loading
          loadAllServers(false);
        } else if (action === 'restart') {
          // For restart, show progress and stop after a reasonable time
          if (pollCount >= 15) { // 30 seconds
            setActionStatus(prev => ({ ...prev, [serverName]: 'Restarted' }));
            clearInterval(pollInterval);
            setStatusPolling(prev => {
              const newPolling = { ...prev };
              delete newPolling[serverName];
              return newPolling;
            });
            
            // Clear status after 3 seconds
            setTimeout(() => {
              setActionStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[serverName];
                return newStatus;
              });
            }, 3000);
            
            // Refresh server list without showing loading
            loadAllServers(false);
          }
        }
        
        // Stop polling if we've reached the maximum
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setStatusPolling(prev => {
            const newPolling = { ...prev };
            delete newPolling[serverName];
            return newPolling;
          });
          
          // Show timeout message
          setActionStatus(prev => ({ ...prev, [serverName]: 'Timeout' }));
          setTimeout(() => {
            setActionStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[serverName];
              return newStatus;
            });
          }, 5000);
        }
      } catch (error) {
        console.error(`Error polling status for ${serverName}:`, error);
        // Don't stop polling on error, just log it
      }
    }, 4000); // Poll every 4 seconds instead of 2 to reduce rate limiting

    setStatusPolling(prev => ({ ...prev, [serverName]: pollInterval }));
  };

  const checkServerStatus = async (serverName: string, serverType: string): Promise<boolean> => {
    try {
      if (serverType === 'container') {
        const response = await api.get(`/api/containers/${serverName}/running`);
        return response.data.success && response.data.running;
      } else {
        const response = await api.get(`/api/native-servers/${serverName}/running`);
        return response.data.success && response.data.running;
      }
    } catch (error) {
      console.error(`Error checking status for ${serverName}:`, error);
      return false;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'restarting': return '🟡';
      case 'starting': return '🟡';
      case 'stopping': return '🔵';
      default: return '⚪';
    }
  };

  const getTypeLabel = (type: string) => {
    console.log(`getTypeLabel called with type: "${type}"`);
    switch (type) {
      case 'container': 
        console.log('Returning "Container"');
        return 'Container';
      case 'native': 
        console.log('Returning "Native"');
        return 'Native';
      case 'cluster': 
        console.log('Returning "Cluster"');
        return 'Cluster';
      case 'cluster-server': 
        console.log('Returning "Cluster Server"');
        return 'Cluster Server';
      case 'individual': 
        console.log('Returning "Individual Server"');
        return 'Individual Server';
      default: 
        console.log(`Returning default: "${type}"`);
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'container': return 'badge-primary';
      case 'native': return 'badge-secondary';
      case 'cluster': return 'badge-accent';
      case 'cluster-server': return 'badge-info';
      case 'individual': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  const renderPort = (portObj: any) => {
    if (!portObj) return '-';
    if (typeof portObj === 'string') return portObj;
    const { IP, PrivatePort, PublicPort, Type } = portObj;
    if (PublicPort) {
      return `${IP ? IP + ':' : ''}${PublicPort} → ${PrivatePort}/${Type}`;
    }
    return `${PrivatePort}/${Type}`;
  };

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

  const getServerType = (server: Server): string => {
    // Debug logging
    console.log(`getServerType called for ${server.name}:`, {
      serverType: server.type,
      clusterName: server.clusterName,
      serverCount: server.serverCount
    });
    
    // Respect the type that's already set by the backend
    if (server.type) {
      console.log(`Returning server.type: ${server.type}`);
      return server.type;
    }
    
    // Fallback logic only if type is not set
    if (server.clusterName) {
      console.log(`Returning cluster-server based on clusterName`);
      return 'cluster-server';
    }
    if (server.serverCount && server.serverCount > 1) {
      console.log(`Returning cluster based on serverCount`);
      return 'cluster';
    }
    console.log(`Returning native as fallback`);
    return 'native';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Server Management</h1>
              <p className="text-base-content/70">Manage your ARK: Survival Ascended servers (containers & native)</p>
            </div>
            <div className="flex gap-2">
              <div className="btn-group">
                <button
                  onClick={() => setLayoutMode('cards')}
                  className={`btn btn-sm ${layoutMode === 'cards' ? 'btn-active' : 'btn-outline'}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`btn btn-sm ${layoutMode === 'list' ? 'btn-active' : 'btn-outline'}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List
                </button>
              </div>
              <button
                onClick={() => loadAllServers()}
                className="btn btn-outline btn-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-primary">{servers.length}</div>
            <div className="text-xs md:text-sm text-base-content/70">Total Servers</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-success">
              {servers.filter(s => s.status === 'running').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Running</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-error">
              {servers.filter(s => s.status === 'stopped').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Stopped</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-warning">
              {servers.filter(s => s.status === 'restarting' || s.status === 'starting').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Starting</div>
          </div>
        </div>

        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Server Status</h2>
          
          {servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No servers found</p>
              <p className="text-sm text-base-content/50">Start by creating your first ARK server</p>
            </div>
          ) : layoutMode === 'cards' ? (
            // Card Layout (Native style)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <div key={server.name} className="bg-base-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base-content">{server.name}</h3>
                      <span className={`badge ${getTypeColor(getServerType(server))} badge-xs`}>
                        {getTypeLabel(getServerType(server))}
                      </span>
                    </div>
                    <span className="text-2xl">{getStatusIcon(server.status)}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Status:</span>
                      <span className={getStatusColor(server.status)}>
                        {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Show action status if there's an ongoing action */}
                    {actionStatus[server.name] && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Action:</span>
                        <span className="badge badge-warning badge-xs animate-pulse">
                          {actionStatus[server.name]}
                        </span>
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
                    
                    {server.ports && (
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
                      onClick={() => handleAction('start', server)}
                      disabled={server.status === 'running' || actionLoading === server.name}
                      className="btn btn-success btn-xs flex-1"
                    >
                      {actionLoading === server.name ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        '▶️ Start'
                      )}
                    </button>
                    <button
                      title={`Stop ${server.type === 'cluster' ? 'cluster' : 'server'}`}
                      onClick={() => handleAction('stop', server)}
                      disabled={server.status === 'stopped' || actionLoading === server.name}
                      className="btn btn-error btn-xs flex-1"
                    >
                      {actionLoading === server.name ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        '⏹️ Stop'
                      )}
                    </button>
                    <button
                      title={`Restart ${server.type === 'cluster' ? 'cluster' : 'server'}`}
                      onClick={() => handleAction('restart', server)}
                      disabled={server.status === 'stopped' || actionLoading === server.name}
                      className="btn btn-warning btn-xs flex-1"
                    >
                      {actionLoading === server.name ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        '🔄 Restart'
                      )}
                    </button>
                    <button
                      title="View Details"
                      onClick={() => setSelectedServer(server)}
                      className="btn btn-info btn-xs flex-1"
                    >
                      🔍
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List Layout (Container style)
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
                            <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-10">
                              <span className="text-lg">🦖</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{server.name}</div>
                            {server.image && (
                              <div className="text-sm opacity-50">{server.image}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeColor(getServerType(server))}`}>
                          {getTypeLabel(getServerType(server))}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getStatusIcon(server.status)}</span>
                          <span className={`badge ${getStatusColor(server.status)}`}>
                            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {server.ports ? (
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
                        ) : server.gamePort ? (
                          <span className="badge badge-outline badge-sm">
                            {server.gamePort}
                          </span>
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
                            onClick={() => handleAction('start', server)}
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
                            onClick={() => handleAction('restart', server)}
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
                            onClick={() => handleAction('stop', server)}
                          >
                            {actionLoading === server.name ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              '⏹'
                            )}
                          </button>
                          <button
                            title="View Details"
                            onClick={() => setSelectedServer(server)}
                            className="btn btn-xs btn-info"
                          >
                            🔍
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedServer && (
        <ServerDetailsModal
          server={selectedServer}
          isOpen={!!selectedServer}
          onClose={() => setSelectedServer(null)}
        />
      )}
    </div>
  );
};

export default Servers; 