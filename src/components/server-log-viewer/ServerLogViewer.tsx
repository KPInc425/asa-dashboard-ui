import React from 'react';
import { Link } from 'react-router-dom';
import { useServerLogViewer } from './useServerLogViewer';
import { getLogLevelColor, getLogLevelIcon, formatFileSize } from './utils';
import type { ServerLogViewerProps } from './types';

const ServerLogViewer: React.FC<ServerLogViewerProps> = ({ serverName: propServerName }) => {
  const {
    serverName, logs, isConnected, isLoading, error, autoScroll, filter, logLevel,
    availableLogFiles, selectedLogFile, isLoadingFiles, lineCount, logsEndRef,
    setFilter, setLogLevel, setSelectedLogFile, setLineCount, setAutoScroll,
    connectToServerLogs, loadStaticLogs, loadAvailableLogFiles, clearLogs, exportLogs, debugLogFiles,
    filteredLogs,
  } = useServerLogViewer(propServerName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Connecting to service logs...</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">Server Logs</h1>
                <p className="text-base-content/70">Real-time logs for {serverName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={debugLogFiles} className="btn btn-warning hover:shadow-lg hover:shadow-warning/25" title="Debug log file discovery">🔍 Debug Logs</button>
              <Link to="/containers" className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25">← Back to Servers</Link>
            </div>
          </div>
        </div>

        {/* Log File Selector */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Log File</span></label>
                  <select value={selectedLogFile} onChange={(e) => setSelectedLogFile(e.target.value)} className="select select-bordered select-sm" disabled={isLoadingFiles}>
                    {isLoadingFiles ? (<option>Loading log files...</option>) : (
                      <>
                        <option value="server">📦 Service Logs</option>
                        {availableLogFiles.length === 0 ? (<option disabled>No additional log files available</option>) : (
                          availableLogFiles.map((file) => (
                            <option key={file.name} value={file.name}>📄 {file.name} ({formatFileSize(file.size)})</option>
                          ))
                        )}
                      </>
                    )}
                  </select>
                </div>
                <button onClick={loadAvailableLogFiles} className="btn btn-sm btn-outline btn-secondary" disabled={isLoadingFiles}>
                  {isLoadingFiles ? (<div className="loading loading-spinner loading-xs"></div>) : '🔄'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => loadStaticLogs(true)} className="btn btn-sm btn-outline btn-primary" disabled={isLoadingFiles}>🔄 Refresh Logs</button>
                <button onClick={debugLogFiles} className="btn btn-sm btn-outline btn-warning" title="Debug log file discovery">🔍 Debug Logs</button>
                <button onClick={clearLogs} className="btn btn-sm btn-outline btn-error">🗑️ Clear</button>
                <button onClick={exportLogs} className="btn btn-sm btn-outline btn-success">📥 Export</button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Filter Logs</span></label>
                <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search in log messages..." className="input input-bordered input-sm" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Log Level</span></label>
                <select value={logLevel} onChange={(e) => setLogLevel(e.target.value as any)} className="select select-bordered select-sm">
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Lines</span></label>
                <select value={lineCount} onChange={(e) => setLineCount(parseInt(e.target.value))} className="select select-bordered select-sm">
                  <option value={100}>100 lines</option>
                  <option value={500}>500 lines</option>
                  <option value={1000}>1000 lines</option>
                  <option value={2000}>2000 lines</option>
                  <option value={5000}>5000 lines</option>
                  <option value={10000}>10000 lines</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Auto-scroll</span>
                  <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="toggle toggle-primary toggle-sm" />
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
            <button onClick={connectToServerLogs} className="btn btn-sm btn-outline btn-error">Reconnect</button>
          </div>
        )}

        {/* Log Display */}
        <div className="card bg-base-100 shadow-sm flex-1 flex flex-col">
          <div className="card-body flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">
                Server Log Output
                {selectedLogFile && (<span className="text-sm font-normal text-base-content/70 ml-2">- {selectedLogFile}</span>)}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-base-content/70">Showing {filteredLogs.length} of {logs.length} entries</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh] font-mono text-sm bg-base-200 rounded-lg p-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-base-content/50">
                  <div className="text-4xl mb-4">📋</div>
                  <p>{logs.length === 0 ? 'No service logs received yet' : 'No logs match the current filter'}</p>
                  <p className="text-sm">{logs.length === 0 ? 'Waiting for service log data...' : 'Try adjusting your filters'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-2 hover:bg-base-300 p-1 rounded transition-colors">
                      <span className="text-xs text-base-content/50 min-w-[80px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-lg">{getLogLevelIcon(log.level)}</span>
                      <span className={`font-semibold min-w-[60px] ${getLogLevelColor(log.level)}`}>[{log.level.toUpperCase()}]</span>
                      <span className="text-base-content flex-1 break-words">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerLogViewer;
