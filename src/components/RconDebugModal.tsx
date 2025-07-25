import React from 'react';
import { createPortal } from 'react-dom';

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
    configAdminPassword: string;
    allMatch: boolean;
  };
  configFiles?: {
    configsPath: string;
    gameUserSettingsExists: boolean;
    gameIniExists: boolean;
    rconEnabled: string | null;
    rconPort: string | null;
    configAdminPassword: string | null;
    gameUserSettingsContent: string | null;
    gameIniContent: string | null;
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-base-300">
          <h3 className="font-bold text-lg">
            🔍 RCON Debug: {serverName}
          </h3>
        </div>
        
                {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
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

          {/* Config Files */}
          {debugInfo.configFiles && (
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h4 className="card-title text-sm">Configuration Files</h4>
                <div className="bg-base-300 p-3 rounded font-mono text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span>Config Files Analysis:</span>
                    <button 
                      onClick={() => copyToClipboard(formatJson(debugInfo.configFiles))}
                      className="btn btn-xs btn-primary"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap overflow-auto">{formatJson(debugInfo.configFiles)}</pre>
                </div>
              </div>
            </div>
          )}

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
                {debugInfo.configFiles && (
                  <>
                    <div className="flex items-center gap-2">
                      <span>GameUserSettings.ini:</span>
                      <span className={`badge ${debugInfo.configFiles.gameUserSettingsExists ? 'badge-success' : 'badge-error'}`}>
                        {debugInfo.configFiles.gameUserSettingsExists ? '✅ Exists' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>RCON Enabled:</span>
                      <span className={`badge ${debugInfo.configFiles.rconEnabled === 'True' ? 'badge-success' : 'badge-error'}`}>
                        {debugInfo.configFiles.rconEnabled === 'True' ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Config Password Set:</span>
                      <span className={`badge ${debugInfo.configFiles.configAdminPassword ? 'badge-success' : 'badge-error'}`}>
                        {debugInfo.configFiles.configAdminPassword ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-base-300">
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render outside of any container constraints
  return createPortal(modalContent, document.body);
};

export default RconDebugModal; 