import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provisioningApi } from '../services/api';

interface SystemLogs {
  api?: string;
  service?: string;
  docker?: string;
}

const SystemLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SystemLogs>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logType, setLogType] = useState<string>('all');
  const [lines, setLines] = useState<number>(100);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await provisioningApi.getSystemLogs(logType, lines);
      
      if (response.success) {
        setLogs(response.logs);
      } else {
        setError('Failed to load system logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [logType, lines]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]);

  const formatLogContent = (content: string) => {
    if (!content) return 'No logs available';
    
    return content.split('\n').map((line, index) => {
      const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed');
      const isWarning = line.toLowerCase().includes('warn') || line.toLowerCase().includes('warning');
      const isInfo = line.toLowerCase().includes('info');
      
      let className = 'font-mono text-sm';
      if (isError) className += ' text-error';
      else if (isWarning) className += ' text-warning';
      else if (isInfo) className += ' text-info';
      else className += ' text-base-content';
      
      return (
        <div key={index} className={className}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadLogs = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && Object.keys(logs).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading system logs...</p>
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
                <h1 className="text-4xl font-bold text-primary mb-2">System Logs</h1>
                <p className="text-base-content/70">
                  Monitor backend system logs for debugging and troubleshooting
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Log Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                >
                  <option value="all">All Logs</option>
                  <option value="api">API Logs</option>
                  <option value="service">Service Logs</option>
                  <option value="docker">Docker Logs</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Lines</span>
                </label>
                <select
                  className="select select-bordered"
                  value={lines}
                  onChange={(e) => setLines(Number(e.target.value))}
                >
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                  <option value={200}>200 lines</option>
                  <option value={500}>500 lines</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Auto Refresh</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">&nbsp;</span>
                </label>
                <button
                  onClick={loadLogs}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    '🔄 Refresh'
                  )}
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
          </div>
        )}

        {/* Logs Display */}
        <div className="space-y-6">
          {logType === 'all' ? (
            // Show all log types
            Object.entries(logs).map(([type, content]) => (
              <div key={type} className="card bg-base-100 shadow-lg">
                <div className="card-header bg-base-200">
                  <div className="flex items-center justify-between">
                    <h3 className="card-title capitalize">{type} Logs</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(content)}
                        className="btn btn-sm btn-outline"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => downloadLogs(content, `${type}-logs.txt`)}
                        className="btn btn-sm btn-outline"
                        title="Download logs"
                      >
                        💾 Download
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="bg-base-300 p-4 max-h-96 overflow-y-auto">
                    {formatLogContent(content)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Show single log type
            <div className="card bg-base-100 shadow-lg">
              <div className="card-header bg-base-200">
                <div className="flex items-center justify-between">
                  <h3 className="card-title capitalize">{logType} Logs</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(logs[logType as keyof SystemLogs] || '')}
                      className="btn btn-sm btn-outline"
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => downloadLogs(logs[logType as keyof SystemLogs] || '', `${logType}-logs.txt`)}
                      className="btn btn-sm btn-outline"
                      title="Download logs"
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="bg-base-300 p-4 max-h-96 overflow-y-auto">
                  {formatLogContent(logs[logType as keyof SystemLogs] || '')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* No Logs Message */}
        {Object.keys(logs).length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Logs Available</h3>
            <p className="text-base-content/70">
              No system logs are currently available. This might be because the log files don't exist yet or the system hasn't generated any logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs; 