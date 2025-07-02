import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socketService, type LogMessage } from '../services';

const LogViewer = () => {
  const { containerName } = useParams<{ containerName: string }>();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerName) {
      connectToLogs();
    }

    return () => {
      socketService.disconnect();
    };
  }, [containerName]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const connectToLogs = async () => {
    if (!containerName) return;

    setIsLoading(true);
    setError('');

    try {
      await socketService.connect(containerName);
      setIsConnected(true);

      // Set up event listeners
      socketService.onLog((logMessage: LogMessage) => {
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
        }
      });

      socketService.onError((error: Error) => {
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to logs');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
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
    a.download = `${containerName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
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

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesFilter && matchesLevel;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="ark-rotate inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Connecting to logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">Server Logs</h1>
                <p className="text-base-content/70">
                  Real-time logs for {containerName}
                </p>
              </div>
            </div>
            <Link
              to="/containers"
              className="btn btn-outline btn-primary ark-hover-glow"
            >
              ← Back to Servers
            </Link>
          </div>
        </div>

        {/* Connection Status */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'} ark-pulse`}></div>
              <span className="text-sm">
                {isConnected ? 'Connected to log stream' : 'Disconnected'}
              </span>
              {logs.length > 0 && (
                <span className="text-sm text-base-content/70">
                  {logs.length} log entries
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearLogs}
                className="btn btn-sm btn-outline btn-error ark-hover-glow"
              >
                Clear Logs
              </button>
              <button
                onClick={exportLogs}
                disabled={logs.length === 0}
                className="btn btn-sm btn-outline btn-info ark-hover-glow"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.2s' }}>
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
                className="input input-bordered input-sm ark-hover-scale"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Log Level</span>
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value as any)}
                className="select select-bordered select-sm ark-hover-scale"
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

        {/* Error Display */}
        {error && (
          <div className="alert alert-error ark-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={connectToLogs}
              className="btn btn-sm btn-outline btn-error"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Log Display */}
        <div className="ark-glass rounded-xl flex-1 flex flex-col ark-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h2 className="text-lg font-semibold text-primary">Log Output</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-base-content/70">
                Showing {filteredLogs.length} of {logs.length} entries
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <div className="text-4xl mb-4">📋</div>
                <p>{logs.length === 0 ? 'No logs received yet' : 'No logs match the current filter'}</p>
                <p className="text-sm">
                  {logs.length === 0 ? 'Waiting for log data...' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 hover:bg-base-200 p-1 rounded transition-colors"
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

        {/* Log Level Legend */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-lg font-semibold text-primary mb-3">Log Level Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-error">🔴</span>
              <span>Error - Critical issues</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-warning">🟡</span>
              <span>Warning - Potential issues</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-info">🔵</span>
              <span>Info - General information</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base-content/50">⚪</span>
              <span>Debug - Detailed debugging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer; 