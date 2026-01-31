import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServers, useServerMutation, useRefetchServers } from '../hooks/useServerData';
import type { ServerSummary } from '../api/serverApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ServerCard from '../components/ServerCard';
import ServerList from '../components/ServerList';
import ServerUpdateManager from '../components/ServerUpdateManager';
import type { Server } from '../utils/serverUtils';
import { useDeveloper } from '../contexts/DeveloperContext';

const Servers: React.FC = () => {
  const navigate = useNavigate();
  const { isDeveloperMode } = useDeveloper();
  const [layoutMode, setLayoutMode] = useState<'cards' | 'list'>('cards');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showUpdateManager, setShowUpdateManager] = useState(false);

  // Pending states for sticky UI behavior during transitions
  const [pendingStop, setPendingStop] = useState<Record<string, boolean>>({});
  const [pendingStart, setPendingStart] = useState<Record<string, boolean>>({});
  const [pendingRestart, setPendingRestart] = useState<Record<string, boolean>>({});

  // Use the centralized server data hook with automatic polling
  const { 
    data: serversData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useServers({
    refetchInterval: 10_000, // Poll every 10 seconds for status updates
  });

  // Server mutations with automatic refetch
  const startMutation = useServerMutation('start', {
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setError(`Failed to start server: ${err.message}`);
    },
  });

  const stopMutation = useServerMutation('safeStop', {
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setError(`Failed to stop server: ${err.message}`);
    },
  });

  const restartMutation = useServerMutation('safeRestart', {
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setError(`Failed to restart server: ${err.message}`);
    },
  });

  const { refetchList } = useRefetchServers();

  // Convert ServerSummary[] to Server[] for compatibility with existing components
  const servers = useMemo(() => {
    return (serversData || []).map((s: ServerSummary) => ({
      ...s,
      status: s.status as Server['status'],
      type: s.type as Server['type'],
    }));
  }, [serversData]);

  // Set error from query error
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Failed to load servers');
    }
  }, [queryError]);

  // Effective status calculation for pending transitions
  const getEffectiveStatus = useCallback((server: Server) => {
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
  }, [pendingStop, pendingStart, pendingRestart]);

  // Memoize servers with effective status
  const memoizedServers = useMemo(() => {
    return servers.map(s => ({ ...s, status: getEffectiveStatus(s) }));
  }, [servers, getEffectiveStatus]);

  const handleViewDetails = useCallback((server: Server) => {
    navigate(`/servers/${encodeURIComponent(server.name)}`);
  }, [navigate]);

  const handleConfigClick = useCallback((server: Server) => {
    navigate(`/servers/${encodeURIComponent(server.name)}?tab=config`);
  }, [navigate]);

  // Handle server actions using mutations
  const handleAction = useCallback(async (action: 'start' | 'stop' | 'restart', server: Server) => {
    setActionLoading(server.name);
    setError(null);

    // Set pending states for sticky UI behavior
    if (action === 'stop') {
      setPendingStop(prev => ({ ...prev, [server.name]: true }));
    } else if (action === 'start') {
      setPendingStart(prev => ({ ...prev, [server.name]: true }));
    } else if (action === 'restart') {
      setPendingRestart(prev => ({ ...prev, [server.name]: true }));
    }

    // Update action status
    const actionStatusText =
      action === 'stop' ? 'Stopping...'
      : action === 'start' ? 'Starting...'
      : 'Restarting...';
    setActionStatus(prev => ({ ...prev, [server.name]: actionStatusText }));

    const serverType = server.type === 'container' ? 'container' : 'native';

    try {
      // Use the appropriate mutation
      if (action === 'start') {
        await startMutation.mutateAsync({ serverId: server.name, serverType });
      } else if (action === 'stop') {
        await stopMutation.mutateAsync({ serverId: server.name, serverType });
      } else if (action === 'restart') {
        await restartMutation.mutateAsync({ serverId: server.name, serverType });
      }

      // Clear action status and pending states on success after a delay
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[server.name];
          return newStatus;
        });
        
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
        
        // Refetch to get updated status
        refetchList();
      }, 2000);
    } catch (err) {
      // Error is handled by mutation onError
      setActionStatus(prev => ({ ...prev, [server.name]: 'Failed' }));
    } finally {
      setActionLoading(null);
    }
  }, [startMutation, stopMutation, restartMutation, refetchList]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Server Management</h1>
              <p className="text-sm md:text-base text-base-content/70">Manage your ARK: Survival Ascended servers (containers & native)</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="btn-group">
                <button
                  onClick={() => setLayoutMode('cards')}
                  className={`btn btn-sm ${layoutMode === 'cards' ? 'btn-active' : 'btn-outline'}`}
                >
                  <svg className="w-4 h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`btn btn-sm ${layoutMode === 'list' ? 'btn-active' : 'btn-outline'}`}
                >
                  <svg className="w-4 h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                {isDeveloperMode && (
                  <>
                    <button
                      onClick={() => navigate('/provisioning?action=fix-rcon')}
                      className="btn btn-warning btn-sm"
                      title="Fix RCON authentication for all servers"
                    >
                      <span className="hidden md:inline">🔧 Fix RCON</span>
                      <span className="md:hidden">🔧</span>
                    </button>
                    <button
                      onClick={() => navigate('/provisioning?action=debug-clusters')}
                      className="btn btn-info btn-sm"
                      title="Debug cluster configuration"
                    >
                      <span className="hidden md:inline">🐛 Debug Clusters</span>
                      <span className="md:hidden">🐛</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowUpdateManager(true)}
                  className="btn btn-secondary btn-sm"
                  title="Update all servers"
                >
                  <span className="hidden md:inline">🔄 Update All</span>
                  <span className="md:hidden">🔄</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-3 md:p-4 text-center">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">{servers.length}</div>
            <div className="text-xs md:text-sm text-base-content/70">Total Servers</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-3 md:p-4 text-center">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-success">
              {servers.filter(s => s.status === 'running').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Running</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-3 md:p-4 text-center">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-error">
              {servers.filter(s => s.status === 'stopped').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Stopped</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-3 md:p-4 text-center">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-warning">
              {servers.filter(s => s.status === 'restarting' || s.status === 'starting').length}
            </div>
            <div className="text-xs md:text-sm text-base-content/70">Starting</div>
          </div>
        </div>

        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Server Status</h2>
          
          {servers.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No servers found</p>
              <p className="text-sm text-base-content/50">Start by creating your first ARK server</p>
            </div>
          ) : layoutMode === 'cards' ? (
            // Card Layout
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {memoizedServers.map((server, index) => (
                <ServerCard
                  key={server.name || `server-${index}`}
                  server={server}
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
              servers={memoizedServers}
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