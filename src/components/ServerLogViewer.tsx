import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socketService, type LogMessage } from '../services';
import { logsApi, type LogFile } from '../services/api';

interface ServerLogViewerProps {
  compact?: boolean;
  serverName?: string;
}

const ServerLogViewer: React.FC<ServerLogViewerProps> = ({ compact = false, serverName: propServerName }) => {
  const params = useParams<{ serverName: string }>();
  const serverName = propServerName || params.serverName;
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [availableLogFiles, setAvailableLogFiles] = useState<LogFile[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverName) {
      loadAvailableLogFiles();
      connectToServerLogs();
    }

    return () => {
      socketService.offServerLog();
      socketService.disconnect().catch(console.error);
    };
  }, [serverName]);

  // Handle log file selection change
  useEffect(() => {
    if (selectedLogFile && isConnected && serverName) {
      // Clear current logs when switching files
      setLogs([]);
      
      // Switch to the selected log file
      if (selectedLogFile === 'server') {
        socketService.switchToServerLogs(serverName);
      } else {
        socketService.switchLogFile(selectedLogFile);
      }
    }
  }, [selectedLogFile, isConnected, serverName]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadAvailableLogFiles = async () => {
    if (!serverName) return;

    setIsLoadingFiles(true);
    try {
      const response = await logsApi.getLogFiles(serverName);
      setAvailableLogFiles(response.logFiles);
      
      // Auto-select server logs by default
      if (!selectedLogFile) {
        setSelectedLogFile('server');
      }
    } catch (err) {
      console.error('Failed to load log files:', err);
      setError('Failed to load available log files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const connectToServerLogs = async () => {
    if (!serverName) return;

    setIsLoading(true);
    setError('');

    try {
      await socketService.connect(serverName, selectedLogFile);
      setIsConnected(true);

      // Set up event listeners for server logs
      socketService.onServerLog((logMessage: LogMessage) => {
        setLogs(prev => [...prev, logMessage]);
      });

      socketService.onConnect(() => {
        setIsConnected(true);
        setError('');
      });

      socketService.onDisconnect((reason: string) => {
        setIsConnected(false);
        if (reason !== 'io client disconnect') {
          setError(`Disconnected: ${reason}`);
          // Try to load static logs as fallback
          loadStaticLogs();
        }
      });

      socketService.onError((error: Error) => {
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
        // Try to load static logs as fallback
        loadStaticLogs();
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server logs');
      setIsConnected(false);
      // Try to load static logs as fallback
      loadStaticLogs();
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaticLogs = async () => {
    if (!serverName || !selectedLogFile) return;
    
    try {
      // Try to load recent logs from the API as a fallback
      const response = await logsApi.getLogContent(serverName, selectedLogFile, 100);
      if (response.success && response.content) {
        // Parse the log content and convert to LogMessage format
        const logLines = response.content.split('\n').filter(line => line.trim());
        const staticLogs: LogMessage[] = logLines.map((line, index) => ({
          timestamp: new Date(Date.now() - (logLines.length - index) * 1000).toISOString(),
          level: 'info',
          message: line,
          container: serverName || 'unknown'
        }));
        
        setLogs(staticLogs);
        setError('Using static log content (real-time connection unavailable)');
      }
    } catch (err) {
      console.error('Failed to load static logs:', err);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-error';
      case 'warn': return 'text-warning';
      case 'info': return 'text-info';
      case 'debug': return 'text-base-content/50';
      default: return 'text-base-content';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '🔴';
      case 'warn': return '🟡';
      case 'info': return '🔵';
      case 'debug': return '⚪';
      default: return '⚪';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesFilter && matchesLevel;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Connecting to server logs...</p>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact version for tab content
    return (
      <div className="space-y-4">
        {/* Log File Selector */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Log File</span>
                  </label>
                  <select
                    value={selectedLogFile}
                    onChange={(e) => setSelectedLogFile(e.target.value)}
                    className="select select-bordered select-sm"
                    disabled={isLoadingFiles}
                  >
                    {isLoadingFiles ? (
                      <option>Loading log files...</option>
                    ) : (
                      <>
                        <option value="server">📦 Server Logs</option>
                        {availableLogFiles.length === 0 ? (
                          <option disabled>No additional log files available</option>
                        ) : (
                          availableLogFiles.map((file) => (
                            <option key={file.name} value={file.name}>
                              📄 {file.name} ({formatFileSize(file.size)})
                            </option>
                          ))
                        )}
                      </>
                    )}
                  </select>
                </div>
                
                <button
                  onClick={loadAvailableLogFiles}
                  className="btn btn-sm btn-outline btn-secondary"
                  disabled={isLoadingFiles}
                >
                  {isLoadingFiles ? (
                    <div className="loading loading-spinner loading-xs"></div>
                  ) : (
                    '🔄'
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearLogs}
                  className="btn btn-sm btn-outline btn-error"
                >
                  🗑️ Clear
                </button>
                <button
                  onClick={exportLogs}
                  className="btn btn-sm btn-outline btn-success"
                >
                  📥 Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={connectToServerLogs}
              className="btn btn-sm btn-outline btn-error"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Log Display */}
        <div className="card bg-base-100 shadow-sm flex-1 flex flex-col">
          <div className="card-body flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">
                Server Log Output
                {selectedLogFile && (
                  <span className="text-sm font-normal text-base-content/70 ml-2">
                    - {selectedLogFile}
                  </span>
                )}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-base-content/70">
                  Showing {filteredLogs.length} of {logs.length} entries
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-sm bg-base-200 rounded-lg p-4" style={{ minHeight: '400px' }}>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">
                  <div className="text-4xl mb-4">📋</div>
                  <p>{logs.length === 0 ? 'No server logs received yet' : 'No logs match the current filter'}</p>
                  <p className="text-sm">
                    {logs.length === 0 ? 'Waiting for server log data...' : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 hover:bg-base-300 p-1 rounded transition-colors"
                    >
                      <span className="text-xs text-base-content/50 min-w-[80px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-lg">{getLogLevelIcon(log.level)}</span>
                      <span className={`font-semibold min-w-[60px] ${getLogLevelColor(log.level)}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-base-content flex-1 break-words">
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full page version (original implementation)
  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">Server Logs</h1>
                <p className="text-base-content/70">
                  Real-time logs for {serverName}
                </p>
              </div>
            </div>
            <Link
              to="/containers"
              className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
            >
              ← Back to Servers
            </Link>
          </div>
        </div>

        {/* Log File Selector */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Log File</span>
                  </label>
                  <select
                    value={selectedLogFile}
                    onChange={(e) => setSelectedLogFile(e.target.value)}
                    className="select select-bordered select-sm"
                    disabled={isLoadingFiles}
                  >
                    {isLoadingFiles ? (
                      <option>Loading log files...</option>
                    ) : (
                      <>
                        <option value="server">📦 Server Logs</option>
                        {availableLogFiles.length === 0 ? (
                          <option disabled>No additional log files available</option>
                        ) : (
                          availableLogFiles.map((file) => (
                            <option key={file.name} value={file.name}>
                              📄 {file.name} ({formatFileSize(file.size)})
                            </option>
                          ))
                        )}
                      </>
                    )}
                  </select>
                </div>
                
                <button
                  onClick={loadAvailableLogFiles}
                  className="btn btn-sm btn-outline btn-secondary"
                  disabled={isLoadingFiles}
                >
                  {isLoadingFiles ? (
                    <div className="loading loading-spinner loading-xs"></div>
                  ) : (
                    '🔄'
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearLogs}
                  className="btn btn-sm btn-outline btn-error"
                >
                  🗑️ Clear
                </button>
                <button
                  onClick={exportLogs}
                  className="btn btn-sm btn-outline btn-success"
                >
                  📥 Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Filter Logs</span>
                </label>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search in log messages..."
                  className="input input-bordered input-sm"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Log Level</span>
                </label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value as any)}
                  className="select select-bordered select-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Auto-scroll</span>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="toggle toggle-primary toggle-sm"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={connectToServerLogs}
              className="btn btn-sm btn-outline btn-error"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Log Display */}
        <div className="card bg-base-100 shadow-sm flex-1 flex flex-col">
          <div className="card-body flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">
                Server Log Output
                {selectedLogFile && (
                  <span className="text-sm font-normal text-base-content/70 ml-2">
                    - {selectedLogFile}
                  </span>
                )}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-base-content/70">
                  Showing {filteredLogs.length} of {logs.length} entries
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-sm bg-base-200 rounded-lg p-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">
                  <div className="text-4xl mb-4">📋</div>
                  <p>{logs.length === 0 ? 'No server logs received yet' : 'No logs match the current filter'}</p>
                  <p className="text-sm">
                    {logs.length === 0 ? 'Waiting for server log data...' : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 hover:bg-base-300 p-1 rounded transition-colors"
                    >
                      <span className="text-xs text-base-content/50 min-w-[80px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-lg">{getLogLevelIcon(log.level)}</span>
                      <span className={`font-semibold min-w-[60px] ${getLogLevelColor(log.level)}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-base-content flex-1 break-words">
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Level Legend */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-sm">Log Level Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔴</span>
                <span className="text-error">Error</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🟡</span>
                <span className="text-warning">Warning</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔵</span>
                <span className="text-info">Info</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚪</span>
                <span className="text-base-content/50">Debug</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerLogViewer; 