import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ServerCard from '../components/ServerCard';
import ServerList from '../components/ServerList';
import ServerUpdateManager from '../components/ServerUpdateManager';
import type { Server } from '../utils/serverUtils';
import { useDeveloper } from '../contexts/DeveloperContext';

const Servers: React.FC = () => {
  const navigate = useNavigate();
  const { isDeveloperMode } = useDeveloper();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'cards' | 'list'>('cards');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  
  // Use ref to track running servers for status checking
  const runningServersRef = useRef<Server[]>([]);

  // Add to component state
  const [pendingStop, setPendingStop] = useState<Record<string, boolean>>({});
  const [pendingStart, setPendingStart] = useState<Record<string, boolean>>({});
  const [pendingRestart, setPendingRestart] = useState<Record<string, boolean>>({});
  const [showUpdateManager, setShowUpdateManager] = useState(false);

  const loadAllServers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Load both containers and native servers
      const [containersResponse, nativeServersResponse] = await Promise.all([
        api.get('/api/containers').catch(() => ({ data: { containers: [] } })),
        api.get('/api/native-servers').catch(() => ({ data: { servers: [] } }))
      ]);

      const containers = containersResponse.data?.containers || [];
      const nativeServers = nativeServersResponse.data?.servers || [];

      // Combine and prioritize native servers (they're more important for this use case)
      const allServers = [...nativeServers];
      
      // Only add containers that don't have a matching native server
      for (const container of containers) {
        const existingNative = nativeServers.find((ns: Server) => ns.name === container.name);
        if (!existingNative) {
          allServers.push(container);
        } else {
          console.log(`Skipping container ${container.name} because native server exists`);
        }
      }

      setServers(allServers);
      
      // Update the ref with current running servers
      runningServersRef.current = allServers.filter(s => s.status === 'running');
    } catch (err) {
      console.error('Failed to load servers:', err);
      setError('Failed to load servers. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllServers();
    
    // Set up periodic status checking for crash detection
    const statusCheckInterval = setInterval(async () => {
      try {
        // Use the ref to get current running servers
        const runningServers = runningServersRef.current;
        
        for (const server of runningServers) {
          try {
            let statusResponse;
            const encodedName = encodeURIComponent(server.name);
            
            if (server.type === 'container') {
              statusResponse = await api.get(`/api/containers/${encodedName}/status`);
            } else {
              statusResponse = await api.get(`/api/native-servers/${encodedName}/status`);
            }
            
            if (statusResponse.data.success) {
              const status = statusResponse.data.status;
              
              // If server crashed (native servers only)
              if (server.type !== 'container' && status.crashInfo && server.status === 'running') {
                console.error(`Server ${server.name} crashed:`, status.crashInfo);
                setError(`Server ${server.name} crashed with exit code ${status.crashInfo.exitCode}. ${status.crashInfo.error || ''}`);
                
                // Reload servers to update the UI
                loadAllServers(false);
              }
            }
          } catch (error) {
            console.error(`Error checking status for ${server.name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in periodic status check:', error);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(statusCheckInterval);
    };
  }, []); // Remove servers dependency to prevent infinite loop

  // Add a more frequent refresh for better UI updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Always refresh, even during actions, to get real-time updates
      loadAllServers(false);
    }, 10000); // Refresh every 10 seconds (reduced from 15)
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []); // Remove dependencies to prevent infinite loop

  const handleAction = async (action: 'start' | 'stop' | 'restart', server: Server) => {
    try {
      setActionLoading(server.name);
      
      // Set pending states for sticky UI behavior
      if (action === 'stop') {
        setPendingStop(prev => ({ ...prev, [server.name]: true }));
      } else if (action === 'start') {
        setPendingStart(prev => ({ ...prev, [server.name]: true }));
      } else if (action === 'restart') {
        setPendingRestart(prev => ({ ...prev, [server.name]: true }));
      }
      
      // Use correct English spelling for action status
      const actionStatusText =
        action === 'stop' ? 'Stopping...'
        : action === 'start' ? 'Starting...'
        : action === 'restart' ? 'Restarting...'
        : `${(action as string).charAt(0).toUpperCase() + (action as string).slice(1)}ing...`;
      setActionStatus(prev => ({ ...prev, [server.name]: actionStatusText }));

      let endpoint = '';
      const encodedName = encodeURIComponent(server.name);
      if (server.type === 'container') {
        endpoint = `/api/containers/${encodedName}/${action}`;
      } else {
        // For native servers, use the native-servers endpoint
        endpoint = `/api/native-servers/${encodedName}/${action}`;
      }

      const response = await api.post(endpoint);
      
      if (response.data.success) {
        // For start actions on native servers, the server starts in background
        // Use the existing status polling to monitor progress
        if (action === 'start' && server.type !== 'container') {
          console.log('Server start initiated in background:', response.data.message);
          // The existing status polling will detect when the server is running
        }
        
        // Start polling for status updates using existing mechanism
        startStatusPolling(server.name, action, server.type);
        
        // Also do an immediate status check to update the UI right away
        setTimeout(async () => {
          try {
            // Use simple status check for faster response
            const simpleStatus = await checkSimpleStatus(server.name, server.type);
            console.log(`Simple status for ${server.name}: ${simpleStatus}`);
            
            // If the action completed, clear the action status immediately
            if ((action === 'start' && simpleStatus === 'running') ||
                (action === 'stop' && simpleStatus === 'stopped') ||
                (action === 'restart' && simpleStatus === 'running')) {
              setActionStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[server.name];
                return newStatus;
              });
              
              // Clear pending states when action completes
              if (action === 'stop') {
                setPendingStop(prev => {
                  const newPending = { ...prev };
                  delete newPending[server.name];
                  return newPending;
                });
              } else if (action === 'start') {
                setPendingStart(prev => {
                  const newPending = { ...prev };
                  delete newPending[server.name];
                  return newPending;
                });
              } else if (action === 'restart') {
                setPendingRestart(prev => {
                  const newPending = { ...prev };
                  delete newPending[server.name];
                  return newPending;
                });
              }
            }
            
            loadAllServers(false);
          } catch (error) {
            console.error('Immediate status check failed:', error);
          }
        }, 1000);
      } else {
        setError(`Failed to ${action} server: ${response.data.message || 'Unknown error'}`);
        setActionStatus(prev => ({ ...prev, [server.name]: 'Failed' }));
      }
    } catch (err: unknown) {
      console.error(`Failed to ${action} server:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to ${action} server: ${errorMessage}`);
      setActionStatus(prev => ({ ...prev, [server.name]: 'Failed' }));
    } finally {
      setActionLoading(null);
    }
  };

  const startStatusPolling = (serverName: string, action: string, serverType: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Use simple status check for faster response
        const simpleStatus = await checkSimpleStatus(serverName, serverType);
        console.log(`Polling status for ${serverName}: ${simpleStatus} (action: ${action})`);
        
        // Check if action completed
        let isCompleted = false;
        if (action === 'start' && simpleStatus === 'running') {
          isCompleted = true;
        } else if (action === 'stop' && simpleStatus === 'stopped') {
          isCompleted = true;
        } else if (action === 'restart' && simpleStatus === 'running') {
          isCompleted = true;
        }
        
        if (isCompleted) {
          clearInterval(pollInterval);
          setActionStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[serverName];
            return newStatus;
          });
          
          // Clear pending states when action completes
          if (action === 'stop') {
            setPendingStop(prev => {
              const newPending = { ...prev };
              delete newPending[serverName];
              return newPending;
            });
          } else if (action === 'start') {
            setPendingStart(prev => {
              const newPending = { ...prev };
              delete newPending[serverName];
              return newPending;
            });
          } else if (action === 'restart') {
            setPendingRestart(prev => {
              const newPending = { ...prev };
              delete newPending[serverName];
              return newPending;
            });
          }
          
          // Reload servers to get updated status immediately
          loadAllServers(false);
        } else {
          // Update status message to show progress
          if (action === 'start' && serverType !== 'container') {
            setActionStatus(prev => ({ 
              ...prev, 
              [serverName]: `Starting... (checking in ${Math.floor((Date.now() - Date.now()) / 1000)}s)` 
            }));
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
        setActionStatus(prev => ({ ...prev, [serverName]: 'Error' }));
      }
    }, 2000); // Poll every 2 seconds for faster response

    // Stop polling after 60 seconds to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      setActionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[serverName];
        return newStatus;
      });
      
      // For start actions, show a message that the server may still be starting
      if (action === 'start') {
        console.log(`Server ${serverName} may still be starting up. Check server status manually.`);
      }
    }, 60000); // Increased timeout to 60 seconds for server startup
  };

  // Simple status check for faster updates
  const checkSimpleStatus = async (serverName: string, serverType: string): Promise<string> => {
    try {
      const encodedName = encodeURIComponent(serverName);
      let response;
      
      if (serverType === 'container') {
        response = await api.get(`/api/containers/${encodedName}/running`);
      } else {
        // Use the new running endpoint for native servers
        response = await api.get(`/api/native-servers/${encodedName}/running`);
      }
      
      if (response.data.success) {
        return response.data.running ? 'running' : 'stopped';
      }
      
      return 'unknown';
    } catch (error) {
      console.error(`Error checking simple status for ${serverName}:`, error);
      return 'unknown';
    }
  };

  // When rendering ServerCard, pass a computed status:
  const getEffectiveStatus = (server: Server) => {
    if (pendingStop[server.name] && server.status === 'running') {
      return 'stopping';
    }
    if (pendingStart[server.name] && server.status === 'stopped') {
      return 'starting';
    }
    if (pendingRestart[server.name] && server.status === 'stopped') {
      return 'restarting';
    }
    return server.status;
  };

  const handleViewDetails = (server: Server) => {
    navigate(`/servers/${encodeURIComponent(server.name)}`);
  };

  const handleConfigClick = (server: Server) => {
    navigate(`/servers/${encodeURIComponent(server.name)}?tab=config`);
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
              <button
                onClick={() => setShowUpdateManager(true)}
                className="btn btn-primary btn-sm"
              >
                🔄 Update Manager
              </button>
              <button
                onClick={() => navigate('/provisioning')}
                className="btn btn-secondary btn-sm"
              >
                ➕ Create Server
              </button>
              {isDeveloperMode && (
                <button
                  onClick={async () => {
                    try {
                      // Find servers with RCON issues (you can customize this logic)
                      const serversWithRcon = servers.filter(s => s.type !== 'container' && s.rconPort);
                      if (serversWithRcon.length === 0) {
                        alert('No servers with RCON found to fix.');
                        return;
                      }
                      
                      const serverName = serversWithRcon[0].name;
                      const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/fix-rcon`);
                      if (response.data.success) {
                        alert(`✅ ${response.data.message}\n\nPlease restart the server to apply the changes.`);
                      } else {
                        alert(`❌ Failed to fix RCON: ${response.data.message}`);
                      }
                    } catch (error) {
                      alert(`❌ Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="btn btn-warning btn-sm"
                  title="Fix RCON authentication issues for servers"
                >
                  🔧 Fix RCON
                </button>
              )}
              {isDeveloperMode && (
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/api/native-servers/debug-clusters');
                      if (response.data.success) {
                        const debug = response.data.debug;
                        let message = `🔍 Cluster Debug:\n\n`;
                        message += `Path: ${debug.clustersPath}\n`;
                        message += `Exists: ${debug.clustersPathExists ? '✅' : '❌'}\n\n`;
                        if (debug.clustersPathExists) {
                          message += `Clusters: ${debug.clusterDirs.join(', ')}\n\n`;
                          message += `Raw config data:\n${JSON.stringify(debug.clusterConfigs, null, 2)}`;
                        } else {
                          message += `Error: ${String(debug.error || 'Path does not exist')}`;
                        }
                        alert(message);
                      } else {
                        alert(`❌ Debug failed: ${response.data.message}`);
                      }
                    } catch (error) {
                      alert(`❌ Debug error: ${(error as any).response?.data?.message || (error as Error).message}`);
                    }
                  }}
                  className="btn btn-info btn-sm"
                  title="Debug cluster configuration"
                >
                  🔍 Debug Clusters
                </button>
              )}
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
            // Card Layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server, index) => (
                <ServerCard
                  key={server.name || `server-${index}`}
                  server={{ ...server, status: getEffectiveStatus(server) }}
                  actionLoading={actionLoading}
                  actionStatus={actionStatus}
                  onAction={handleAction}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            // List Layout
            <ServerList
              servers={servers}
              actionLoading={actionLoading}
              onAction={handleAction}
              onViewDetails={handleViewDetails}
              onConfigClick={handleConfigClick}
            />
          )}
        </div>
      </div>

      {/* Server Update Manager Modal */}
      {showUpdateManager && (
        <ServerUpdateManager onClose={() => setShowUpdateManager(false)} />
      )}
    </div>
  );
};

export default Servers; 