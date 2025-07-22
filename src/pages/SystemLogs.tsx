import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provisioningApi } from '../services/api';

interface LogFile {
  content: string;
  path: string;
  exists: boolean;
}

interface SystemLogs {
  combined?: LogFile;
  error?: LogFile;
  asaApiService?: LogFile;
  nodeOut?: LogFile;
  nodeErr?: LogFile;
  serviceOut?: LogFile;
  serviceErr?: LogFile;
  api?: { content: string };
  server?: { content: string };
  docker?: { content: string };
}

interface ServiceInfo {
  mode: 'native' | 'docker';
  isWindowsService: boolean;
  serviceInstallPath: string | null;
  logBasePath: string;
  currentWorkingDirectory: string;
  processId: number;
  parentProcessId: number;
}

const SystemLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SystemLogs>({});
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('combined');
  const [lines, setLines] = useState<number>(100);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await provisioningApi.getSystemLogs('all', lines);
      
      if (response.success) {
        setLogs(response.logFiles || {});
        setServiceInfo(response.serviceInfo);
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
  }, [lines]);

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

  // Get available tabs based on existing log files or new backend keys
  const getAvailableTabs = () => {
    const tabs = [];
    if (logs.api && logs.api.content) tabs.push({ key: 'api', label: 'API Logs', icon: '📝' });
    if (logs.server && logs.server.content) tabs.push({ key: 'server', label: 'Server Logs', icon: '🖥️' });
    if (logs.docker && logs.docker.content) tabs.push({ key: 'docker', label: 'Docker Logs', icon: '🐳' });
    if (logs.combined?.exists) tabs.push({ key: 'combined', label: 'Combined Logs', icon: '📋' });
    if (logs.error?.exists) tabs.push({ key: 'error', label: 'Error Logs', icon: '❌' });
    if (logs.asaApiService?.exists) tabs.push({ key: 'asaApiService', label: 'API Service', icon: '🔧' });
    if (logs.nodeOut?.exists) tabs.push({ key: 'nodeOut', label: 'Node Stdout', icon: '📤' });
    if (logs.nodeErr?.exists) tabs.push({ key: 'nodeErr', label: 'Node Stderr', icon: '📥' });
    if (logs.serviceOut?.exists) tabs.push({ key: 'serviceOut', label: 'Service Stdout', icon: '⚙️' });
    if (logs.serviceErr?.exists) tabs.push({ key: 'serviceErr', label: 'Service Stderr', icon: '⚠️' });
    return tabs;
  };

  // Set initial active tab to first available
  useEffect(() => {
    const availableTabs = getAvailableTabs();
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [logs]);

  const formatLogContent = (content: string) => {
    if (!content) return 'No logs available';
    
    return content.split('\n').reverse().map((line, index) => {
      // Improved log level detection
      let logLevel = 'info';
      
      // Check for JSON log format first
      try {
        if (line.trim() && line.includes('"level"')) {
          const match = line.match(/"level":\s*"?([^",\s]+)"?/);
          if (match) {
            logLevel = match[1].toLowerCase();
          }
        }
      } catch (error) {
        // Fallback to text-based detection
      }
      
      // If still 'info', check for text-based log level indicators
      if (logLevel === 'info') {
        const lowerLine = line.toLowerCase();
        
        // Check for error indicators
        if (lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('exception') || 
            lowerLine.includes('fatal') || lowerLine.includes('critical')) {
          logLevel = 'error';
        }
        // Check for warning indicators
        else if (lowerLine.includes('warn') || lowerLine.includes('warning') || lowerLine.includes('deprecated')) {
          logLevel = 'warn';
        }
        // Check for info indicators
        else if (lowerLine.includes('info') || lowerLine.includes('started') || lowerLine.includes('connected') ||
                 lowerLine.includes('listening') || lowerLine.includes('ready')) {
          logLevel = 'info';
        }
        // Check for debug indicators
        else if (lowerLine.includes('debug') || lowerLine.includes('trace')) {
          logLevel = 'debug';
        }
        // Default to neutral for lines without clear indicators
        else {
          logLevel = 'neutral';
        }
      }
      
      let className = 'font-mono text-sm';
      if (logLevel === 'error') className += ' text-error';
      else if (logLevel === 'warn') className += ' text-warning';
      else if (logLevel === 'info') className += ' text-info';
      else if (logLevel === 'debug') className += ' text-base-content/50';
      else className += ' text-base-content'; // neutral and default
      
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

  // Support new backend log object structure
  const currentLog = logs[activeTab as keyof SystemLogs] as any;
  const currentLogContent = currentLog?.content || currentLog?.content || '';

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
                {serviceInfo && (
                  <div className="text-sm text-base-content/60 mt-1">
                    Mode: {serviceInfo.mode === 'docker' ? 'Docker' : 
                           serviceInfo.isWindowsService ? 'Native (Windows Service)' : 'Native (Development)'} | 
                    Logs: {Object.keys(logs).length} files available
                  </div>
                )}
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
        {getAvailableTabs().length > 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-0">
              {/* Tabs */}
              <div className="tabs tabs-boxed bg-base-200 p-2 m-4">
                {getAvailableTabs().map((tab) => (
                  <button
                    key={tab.key}
                    className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {currentLogContent ? (
                  <div>
                    {/* Log Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold">
                          {getAvailableTabs().find(tab => tab.key === activeTab)?.label}
                        </span>
                        <span className="badge badge-outline">
                          {currentLog.path ? currentLog.path.split(/[/\\]/).pop() || 'Unknown' : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(currentLogContent)}
                          className="btn btn-sm btn-outline"
                          title="Copy to clipboard"
                        >
                          📋 Copy
                        </button>
                        <button
                          onClick={() => downloadLogs(currentLogContent, `${activeTab}-logs.txt`)}
                          className="btn btn-sm btn-outline"
                          title="Download logs"
                        >
                          💾 Download
                        </button>
                      </div>
                    </div>

                    {/* Log Content */}
                    <div className="bg-base-300 p-4 rounded-lg max-h-96 overflow-y-auto">
                      {formatLogContent(currentLogContent)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-semibold mb-2">No Log Content</h3>
                    <p className="text-base-content/70">
                      The selected log file doesn't have any content or couldn't be read.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No Logs Message */
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Logs Available</h3>
            <p className="text-base-content/70">
              No system logs are currently available. This might be because the log files don't exist yet or the system hasn't generated any logs.
            </p>
            {serviceInfo && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg">
                <h4 className="font-semibold mb-2">Service Information:</h4>
                <div className="text-sm text-left space-y-1">
                  <div>Mode: {serviceInfo.mode === 'docker' ? 'Docker' : 
                               serviceInfo.isWindowsService ? 'Native (Windows Service)' : 'Native (Development)'}</div>
                  <div>Working Directory: {serviceInfo.currentWorkingDirectory}</div>
                  <div>Log Base Path: {serviceInfo.logBasePath}</div>
                  <div>Process ID: {serviceInfo.processId}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs; 