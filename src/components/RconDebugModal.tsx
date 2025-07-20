import React from 'react';

interface DebugInfo {
  serverName: string;
  environment: {
    NATIVE_BASE_PATH: string;
    NATIVE_CLUSTERS_PATH: string;
    NATIVE_SERVERS_PATH: string;
    SERVER_MODE: string;
  };
  serverInfo: {
    adminPassword: string;
    configAdminPassword: string;
    rconPort: string;
    gamePort: string;
    serverPath: string;
    isClusterServer: boolean;
    clusterName: string;
    serverType: string;
  };
  databaseConfig: any;
  startBatInfo: {
    path: string;
    exists: boolean;
    password: string;
    passwordLength: number;
    contentPreview: string | null;
  };
  passwordComparison: {
    serverPassword: string;
    databasePassword: string;
    startBatPassword: string;
    allMatch: boolean;
  };
}

interface RconDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugInfo: DebugInfo | null;
  serverName: string;
}

const RconDebugModal: React.FC<RconDebugModalProps> = ({ isOpen, onClose, debugInfo, serverName }) => {
  if (!isOpen || !debugInfo) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJson = (obj: any) => {
    if (!obj) return 'null';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">
          🔍 RCON Debug: {serverName}
        </h3>
        
        <div className="space-y-4">
          {/* Environment Variables */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Environment Variables</h4>
              <div className="bg-base-300 p-3 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Environment Config:</span>
                  <button 
                    onClick={() => copyToClipboard(formatJson(debugInfo.environment))}
                    className="btn btn-xs btn-primary"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{formatJson(debugInfo.environment)}</pre>
              </div>
            </div>
          </div>

          {/* Server Info */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Server Information</h4>
              <div className="bg-base-300 p-3 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Server Config:</span>
                  <button 
                    onClick={() => copyToClipboard(formatJson(debugInfo.serverInfo))}
                    className="btn btn-xs btn-primary"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{formatJson(debugInfo.serverInfo)}</pre>
              </div>
            </div>
          </div>

          {/* Database Config */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Database Configuration</h4>
              <div className="bg-base-300 p-3 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Database Config:</span>
                  <button 
                    onClick={() => copyToClipboard(formatJson(debugInfo.databaseConfig))}
                    className="btn btn-xs btn-primary"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{formatJson(debugInfo.databaseConfig)}</pre>
              </div>
            </div>
          </div>

          {/* Start.bat Info */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Start.bat Information</h4>
              <div className="bg-base-300 p-3 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Start.bat Details:</span>
                  <button 
                    onClick={() => copyToClipboard(formatJson(debugInfo.startBatInfo))}
                    className="btn btn-xs btn-primary"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{formatJson(debugInfo.startBatInfo)}</pre>
              </div>
            </div>
          </div>

          {/* Password Comparison */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Password Comparison</h4>
              <div className="bg-base-300 p-3 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span>Password Analysis:</span>
                  <button 
                    onClick={() => copyToClipboard(formatJson(debugInfo.passwordComparison))}
                    className="btn btn-xs btn-primary"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{formatJson(debugInfo.passwordComparison)}</pre>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm">Summary</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Start.bat Exists:</span>
                  <span className={`badge ${debugInfo.startBatInfo?.exists ? 'badge-success' : 'badge-error'}`}>
                    {debugInfo.startBatInfo?.exists ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Passwords Match:</span>
                  <span className={`badge ${debugInfo.passwordComparison?.allMatch ? 'badge-success' : 'badge-error'}`}>
                    {debugInfo.passwordComparison?.allMatch ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Is Cluster Server:</span>
                  <span className={`badge ${debugInfo.serverInfo?.isClusterServer ? 'badge-info' : 'badge-warning'}`}>
                    {debugInfo.serverInfo?.isClusterServer ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Server Type:</span>
                  <span className="badge badge-outline">{debugInfo.serverInfo?.serverType || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default RconDebugModal; 