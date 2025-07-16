import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Server } from '../utils/serverUtils';
import { containerApi, type RconResponse } from '../services';
import ServerModManager from '../components/ServerModManager';
import ServerConfigEditor from '../components/ServerConfigEditor';
import ServerLogViewer from '../components/ServerLogViewer';
import StartScriptViewer from '../components/StartScriptViewer';
import ServerUpdateManager from '../components/ServerUpdateManager';
import ServerSettingsEditor from '../components/ServerSettingsEditor';
import ServerLiveDetails from '../components/ServerLiveDetails';
import SaveFileManager from '../components/SaveFileManager';

interface CommandHistory {
  command: string;
  response: string;
  timestamp: Date;
  success: boolean;
}

const ServerDetails: React.FC = () => {
  const { serverName } = useParams<{ serverName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves'>('details');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartScript, setShowStartScript] = useState(false);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  
  // RCON state
  const [rconCommand, setRconCommand] = useState('');
  const [rconHistory, setRconHistory] = useState<CommandHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load server data
  useEffect(() => {
    const loadServer = async () => {
      if (!serverName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to get server from both containers and native servers
        let serverData: Server | null = null;
        
        try {
          const containers = await containerApi.getContainers();
          const foundContainer = containers.find(c => c.name === serverName);
          if (foundContainer) {
            serverData = foundContainer as any;
          }
        } catch (error) {
          console.log(`Error getting containers for ${serverName}:`, error);
        }
        
        if (!serverData) {
          try {
            const nativeServers = await containerApi.getNativeServers();
            const foundNativeServer = nativeServers.find(s => s.name === serverName);
            if (foundNativeServer) {
              serverData = foundNativeServer as any;
            }
          } catch (error) {
            console.log(`Error getting native servers for ${serverName}:`, error);
          }
        }
        
        if (serverData) {
          setServer(serverData);
        } else {
          setError(`Server "${serverName}" not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server data');
      } finally {
        setLoading(false);
      }
    };
    
    loadServer();
  }, [serverName]);

  // Handle tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['details', 'rcon', 'config', 'logs', 'mods', 'saves'].includes(tabParam)) {
      setActiveTab(tabParam as 'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves') => {
    setActiveTab(tab);
    setSearchParams({ tab });
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'container': return 'Container';
      case 'native': return 'Native';
      case 'cluster': return 'Cluster';
      case 'cluster-server': return 'Cluster Server';
      case 'individual': return 'Individual Server';
      default: return type;
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

  const executeRconCommand = async () => {
    if (!server || !rconCommand.trim()) return;
    
    setIsExecuting(true);
    
    try {
      // Check if server is running before attempting RCON
      if (server.status !== 'running') {
        throw new Error('Server must be running to send RCON commands');
      }
      
      // Try native server RCON first, fallback to container RCON
      let response: RconResponse;
      try {
        response = await containerApi.sendNativeRconCommand(server.name, rconCommand);
      } catch (nativeError) {
        console.warn('Native RCON failed, trying container RCON:', nativeError);
        try {
          response = await containerApi.sendRconCommand(server.name, rconCommand);
        } catch (containerError) {
          console.error('Both RCON methods failed:', { nativeError, containerError });
          throw new Error(`RCON connection failed. Server may not be running or RCON may not be configured.`);
        }
      }
      
      const newEntry: CommandHistory = {
        command: rconCommand,
        response: response.response || response.message,
        timestamp: new Date(),
        success: response.success
      };

      setRconHistory(prev => [...prev, newEntry]);
      setRconCommand('');
      setHistoryIndex(-1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send command';
      const newEntry: CommandHistory = {
        command: rconCommand,
        response: errorMessage,
        timestamp: new Date(),
        success: false
      };

      setRconHistory(prev => [...prev, newEntry]);
      setRconCommand('');
      setHistoryIndex(-1);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < rconHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setRconCommand(rconHistory[rconHistory.length - 1 - newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setRconCommand(rconHistory[rconHistory.length - 1 - newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setRconCommand('');
      }
    }
  };

  const clearHistory = () => {
    setRconHistory([]);
  };

  // Server control actions
  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!server) return;
    
    setActionLoading(action);
    
    try {
      let response;
      
      if (server.type === 'container') {
        // Use container API methods
        switch (action) {
          case 'start':
            response = await containerApi.startContainer(server.name);
            break;
          case 'stop':
            response = await containerApi.stopContainer(server.name);
            break;
          case 'restart':
            response = await containerApi.restartContainer(server.name);
            break;
        }
      } else {
        // Use native server API methods
        switch (action) {
          case 'start':
            response = await containerApi.startNativeServer(server.name);
            break;
          case 'stop':
            response = await containerApi.stopNativeServer(server.name);
            break;
          case 'restart':
            response = await containerApi.restartNativeServer(server.name);
            break;
        }
      }
      
      if (response.success) {
        // For start actions, check if server is actually running after a delay
        if (action === 'start' && server.type !== 'container') {
          // Show immediate success message
          console.log(response.message);
          
          // Check server status after a delay
          setTimeout(async () => {
            try {
              const isRunning = await containerApi.isNativeServerRunning(server.name);
              if (isRunning) {
                console.log(`Server ${server.name} is now running`);
              } else {
                console.log(`Server ${server.name} may still be starting up`);
              }
              // Reload server data to update status
              window.location.reload();
            } catch (error) {
              console.error('Error checking server status:', error);
            }
          }, 5000); // Check after 5 seconds
        } else {
          // For other actions, reload immediately
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setError(`Failed to ${action} server: ${response.message || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      console.error(`Failed to ${action} server:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to ${action} server: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading server details...</p>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error || 'Server not found'}</span>
          </div>
          <button onClick={() => navigate('/servers')} className="btn btn-primary">
            ← Back to Servers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/servers')}
                className="btn btn-ghost btn-circle"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🦖</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">{server.name}</h1>
                <p className="text-base-content/70">
                  Server Management & Configuration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`badge ${getStatusColor(server.status)}`}>
                {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
              </span>
              <div className="btn-group">
                <button
                  onClick={() => handleServerAction('start')}
                  disabled={actionLoading !== null || server.status === 'running'}
                  className="btn btn-sm btn-success"
                >
                  {actionLoading === 'start' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '▶️ Start'
                  )}
                </button>
                <button
                  onClick={() => handleServerAction('stop')}
                  disabled={actionLoading !== null || server.status === 'stopped'}
                  className="btn btn-sm btn-error"
                >
                  {actionLoading === 'stop' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '⏹️ Stop'
                  )}
                </button>
                <button
                  onClick={() => handleServerAction('restart')}
                  disabled={actionLoading !== null}
                  className="btn btn-sm btn-warning"
                >
                  {actionLoading === 'restart' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '🔄 Restart'
                  )}
                </button>
              </div>
              
              {/* Start Script Viewer Button - Only show for native/cluster servers */}
              {(server.type === 'native' || server.type === 'cluster-server') && (
                <button
                  onClick={() => setShowStartScript(true)}
                  className="btn btn-sm btn-outline btn-info ml-2"
                >
                  📜 View Start Script
                </button>
              )}
              
              {/* Update Server Button */}
              <button
                onClick={() => setShowUpdateManager(true)}
                className="btn btn-sm btn-outline btn-accent ml-2"
              >
                🔄 Update Server
              </button>
              
              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsEditor(true)}
                className="btn btn-sm btn-outline btn-primary ml-2"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('details')}
          >
            📊 Details
          </button>
          <button
            className={`tab ${activeTab === 'rcon' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('rcon')}
          >
            🖥️ RCON Console
          </button>
          <button
            className={`tab ${activeTab === 'mods' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('mods')}
          >
            🎮 Mods
          </button>
          <button
            className={`tab ${activeTab === 'config' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('config')}
          >
            ⚙️ Configuration
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('logs')}
          >
            📋 Logs
          </button>
          <button
            className={`tab ${activeTab === 'saves' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('saves')}
          >
            💾 Save Files
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Server Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Name:</span>
                          <span className="font-medium">{server.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Type:</span>
                          <span className="badge badge-outline">{getTypeLabel(server.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Status:</span>
                          <span className={`badge ${getStatusColor(server.status)}`}>
                            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                          </span>
                        </div>
                        {server.map && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Map:</span>
                            <span>{getMapDisplayName(server.map)}</span>
                          </div>
                        )}
                        {server.clusterName && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Cluster:</span>
                            <span>{server.clusterName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Network Information</h4>
                      <div className="space-y-2">
                        {server.gamePort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Game Port:</span>
                            <span>{server.gamePort}</span>
                          </div>
                        )}
                        {server.queryPort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Query Port:</span>
                            <span>{server.queryPort}</span>
                          </div>
                        )}
                        {server.rconPort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">RCON Port:</span>
                            <span>{server.rconPort}</span>
                          </div>
                        )}
                        {server.maxPlayers && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Max Players:</span>
                            <span>{server.maxPlayers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {server.config && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Configuration</h4>
                      <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-64">
                        {JSON.stringify(server.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Live Server Details */}
                {server.status === 'running' && (
                  <ServerLiveDetails 
                    serverName={server.name} 
                    serverType={server.type} 
                  />
                )}
              </div>
            )}

            {activeTab === 'rcon' && (
              <div className="space-y-4">
                {/* Console Output */}
                <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl flex-1 flex flex-col" style={{ minHeight: '400px' }}>
                  <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-300/50">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-primary">🖥️ Console Window</h4>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-base-content/70">
                        {rconHistory.length} messages
                      </span>
                      <button
                        onClick={clearHistory}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        🗑️ Clear Console
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 bg-black/90 text-green-400" style={{ minHeight: '300px' }}>
                    {rconHistory.length === 0 ? (
                      <div className="text-center py-12 text-green-400/60">
                        <div className="text-4xl mb-4">💻</div>
                        <p className="text-lg">Console Ready</p>
                        <p className="text-sm">Type a command below to get started</p>
                        <div className="mt-4 text-xs text-green-400/40">
                          <p>Use ↑↓ arrow keys to navigate command history</p>
                          <p>Press Enter to execute commands</p>
                        </div>
                      </div>
                    ) : (
                      rconHistory.map((entry, index) => (
                        <div key={index} className="space-y-2">
                          {/* Command Input */}
                          <div className="flex items-center space-x-2 bg-blue-900/30 p-2 rounded border-l-4 border-blue-500">
                            <span className="text-blue-400 font-bold">$</span>
                            <span className="text-yellow-400 font-medium">{entry.command}</span>
                            <span className="text-blue-400/50 text-xs">
                              [{entry.timestamp.toLocaleTimeString()}]
                            </span>
                          </div>
                          
                          {/* Response Output */}
                          <div className={`ml-4 p-2 rounded border-l-4 ${
                            entry.success 
                              ? 'bg-green-900/30 border-green-500 text-green-400' 
                              : 'bg-red-900/30 border-red-500 text-red-400'
                          }`}>
                            {entry.response.split('\n').map((line, lineIndex) => (
                              <div key={lineIndex} className="text-sm">
                                {line || '\u00A0'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Cursor indicator when no history */}
                    {rconHistory.length === 0 && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <span className="text-green-400 font-bold">$</span>
                        <span className="animate-pulse">█</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Command Input */}
                <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      <span className="text-primary font-bold text-lg">$</span>
                      <input
                        type="text"
                        value={rconCommand}
                        onChange={(e) => setRconCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onKeyPress={(e) => e.key === 'Enter' && executeRconCommand()}
                        placeholder="Enter RCON command..."
                        className="input input-bordered flex-1 font-mono"
                        disabled={isExecuting}
                      />
                      <button
                        onClick={executeRconCommand}
                        disabled={isExecuting || !rconCommand.trim()}
                        className="btn btn-primary"
                      >
                        {isExecuting ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Commands */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-sm text-base-content/70 mr-2">Quick commands:</span>
                    {['listplayers', 'saveworld', 'broadcast', 'kickplayer'].map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        onClick={() => setRconCommand(cmd)}
                        className="btn btn-xs btn-outline btn-primary"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mods' && (
              <ServerModManager serverName={server.name} onClose={() => setActiveTab('details')} />
            )}

            {activeTab === 'config' && (
              <ServerConfigEditor serverName={server.name} />
            )}

            {activeTab === 'logs' && (
              <ServerLogViewer compact={true} serverName={serverName} />
            )}

            {activeTab === 'saves' && server && (
              <SaveFileManager 
                serverName={server.name} 
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Start Script Viewer Modal */}
      {showStartScript && server && (
        <StartScriptViewer
          serverName={server.name}
          onClose={() => setShowStartScript(false)}
        />
      )}

      {/* Server Update Manager Modal */}
      {showUpdateManager && (
        <ServerUpdateManager onClose={() => setShowUpdateManager(false)} />
      )}

      {/* Server Settings Editor Modal */}
      {showSettingsEditor && server && (
        <ServerSettingsEditor
          server={server}
          onClose={() => setShowSettingsEditor(false)}
          onSave={() => {
            // Reload server data to reflect changes
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default ServerDetails; 