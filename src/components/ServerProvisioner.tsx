import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import type { JobProgress } from '../services/socket';
import PasswordInput from './PasswordInput';
import GlobalConfigManager from './GlobalConfigManager';
import GlobalModManager from './GlobalModManager';

interface SystemInfo {
  diskSpace: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    drive?: string;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  steamCmdInstalled: boolean;
  steamCmdPath?: string;
  basePath: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  cpuCores: number;
}

interface Cluster {
  name: string;
  path: string;
  config: {
    description?: string;
    serverCount?: number;
    basePort?: number;
    maxPlayers?: number;
    adminPassword?: string;
    clusterPassword?: string;
    harvestMultiplier?: number;
    xpMultiplier?: number;
    tamingMultiplier?: number;
    servers?: any[];
  };
  created: string;
}

interface ServerConfig {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
  rconPassword: string;
  harvestMultiplier: number;
  xpMultiplier: number;
  tamingMultiplier: number;
  nameSuffix?: string;
  sessionName?: string;
}

// Wizard step types
type WizardStep = 'welcome' | 'cluster-basic' | 'map-selection' | 'server-config' | 'game-settings' | 'review' | 'creating';

interface WizardData {
  clusterName: string;
  description: string;
  serverCount: number;
  basePort: number;
  portAllocationMode: 'sequential' | 'even';
  selectedMaps: Array<{map: string, count: number, enabled: boolean, displayName?: string}>;
  customMapName: string;
  customMapDisplayName: string;
  customMapCount: number;
  globalSessionName: string;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
  clusterPassword: string;
  harvestMultiplier: number;
  xpMultiplier: number;
  tamingMultiplier: number;
  servers: ServerConfig[];
  foreground: boolean;
  sessionNameMode: 'auto' | 'custom';
  customDynamicConfigUrl: string;
}

interface StepProps {
  wizardData: WizardData;
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
  availableMaps: Array<{name: string, displayName: string, available: boolean}>;
  toggleMap?: (mapName: string) => void;
  updateMapCount?: (mapName: string, count: number) => void;
  generateServers: () => ServerConfig[];
}

// Move step components outside the main component to prevent recreation
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🦖</div>
    <h2 className="text-3xl font-bold text-primary">Welcome to ASA Cluster Creation</h2>
    <p className="text-base-content/70 text-lg">
      This wizard will help you create a new ARK: Survival Ascended server cluster.
      Each cluster can contain multiple servers running different maps.
    </p>
    
    <div className="bg-base-300 rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="font-semibold mb-4">What you'll need:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>SteamCMD installed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>~30GB free disk space per server</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Stable internet connection</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Administrator privileges</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Available network ports</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>10-30 minutes setup time</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PortAllocationPreview: React.FC<{wizardData: WizardData}> = ({ wizardData }) => {
  const previewPorts = useMemo(() => {
    const ports = [];
    const basePort = wizardData.basePort;
    const mode = wizardData.portAllocationMode;
    
    console.log('PortAllocationPreview - basePort:', basePort, 'mode:', mode);
    
    for (let i = 0; i < Math.min(wizardData.serverCount, 5); i++) {
      if (mode === 'sequential') {
        // Sequential mode: Game ports increment by 1, Query/RCON use standard ARK offsets
        const gamePort = basePort + i;
        const queryPort = 27015 + i;
        const rconPort = basePort + i + 24553;
        console.log(`Sequential Server ${i+1}: Game=${gamePort}, Query=${queryPort}, RCON=${rconPort}`);
        ports.push({
          gamePort,
          queryPort,
          rconPort
        });
      } else {
        // Even mode: Everything increments by 2
        const gamePort = basePort + (i * 6);
        const queryPort = basePort + (i * 6) + 2;
        const rconPort = basePort + (i * 6) + 4;
        console.log(`Even Server ${i+1}: Game=${gamePort}, Query=${queryPort}, RCON=${rconPort}`);
        ports.push({
          gamePort,
          queryPort,
          rconPort
        });
      }
    }
    return ports;
  }, [wizardData.basePort, wizardData.serverCount, wizardData.portAllocationMode]);

  return (
    <div className="bg-base-300 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Port Allocation Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {previewPorts.map((ports, index) => (
          <div key={index} className="bg-base-200 rounded p-3 text-sm">
            <div className="font-semibold">Server {index + 1}</div>
            <div>Game: {ports.gamePort}</div>
            <div>Query: {ports.queryPort}</div>
            <div>RCON: {ports.rconPort}</div>
          </div>
        ))}
        {wizardData.serverCount > 5 && (
          <div className="bg-base-200 rounded p-3 text-sm">
            <div className="font-semibold">...</div>
            <div>+{wizardData.serverCount - 5} more servers</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ClusterBasicStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-primary">Cluster Information</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Cluster Name *</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="MyAwesomeCluster"
          value={wizardData.clusterName}
          onChange={(e) => setWizardData(prev => ({ ...prev, clusterName: e.target.value }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Description</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="My awesome ARK cluster"
          value={wizardData.description}
          onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Number of Servers</span>
        </label>
        <input
          type="number"
          className="input input-bordered"
          placeholder="1"
          min="1"
          max="50"
          value={wizardData.serverCount}
          onChange={(e) => setWizardData(prev => ({ ...prev, serverCount: parseInt(e.target.value) || 1 }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Base Port</span>
        </label>
        <input
          type="number"
          className="input input-bordered"
          placeholder="7777"
          value={wizardData.basePort}
          onChange={(e) => setWizardData(prev => ({ ...prev, basePort: parseInt(e.target.value) }))}
        />
      </div>
      
              <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Port Allocation Mode</span>
          </label>
          <select
            className="select select-bordered"
            value={wizardData.portAllocationMode}
            onChange={(e) => setWizardData(prev => ({ ...prev, portAllocationMode: e.target.value as 'sequential' | 'even' }))}
          >
            <option value="sequential">Sequential (Game: 7777,7778... Query: 27015,27016... RCON: 24553+ Game)</option>
            <option value="even">Even (Server1: 7777,7779,7781... Server2: 7787,7789,7791...)</option>
          </select>
        </div>
        

    </div>
    
    <PortAllocationPreview wizardData={wizardData} />
  </div>
);

const MapSelectionStep: React.FC<StepProps> = ({ wizardData, setWizardData, availableMaps, toggleMap, updateMapCount }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-primary">Map Selection</h2>
    <p className="text-base-content/70 text-lg">
      Choose which maps you want to include in your cluster.
      You can select multiple maps and specify how many servers for each.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {availableMaps.map(map => (
        <div key={map.name} className={`bg-base-300 rounded-lg p-4 ${!map.available ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{map.displayName}</h3>
            {!map.available && (
              <span className="badge badge-warning badge-sm">Coming Soon</span>
            )}
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Enabled:</span>
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={wizardData.selectedMaps.some(m => m.map === map.name && m.enabled)}
              onChange={() => toggleMap && toggleMap(map.name)}
              disabled={!map.available}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Count:</span>
            <input
              type="number"
              className="input input-bordered input-sm w-24"
              value={wizardData.selectedMaps.find(m => m.map === map.name)?.count || 1}
              onChange={(e) => updateMapCount && updateMapCount(map.name, parseInt(e.target.value))}
              min="1"
              disabled={!map.available}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Custom Map Input */}
    <div className="bg-base-300 rounded-lg p-4 border-2 border-dashed border-base-content/30">
      <h3 className="font-semibold mb-3">Custom Map (Premium/Mod Maps)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Map Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="CustomMapName"
            value={wizardData.customMapName || ''}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapName: e.target.value }))}
          />
          <label className="label">
            <span className="label-text-alt">Enter the exact map name (e.g., ModMapName)</span>
          </label>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Display Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="My Custom Map"
            value={wizardData.customMapDisplayName || ''}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapDisplayName: e.target.value }))}
          />
          <label className="label">
            <span className="label-text-alt">Friendly name for display</span>
          </label>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Server Count</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="1"
            min="1"
            max="10"
            value={wizardData.customMapCount || 1}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapCount: parseInt(e.target.value) || 1 }))}
          />
          <label className="label">
            <span className="label-text-alt">Number of servers for this map</span>
          </label>
        </div>
      </div>
      
      {wizardData.customMapName && (
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{wizardData.customMapDisplayName || wizardData.customMapName}</span>
              <span className="text-sm text-base-content/70 ml-2">({wizardData.customMapCount} server{wizardData.customMapCount !== 1 ? 's' : ''})</span>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                const customMap = {
                  map: wizardData.customMapName,
                  count: wizardData.customMapCount,
                  enabled: true,
                  displayName: wizardData.customMapDisplayName || wizardData.customMapName
                };
                setWizardData(prev => ({
                  ...prev,
                  selectedMaps: [...prev.selectedMaps, customMap],
                  customMapName: '',
                  customMapDisplayName: '',
                  customMapCount: 1
                }));
              }}
            >
              Add Custom Map
            </button>
          </div>
        </div>
      )}
    </div>

    {wizardData.selectedMaps.length === 0 && (
      <p className="text-warning text-sm mt-2">
        No maps selected. The Island will be used for all servers.
      </p>
    )}
  </div>
);

const ServerConfigStep: React.FC<StepProps> = ({ wizardData, setWizardData, generateServers, availableMaps }) => {
  const servers = generateServers();
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [configMode, setConfigMode] = useState<'global' | 'individual'>('global');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showServerPassword, setShowServerPassword] = useState(false);
  const [showClusterPassword, setShowClusterPassword] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Server Configuration</h2>
      
      {/* Configuration Mode Toggle */}
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Configuration Mode</h3>
          <div className="join">
            <button
              className={`btn btn-sm join-item ${configMode === 'global' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setConfigMode('global')}
            >
              Global Config
            </button>
            <button
              className={`btn btn-sm join-item ${configMode === 'individual' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setConfigMode('individual')}
            >
              Individual Servers
            </button>
          </div>
        </div>
        
        {configMode === 'global' ? (
          <p className="text-sm text-base-content/70">
            Configure settings that will be applied to all servers in the cluster.
          </p>
        ) : (
          <p className="text-sm text-base-content/70">
            Configure individual server settings. Use tabs below to switch between servers.
          </p>
        )}
      </div>
      
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Session Name Configuration</h3>
        </div>
        
        <div className="flex gap-4 mb-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="sessionNameMode"
              className="radio radio-primary"
              checked={wizardData.sessionNameMode === 'auto'}
              onChange={() => setWizardData(prev => ({ ...prev, sessionNameMode: 'auto' }))}
            />
            <span className="label-text ml-2">Auto (use server names)</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              name="sessionNameMode"
              className="radio radio-primary"
              checked={wizardData.sessionNameMode === 'custom'}
              onChange={() => setWizardData(prev => ({ ...prev, sessionNameMode: 'custom' }))}
            />
            <span className="label-text ml-2">Custom session names</span>
          </label>
        </div>
        
        {wizardData.sessionNameMode === 'custom' && (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Global Session Name</span>
              <div className="tooltip tooltip-right" data-tip="This will be used as the session name for all servers. You can override individual servers in the individual config mode.">
                <span className="label-text-alt cursor-help">ℹ️</span>
              </div>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g., My Awesome ARK Cluster"
              value={wizardData.globalSessionName}
              onChange={(e) => setWizardData(prev => ({ ...prev, globalSessionName: e.target.value }))}
            />
            <div className="text-xs text-base-content/70 mt-1">
              This will be used as the default session name for all servers. You can override it per server in the individual config.
            </div>
          </div>
        )}
      </div>

      {configMode === 'global' ? (
        /* Global Configuration */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Max Players per Server</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              placeholder="70"
              value={wizardData.maxPlayers}
              onChange={(e) => setWizardData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Admin Password</span>
            </label>
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                className="input input-bordered pr-12"
                placeholder="admin123"
                value={wizardData.adminPassword}
                onChange={(e) => setWizardData(prev => ({ ...prev, adminPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
              >
                {showAdminPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Server Password (Optional)</span>
            </label>
            <div className="relative">
              <input
                type={showServerPassword ? 'text' : 'password'}
                className="input input-bordered pr-12"
                placeholder="Leave empty for public server"
                value={wizardData.serverPassword}
                onChange={(e) => setWizardData(prev => ({ ...prev, serverPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                onClick={() => setShowServerPassword(!showServerPassword)}
              >
                {showServerPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Cluster Password (Optional)</span>
            </label>
            <div className="relative">
              <input
                type={showClusterPassword ? 'text' : 'password'}
                className="input input-bordered pr-12"
                placeholder="For cluster transfers"
                value={wizardData.clusterPassword}
                onChange={(e) => setWizardData(prev => ({ ...prev, clusterPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                onClick={() => setShowClusterPassword(!showClusterPassword)}
              >
                {showClusterPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Individual Server Configuration */
        <div className="space-y-4">
          {/* Server Tabs */}
          <div className="tabs tabs-boxed">
            {servers.map((server, index) => (
              <button
                key={index}
                className={`tab ${selectedServerIndex === index ? 'tab-active' : ''}`}
                onClick={() => setSelectedServerIndex(index)}
              >
                {server.name}
              </button>
            ))}
          </div>

          {/* Selected Server Configuration */}
          {servers.length > 0 && (
            <div className="bg-base-300 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              {servers[selectedServerIndex].name}
              {servers[selectedServerIndex].nameSuffix && `-${servers[selectedServerIndex].nameSuffix}`}
            </h3>
            <div className="badge badge-info">{servers[selectedServerIndex].map}</div>
          </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Server Name Suffix (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., PvP, Hardcore, Modded"
                    value={servers[selectedServerIndex].nameSuffix || ''}
                    onChange={(e) => {
                      const updatedServers = [...servers];
                      updatedServers[selectedServerIndex] = {
                        ...updatedServers[selectedServerIndex],
                        nameSuffix: e.target.value
                      };
                      setWizardData(prev => ({ ...prev, servers: updatedServers }));
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">Will be appended to server name (e.g., MyCluster-TheIsland-PvP)</span>
                  </label>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Session Name (Server Browser Display)</span>
                    <div className="tooltip tooltip-right" data-tip="What players see in the server browser. Leave empty to use the global session name or server name.">
                      <span className="label-text-alt cursor-help">ℹ️</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., My Awesome PvP Server"
                    value={servers[selectedServerIndex].sessionName || ''}
                    onChange={(e) => {
                      const updatedServers = [...servers];
                      updatedServers[selectedServerIndex] = {
                        ...updatedServers[selectedServerIndex],
                        sessionName: e.target.value
                      };
                      setWizardData(prev => ({ ...prev, servers: updatedServers }));
                    }}
                  />
                  <div className="text-xs text-base-content/70 mt-1">
                    Leave empty to use the global session name or server name.
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Max Players</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="70"
                    value={wizardData.maxPlayers}
                    onChange={(e) => setWizardData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Admin Password</span>
                  </label>
                  <PasswordInput
                    value={wizardData.adminPassword}
                    onChange={(value) => setWizardData(prev => ({ ...prev, adminPassword: value }))}
                    placeholder="admin123"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Server Password (Optional)</span>
                  </label>
                  <PasswordInput
                    value={wizardData.serverPassword}
                    onChange={(value) => setWizardData(prev => ({ ...prev, serverPassword: value }))}
                    placeholder="Leave empty for public server"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Cluster Password (Optional)</span>
                  </label>
                  <PasswordInput
                    value={wizardData.clusterPassword}
                    onChange={(value) => setWizardData(prev => ({ ...prev, clusterPassword: value }))}
                    placeholder="For cluster transfers"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-base-200 rounded-lg">
                <h4 className="font-semibold mb-2">Server Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Game Port:</span>
                    <div>{servers[selectedServerIndex].gamePort}</div>
                  </div>
                  <div>
                    <span className="font-semibold">Query Port:</span>
                    <div>{servers[selectedServerIndex].queryPort}</div>
                  </div>
                  <div>
                    <span className="font-semibold">RCON Port:</span>
                    <div>{servers[selectedServerIndex].rconPort}</div>
                  </div>
                  <div>
                    <span className="font-semibold">Map:</span>
                    <div>{servers[selectedServerIndex].map}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Server Summary */}
      <div className="bg-base-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Server Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((server, index) => (
            <div key={index} className="bg-base-200 rounded p-3 text-sm">
              <div className="font-semibold">
                {server.name}
                {server.nameSuffix && `-${server.nameSuffix}`}
              </div>
              <div className="text-xs text-base-content/70">
                {server.sessionName || 'No session name set'}
              </div>
              <div>Map: {availableMaps.find(m => m.name === server.map)?.displayName || server.map}</div>
              <div>Port: {server.gamePort}</div>
              <div>Players: {server.maxPlayers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GameSettingsStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-primary">Game Settings</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Harvest Multiplier</span>
                      <div className="tooltip tooltip-right" data-tip="How much resources you get from harvesting">
              <span className="label-text-alt cursor-help">ℹ️</span>
            </div>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="3.0"
          value={wizardData.harvestMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, harvestMultiplier: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">XP Multiplier</span>
                      <div className="tooltip tooltip-right" data-tip="How fast you gain experience">
              <span className="label-text-alt cursor-help">ℹ️</span>
            </div>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="3.0"
          value={wizardData.xpMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, xpMultiplier: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Taming Multiplier</span>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="5.0"
          value={wizardData.tamingMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, tamingMultiplier: parseFloat(e.target.value) }))}
        />
        <label className="label">
          <span className="label-text-alt">How fast creatures tame</span>
        </label>
      </div>
    </div>
    
    {/* Custom Dynamic Config URL */}
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">Custom Dynamic Config URL (Optional)</span>
        <div className="tooltip tooltip-right" data-tip="URL to a custom dynamic config file that will be used for all servers in this cluster">
          <span className="label-text-alt cursor-help">ℹ️</span>
        </div>
      </label>
      <input
        type="url"
        className="input input-bordered"
        placeholder="https://example.com/dynamic-config.ini"
        value={wizardData.customDynamicConfigUrl}
        onChange={(e) => setWizardData(prev => ({ ...prev, customDynamicConfigUrl: e.target.value }))}
      />
      <label className="label">
        <span className="label-text-alt">Leave empty to use default dynamic config</span>
      </label>
    </div>
    
    <div className="bg-base-300 rounded-lg p-4">
      <h3 className="font-semibold mb-2">Recommended Settings:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-semibold">Casual:</span>
          <div>Harvest: 2.0</div>
          <div>XP: 2.0</div>
          <div>Taming: 3.0</div>
        </div>
        <div>
          <span className="font-semibold">Balanced:</span>
          <div>Harvest: 3.0</div>
          <div>XP: 3.0</div>
          <div>Taming: 5.0</div>
        </div>
        <div>
          <span className="font-semibold">Fast:</span>
          <div>Harvest: 5.0</div>
          <div>XP: 5.0</div>
          <div>Taming: 10.0</div>
        </div>
      </div>
    </div>
  </div>
);

const ReviewStep: React.FC<StepProps> = ({ wizardData, setWizardData, generateServers, availableMaps }) => {
  const servers = generateServers();
  // const totalSpace = servers.length * 30; // 30GB per server
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Review Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-base-300 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Cluster Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Name:</span> {wizardData.clusterName}</div>
            <div><span className="font-semibold">Description:</span> {wizardData.description || 'None'}</div>

            <div><span className="font-semibold">Servers:</span> {servers.length}</div>
            <div><span className="font-semibold">Base Port:</span> {wizardData.basePort}</div>
          </div>
        </div>
        
        <div className="bg-base-300 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Game Settings</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Max Players:</span> {wizardData.maxPlayers}</div>
            <div><span className="font-semibold">Harvest Multiplier:</span> {wizardData.harvestMultiplier}x</div>
            <div><span className="font-semibold">XP Multiplier:</span> {wizardData.xpMultiplier}x</div>
            <div><span className="font-semibold">Taming Multiplier:</span> {wizardData.tamingMultiplier}x</div>
          </div>
        </div>
      </div>
      
      {/* Execution Mode Selection */}
      <div className="bg-base-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Execution Mode</h3>
        <div className="space-y-3">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                <input
                  type="radio"
                  name="foreground"
                  className="radio radio-primary mr-2"
                  checked={!wizardData.foreground}
                  onChange={() => setWizardData(prev => ({ ...prev, foreground: false }))}
                />
                Background Mode (Recommended)
              </span>
            </label>
            <div className="text-xs text-base-content/70 ml-6">
              Operations run in the background. Use this for normal operation.
            </div>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                <input
                  type="radio"
                  name="foreground"
                  className="radio radio-primary mr-2"
                  checked={wizardData.foreground}
                  onChange={() => setWizardData(prev => ({ ...prev, foreground: true }))}
                />
                Foreground Mode (Watch Progress)
              </span>
            </label>
            <div className="text-xs text-base-content/70 ml-6">
              Operations run in the terminal with visible progress. Use this if you have direct access to the backend server terminal.
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-base-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Servers ({servers.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((server, index) => (
            <div key={index} className="bg-base-200 rounded p-3 text-sm">
              <div className="font-semibold">
                {server.name}
                {server.nameSuffix && `-${server.nameSuffix}`}
              </div>
              <div className="text-xs text-base-content/70">
                {server.sessionName || 'No session name set'}
              </div>
              <div>Map: {availableMaps.find(m => m.name === server.map)?.displayName || server.map}</div>
              <div>Port: {server.gamePort}</div>
              <div>Players: {server.maxPlayers}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-warning/20 border border-warning rounded-lg p-4">
        <h3 className="font-semibold text-warning mb-2">⚠️ Important Information</h3>
        <div className="space-y-1 text-sm">
          <div>• Each server requires ~30GB of disk space</div>
          <div>• Total space needed: ~30GB (per server)</div>
          <div>• Installation may take 10-30 minutes depending on internet speed</div>
          <div>• SteamCMD will be used to download ASA server files</div>
          <div>• Each server in the cluster will have its own ASA binaries</div>
        </div>
      </div>
    </div>
  );
};

interface CreatingStepProps {
  jobId?: string | null;
  jobProgress?: JobProgress | null;
}

const CreatingStep: React.FC<CreatingStepProps> = ({ jobId, jobProgress }) => {
  const [currentStep, setCurrentStep] = useState<string>('Validating configuration');
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('Installing ASA server files and configuring your cluster...');
  // const [status, setStatus] = useState<'running' | 'completed' | 'failed' | 'cancelled'>('running');

  // Update progress from job progress
  useEffect(() => {
    console.log('CreatingStep: jobProgress updated:', jobProgress);
    if (jobProgress) {
      console.log('CreatingStep: Setting progress to:', jobProgress.progress);
      console.log('CreatingStep: Setting message to:', jobProgress.message);
      setProgress(jobProgress.progress);
      setMessage(jobProgress.message);
      // setStatus(jobProgress.status);
      
      if (jobProgress.step) {
        setCurrentStep(jobProgress.step);
      }
    }
  }, [jobProgress]);

  const getStepIcon = (stepName: string) => {
    const completedSteps = [
      'Validating configuration',
      'Installing ASA server files',
      'Creating server configurations',
      'Setting up cluster settings',
      'Finalizing cluster creation'
    ];
    
    const currentStepIndex = completedSteps.indexOf(currentStep);
    const stepIndex = completedSteps.indexOf(stepName);
    
    if (stepIndex < currentStepIndex) {
      return <span className="text-success">✅</span>;
    } else if (stepIndex === currentStepIndex) {
      return <span className="text-warning">⏳</span>;
    } else {
      return <span className="text-base-content/50">⏸️</span>;
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="text-3xl font-bold text-primary">Creating Your Cluster</h2>
      <p className="text-base-content/70 text-lg">{message}</p>
      <p className="text-xs text-base-content/50">Debug: Progress={progress}%, Message="{message}"</p>
      
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-base-300 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 text-sm text-base-content/70">
          {progress}% Complete
        </div>
      </div>
      
      <div className="bg-base-300 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold mb-4">Progress:</h3>
        <div className="space-y-2 text-sm text-left">
          <div className="flex items-center gap-2">
            {getStepIcon('Validating configuration')}
            <span>Validating configuration</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Installing ASA server files')}
            <span>Installing ASA server files</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Creating server configurations')}
            <span>Creating server configurations</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Setting up cluster settings')}
            <span>Setting up cluster settings</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Finalizing cluster creation')}
            <span>Finalizing cluster creation</span>
          </div>
        </div>
      </div>
      
      {jobId && (
        <div className="text-xs text-base-content/50">
          Job ID: {jobId}
        </div>
      )}
      
      <p className="text-base-content/50 text-sm">
        This process may take 10-30 minutes depending on your internet speed and the number of servers.
      </p>
    </div>
  );
};

const ServerProvisioner: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [showGlobalConfigManager, setShowGlobalConfigManager] = useState(false);
  const [showGlobalModManager, setShowGlobalModManager] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    // Cluster basic info
    clusterName: '',
    description: '',
    serverCount: 1,
    basePort: 7777,
    portAllocationMode: 'sequential' as 'sequential' | 'even', // 'sequential' = old way, 'even' = new way
    
    // Map selection
    selectedMaps: [] as Array<{map: string, count: number, enabled: boolean, displayName?: string}>,
    customMapName: '',
    customMapDisplayName: '',
    customMapCount: 1,
    globalSessionName: '',
    
    // Server configuration
    maxPlayers: 70,
    adminPassword: 'admin123',
    serverPassword: '',
    clusterPassword: '',
    
    // Game settings
    harvestMultiplier: 3.0,
    xpMultiplier: 3.0,
    tamingMultiplier: 5.0,
    
    // Generated servers
    servers: [] as ServerConfig[],
    
    // Execution mode
    foreground: false,
    
    // Session name mode
    sessionNameMode: 'auto' as 'auto' | 'custom',
    
    // Custom dynamic config URL
    customDynamicConfigUrl: ''
  });

  const availableMaps = [
    { name: 'TheIsland_WP', displayName: 'The Island', available: true },
    { name: 'TheCenter_WP', displayName: 'The Center', available: true },
    { name: 'Ragnarok_WP', displayName: 'Ragnarok', available: true },
    { name: 'ScorchedEarth_WP', displayName: 'Scorched Earth', available: true },
    { name: 'Aberration_WP', displayName: 'Aberration', available: true },
    { name: 'Extinction_WP', displayName: 'Extinction', available: true },
    { name: 'BobsMissions_WP', displayName: 'Club ARK', available: true },
    { name: 'CrystalIsles_WP', displayName: 'Crystal Isles', available: false },
    { name: 'Valguero_WP', displayName: 'Valguero', available: false },
    { name: 'LostIsland_WP', displayName: 'Lost Island', available: false },
    { name: 'Fjordur_WP', displayName: 'Fjordur', available: false },
    { name: 'Genesis_WP', displayName: 'Genesis', available: false },
    { name: 'Genesis2_WP', displayName: 'Genesis Part 2', available: false }
  ];

  useEffect(() => {
    loadSystemInfo();
    loadClusters();
    
    // Set up Socket.IO job progress listener
    socketService.onJobProgress((progress) => {
      console.log('Job progress received via Socket.IO:', progress);
      setJobProgress(progress);
      
      // If job is completed or failed, update status
      if (progress.status === 'completed') {
        setStatusMessage('✅ Cluster created successfully!');
        setStatusType('success');
        setTimeout(() => {
          setStatusMessage(null);
          setShowWizard(false);
          setCurrentStep('welcome');
          setCurrentJobId(null);
          setJobProgress(null);
          loadClusters();
        }, 3000);
      } else if (progress.status === 'failed') {
        setStatusMessage(`❌ Cluster creation failed: ${progress.error || 'Unknown error'}`);
        setStatusType('error');
        setTimeout(() => {
          setStatusMessage(null);
          setCurrentStep('review');
          setCurrentJobId(null);
          setJobProgress(null);
        }, 10000);
      }
    });
    
    // Add Socket.IO connection status logging
    socketService.onConnect(() => {
      console.log('Socket.IO connected - job progress updates should work');
    });
    
    socketService.onDisconnect((reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
    
    socketService.onError((error) => {
      console.error('Socket.IO error:', error);
    });
    
    // Cleanup Socket.IO listeners on unmount
    return () => {
      socketService.offJobProgress();
    };
  }, []);

  // Poll for job status as fallback for Socket.IO
  useEffect(() => {
    if (currentJobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiService.provisioning.getJobStatus(currentJobId);
          if (response.success && response.job) {
            const job = response.job;
            console.log('Job status polled:', job);
            
            // Update job progress with the latest information
            if (job.progress && job.progress.length > 0) {
              const latestProgress = job.progress[job.progress.length - 1];
              
              // Calculate progress based on the number of progress entries and job status
              let progressPercent = 0;
              if (job.status === 'completed') {
                progressPercent = 100;
              } else if (job.status === 'failed') {
                progressPercent = 0;
              } else {
                // Estimate progress based on typical cluster creation steps
                const totalSteps = 5; // validation, directory creation, server installation, config creation, finalization
                const currentStep = Math.min(job.progress.length, totalSteps);
                progressPercent = Math.round((currentStep / totalSteps) * 100);
              }
              
              const progressData = {
                jobId: job.id,
                status: job.status,
                progress: progressPercent,
                message: latestProgress.message,
                error: job.error
              };
              console.log('Main component: Setting jobProgress to:', progressData);
              setJobProgress(progressData);
            }
            
            if (job.status === 'completed') {
              setStatusMessage('✅ Cluster created successfully!');
              setStatusType('success');
              setCurrentJobId(null);
              setJobProgress(null);
              loadClusters();
              setTimeout(() => {
                setStatusMessage(null);
                setShowWizard(false);
                setCurrentStep('welcome');
              }, 3000);
            } else if (job.status === 'failed') {
              setStatusMessage(`❌ Cluster creation failed: ${job.error || 'Unknown error'}`);
              setStatusType('error');
              setCurrentJobId(null);
              setJobProgress(null);
              setTimeout(() => {
                setStatusMessage(null);
                setCurrentStep('review');
              }, 10000);
            }
          }
        } catch (error) {
          console.error('Failed to poll job status:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [currentJobId]);

  const loadSystemInfo = async () => {
    try {
      console.log('Loading system info...');
      const response = await apiService.provisioning.getSystemInfo();
      console.log('System info response:', response);
      if (response.success) {
        setSystemInfo(response.status);
        setStatusMessage('✅ System status refreshed');
        setStatusType('success');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
      setStatusMessage(`❌ Failed to refresh system status: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadClusters = async () => {
    try {
      console.log('Loading clusters...');
      const response = await apiService.provisioning.listClusters();
      console.log('Clusters response:', response);
      if (response.success) {
        setClusters(response.clusters || []);
      } else {
        setClusters([]);
      }
    } catch (error) {
      console.error('Failed to load clusters:', error);
      setClusters([]);
    }
  };

  const initializeSystem = async () => {
    try {
      setInstalling(true);
      setStatusMessage('Initializing system...');
      setStatusType('info');
      const response = await apiService.provisioning.initialize();
      if (response.success) {
        // After initialization, refresh system info
        await loadSystemInfo();
        setStatusMessage('System initialized successfully!');
        setStatusType('success');
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (error) {
      console.error('Failed to initialize system:', error);
      setStatusMessage(`Failed to initialize system: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      setTimeout(() => { setStatusMessage(null); }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const installSteamCmd = async () => {
    try {
      setInstalling(true);
      setStatusMessage('Installing SteamCMD...');
      setStatusType('info');
      
      const response = await apiService.provisioning.installSteamCmd();
      if (response.success) {
        setStatusMessage('✅ SteamCMD installed successfully! You can now create clusters.');
        setStatusType('success');
        
        // Refresh system info to update SteamCMD status
        await loadSystemInfo();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to install SteamCMD:', error);
      setStatusMessage(`❌ Failed to install SteamCMD: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      
      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const deleteCluster = async (clusterName: string, force: boolean = false) => {
    const message = force 
      ? `Are you sure you want to FORCE DELETE cluster "${clusterName}"? This will remove the cluster directory completely, even if it's corrupted or incomplete.`
      : `Are you sure you want to delete cluster "${clusterName}"? This will remove all server data.`;
      
    if (!confirm(message)) {
      return;
    }

    try {
      const response = await apiService.provisioning.deleteCluster(clusterName, force);
      if (response.success) {
        setStatusMessage(`✅ Cluster "${clusterName}" ${force ? 'force ' : ''}deleted successfully!`);
        setStatusType('success');
        setTimeout(() => setStatusMessage(null), 5000);
        loadClusters();
      }
    } catch (error: any) {
      console.error('Failed to delete cluster:', error);
      
      // If normal delete fails, offer force delete
      if (!force) {
        const shouldForceDelete = confirm(
          `Failed to delete cluster "${clusterName}" normally. This might be due to a corrupted or incomplete cluster.\n\n` +
          `Would you like to try force deleting it? This will remove the cluster directory completely.`
        );
        
        if (shouldForceDelete) {
          await deleteCluster(clusterName, true);
        } else {
          setStatusMessage(`❌ Failed to delete cluster "${clusterName}"`);
          setStatusType('error');
          setTimeout(() => setStatusMessage(null), 10000);
        }
      } else {
        setStatusMessage(`❌ Failed to force delete cluster "${clusterName}": ${error instanceof Error ? error.message : String(error)}`);
        setStatusType('error');
        setTimeout(() => setStatusMessage(null), 10000);
      }
    }
  };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const formatGB = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Wizard navigation
  const nextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('cluster-basic');
        break;
      case 'cluster-basic':
        if (wizardData.clusterName.trim()) {
          setCurrentStep('map-selection');
        } else {
          alert('Please enter a cluster name');
        }
        break;
      case 'map-selection':
        if (wizardData.selectedMaps.length > 0) {
          setCurrentStep('server-config');
        } else {
          alert('Please select at least one map');
        }
        break;
      case 'server-config':
        setCurrentStep('game-settings');
        break;
      case 'game-settings':
        setCurrentStep('review');
        break;
      case 'review':
        createCluster();
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'cluster-basic':
        setCurrentStep('welcome');
        break;
      case 'map-selection':
        setCurrentStep('cluster-basic');
        break;
      case 'server-config':
        setCurrentStep('map-selection');
        break;
      case 'game-settings':
        setCurrentStep('server-config');
        break;
      case 'review':
        setCurrentStep('game-settings');
        break;
      default:
        break;
    }
  };

  const generateServers = () => {
    const servers: ServerConfig[] = [];
    let portCounter = wizardData.basePort;

    wizardData.selectedMaps.forEach((mapConfig) => {
      if (mapConfig.enabled && mapConfig.count > 0) {
        for (let i = 0; i < mapConfig.count; i++) {
          const serverName = mapConfig.count === 1 
            ? `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}`
            : `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}-${i + 1}`;

          const server: ServerConfig = {
            name: serverName,
            map: mapConfig.map,
            gamePort: portCounter,
            queryPort: wizardData.portAllocationMode === 'even' ? portCounter + 1 : portCounter + 19338,
            rconPort: wizardData.portAllocationMode === 'even' ? portCounter + 2 : portCounter + 24553,
            maxPlayers: wizardData.maxPlayers,
            adminPassword: wizardData.adminPassword,
            serverPassword: wizardData.serverPassword,
            rconPassword: 'rcon123',
            harvestMultiplier: wizardData.harvestMultiplier,
            xpMultiplier: wizardData.xpMultiplier,
            tamingMultiplier: wizardData.tamingMultiplier,
            nameSuffix: mapConfig.count === 1 ? undefined : `-${i + 1}`,
            sessionName: wizardData.sessionNameMode === 'custom' ? wizardData.globalSessionName : serverName
          };

          servers.push(server);
          portCounter += wizardData.portAllocationMode === 'even' ? 2 : 1;
        }
      }
    });

    return servers;
  };

  const createCluster = async () => {
    try {
      setCurrentStep('creating');
      setInstalling(true);
      
      const servers = generateServers();
      
      // Create comprehensive cluster configuration
      const clusterConfig = {
        name: wizardData.clusterName,
        description: wizardData.description,
        basePort: wizardData.basePort,
        serverCount: servers.length,
        selectedMaps: wizardData.selectedMaps,
        globalMods: [],
        customDynamicConfigUrl: wizardData.customDynamicConfigUrl,
        servers: servers.map(server => {
          // Check if this server uses Club ARK map and add the required mod
          const isClubArkServer = server.map === 'BobsMissions_WP';
          const serverMods = isClubArkServer ? ['1005639'] : [];
          
          return {
            name: server.name,
            map: server.map,
            port: server.gamePort,
            queryPort: server.queryPort,
            rconPort: server.rconPort,
            maxPlayers: server.maxPlayers,
            password: server.serverPassword,
            adminPassword: server.adminPassword,
            mods: serverMods, // Club ARK servers get mod 1005639, others get empty array
            clusterId: wizardData.clusterName,
            clusterName: wizardData.clusterName,
            clusterPassword: wizardData.clusterPassword,
            clusterOwner: 'Admin',
            gameUserSettings: {
              ServerSettings: {
                MaxPlayers: server.maxPlayers,
                DifficultyOffset: 1,
                HarvestAmountMultiplier: server.harvestMultiplier,
                TamingSpeedMultiplier: server.tamingMultiplier,
                XPMultiplier: server.xpMultiplier,
                AllowThirdPersonPlayer: true,
                AlwaysNotifyPlayerLeft: true,
                AlwaysNotifyPlayerJoined: true,
                ServerCrosshair: true,
                ServerForceNoHUD: false,
                ServerThirdPersonPlayer: false,
                ServerHardcore: false,
                ServerAllowThirdPersonPlayer: true,
                ServerShowMapPlayerLocation: true,
                ServerEnablePvPGamma: true,
                ServerAllowFlyerCarryPvE: true,
                ServerDisableStructurePlacementCollision: true,
                ServerAllowCaveBuildingPvE: true,
                ServerAllowFlyingStaminaRecovery: true,
                ServerAllowUnlimitedRespecs: true,
                ServerPreventSpawnFlier: true,
                ServerPreventOfflinePvP: true,
                ServerPreventOfflinePvPInterval: 300,
                ServerPreventOfflinePvPUseStructurePrevention: true,
                ServerPreventOfflinePvPUseStructurePreventionRadius: 1000
              },
              MultiHome: {
                MultiHome: ""
              },
              SessionSettings: {
                SessionName: wizardData.clusterName,
                ServerPassword: server.serverPassword,
                ServerAdminPassword: server.adminPassword,
                MaxPlatformSaddleStructureLimit: 130
              }
            },
            gameIni: {
              ServerSettings: {
                AllowCaveBuildingPvE: true,
                AllowFlyingStaminaRecovery: true,
                AllowUnlimitedRespecs: true,
                PreventSpawnFlier: true,
                PreventOfflinePvP: true,
                PreventOfflinePvPInterval: 300,
                PreventOfflinePvPUseStructurePrevention: true,
                PreventOfflinePvPUseStructurePreventionRadius: 1000
              }
            }
          };
        }),
        created: new Date().toISOString(),
        globalSettings: {
          gameUserSettings: {
            ServerSettings: {
              MaxPlayers: wizardData.maxPlayers,
              DifficultyOffset: 1,
              HarvestAmountMultiplier: wizardData.harvestMultiplier,
              TamingSpeedMultiplier: wizardData.tamingMultiplier,
              XPMultiplier: wizardData.xpMultiplier,
              AllowThirdPersonPlayer: true,
              AlwaysNotifyPlayerLeft: true,
              AlwaysNotifyPlayerJoined: true,
              ServerCrosshair: true,
              ServerForceNoHUD: false,
              ServerThirdPersonPlayer: false,
              ServerHardcore: false,
              ServerAllowThirdPersonPlayer: true,
              ServerShowMapPlayerLocation: true,
              ServerEnablePvPGamma: true,
              ServerAllowFlyerCarryPvE: true,
              ServerDisableStructurePlacementCollision: true,
              ServerAllowCaveBuildingPvE: true,
              ServerAllowFlyingStaminaRecovery: true,
              ServerAllowUnlimitedRespecs: true,
              ServerPreventSpawnFlier: true,
              ServerPreventOfflinePvP: true,
              ServerPreventOfflinePvPInterval: 300,
              ServerPreventOfflinePvPUseStructurePrevention: true,
              ServerPreventOfflinePvPUseStructurePreventionRadius: 1000
            },
            MultiHome: {
              MultiHome: ""
            },
            SessionSettings: {
              SessionName: wizardData.clusterName,
              ServerPassword: wizardData.serverPassword,
              ServerAdminPassword: wizardData.adminPassword,
              MaxPlatformSaddleStructureLimit: 130
            }
          },
          gameIni: {
            ServerSettings: {
              AllowCaveBuildingPvE: true,
              AllowFlyingStaminaRecovery: true,
              AllowUnlimitedRespecs: true,
              PreventSpawnFlier: true,
              PreventOfflinePvP: true,
              PreventOfflinePvPInterval: 300,
              PreventOfflinePvPUseStructurePrevention: true,
              PreventOfflinePvPUseStructurePreventionRadius: 1000
            }
          }
        },
        clusterSettings: {
          clusterId: wizardData.clusterName,
          clusterName: wizardData.clusterName,
          clusterDescription: wizardData.description,
          clusterPassword: wizardData.clusterPassword,
          clusterOwner: 'Admin'
        },
        portConfiguration: {
          basePort: wizardData.basePort,
          portAllocationMode: wizardData.portAllocationMode,
          portIncrement: wizardData.portAllocationMode === 'even' ? 2 : 1,
          queryPortBase: wizardData.portAllocationMode === 'even' ? wizardData.basePort + 1 : wizardData.basePort + 19338,
          queryPortIncrement: wizardData.portAllocationMode === 'even' ? 2 : 1,
          rconPortBase: wizardData.portAllocationMode === 'even' ? wizardData.basePort + 2 : wizardData.basePort + 24553,
          rconPortIncrement: wizardData.portAllocationMode === 'even' ? 2 : 1
        }
      };
      
      const response = await apiService.provisioning.createCluster({
        ...clusterConfig,
        foreground: wizardData.foreground
      });
      
      if (response.success) {
        // Check if we got a job ID for progress tracking
        if (response.jobId) {
          // Set up progress tracking
          setCurrentJobId(response.jobId);
          setStatusMessage('🚀 Cluster creation started! Tracking progress...');
          setStatusType('info');
          
          // Progress will be handled by Socket.IO listener
        } else {
          // Immediate success (no job tracking)
          setStatusMessage('✅ Cluster created successfully!');
          setStatusType('success');
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setStatusMessage(null);
          }, 5000);
          
          setShowWizard(false);
          setCurrentStep('welcome');
          setWizardData({
            clusterName: '',
            description: '',
            serverCount: 1,
            basePort: 30000,
            portAllocationMode: 'sequential',
            selectedMaps: [],
            customMapName: '',
            customMapDisplayName: '',
            customMapCount: 1,
            globalSessionName: '',
            maxPlayers: 70,
            adminPassword: 'admin123',
            serverPassword: '',
            clusterPassword: '',
            harvestMultiplier: 3.0,
            xpMultiplier: 3.0,
            tamingMultiplier: 5.0,
            servers: [],
            foreground: false,
            sessionNameMode: 'auto',
            customDynamicConfigUrl: ''
          });
          loadClusters();
        }
      }
    } catch (error) {
      console.error('Failed to create cluster:', error);
      setStatusMessage(`❌ Failed to create cluster: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      
      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
      
      setCurrentStep('review');
    } finally {
      setInstalling(false);
    }
  };

  const toggleMap = (mapName: string) => {
    setWizardData(prev => {
      const existingMap = prev.selectedMaps.find(m => m.map === mapName);
      
      if (existingMap) {
        // Toggle enabled state
        return {
          ...prev,
          selectedMaps: prev.selectedMaps.map(m => 
            m.map === mapName ? { ...m, enabled: !m.enabled } : m
          )
        };
      } else {
        // Add new map with proper display name
        const availableMap = availableMaps.find(m => m.name === mapName);
        const displayName = availableMap?.displayName || mapName;
        
        return {
          ...prev,
          selectedMaps: [...prev.selectedMaps, { 
            map: mapName, 
            count: 1, 
            enabled: true, 
            displayName: displayName 
          }]
        };
      }
    });
  };

  const updateMapCount = (mapName: string, count: number) => {
    setWizardData(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.map(m => 
        m.map === mapName ? { ...m, count: Math.max(1, count) } : m
      )
    }));
  };

  // Wizard step components
  const renderWizardStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'cluster-basic':
        return <ClusterBasicStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} toggleMap={toggleMap} updateMapCount={updateMapCount} generateServers={generateServers} />;
      case 'map-selection':
        return <MapSelectionStep wizardData={wizardData} availableMaps={availableMaps} toggleMap={toggleMap} updateMapCount={updateMapCount} setWizardData={setWizardData} generateServers={generateServers} />;
      case 'server-config':
        return <ServerConfigStep wizardData={wizardData} setWizardData={setWizardData} generateServers={generateServers} availableMaps={availableMaps} />;
      case 'game-settings':
        return <GameSettingsStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} toggleMap={toggleMap} updateMapCount={updateMapCount} generateServers={generateServers} />;
      case 'review':
        return <ReviewStep wizardData={wizardData} generateServers={generateServers} availableMaps={availableMaps} toggleMap={toggleMap} updateMapCount={updateMapCount} setWizardData={setWizardData} />;
      case 'creating':
        return <CreatingStep jobId={currentJobId} jobProgress={jobProgress} />;
      default:
        return <WelcomeStep />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-base-content/70">Loading system information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Server Provisioning</h1>
              <p className="text-base-content/70">Manage ASA server clusters with separate binary architecture</p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="btn btn-primary"
              disabled={!systemInfo?.steamCmdInstalled}
            >
              🚀 Create New Cluster
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`alert ${statusType === 'success' ? 'alert-success' : statusType === 'error' ? 'alert-error' : 'alert-info'} shadow-lg`}>
            <div className="flex-1">
              <div className="whitespace-pre-line">{statusMessage}</div>
            </div>
            <div className="flex-none">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setStatusMessage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Disk Space */}
            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base-content">
                  Disk Space {systemInfo?.diskSpace?.drive && `(${systemInfo.diskSpace.drive.replace(':', '')}:)`}
                </h3>
                <span className="text-2xl">💾</span>
              </div>
              {systemInfo?.diskSpace ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Total:</span>
                    <span>{formatGB(systemInfo.diskSpace.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Free:</span>
                    <span className="text-success">{formatGB(systemInfo.diskSpace.free)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Usage:</span>
                    <span className="text-warning">{systemInfo.diskSpace.usagePercent}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-base-content/50">Unknown</p>
              )}
            </div>
            
            {/* Memory */}
            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base-content">Memory</h3>
                <span className="text-2xl">🧠</span>
              </div>
              {systemInfo?.memory ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Total:</span>
                    <span>{formatGB(systemInfo.memory.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Free:</span>
                    <span className="text-success">{formatGB(systemInfo.memory.free)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/70">Usage:</span>
                    <span className="text-warning">{systemInfo.memory.usagePercent}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-base-content/50">Unknown</p>
              )}
            </div>

            {/* SteamCMD */}
            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base-content">SteamCMD</h3>
                <span className="text-2xl">🎮</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${systemInfo?.steamCmdInstalled ? 'badge-success' : 'badge-error'}`}>
                  {systemInfo?.steamCmdInstalled ? 'Installed' : 'Not Installed'}
                </span>
              </div>
              {systemInfo?.steamCmdPath && (
                <div className="text-xs text-base-content/70 mt-1">
                  {systemInfo.steamCmdPath}
                </div>
              )}
            </div>
            
            {/* System Info */}
            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base-content">System</h3>
                <span className="text-2xl">⚙️</span>
              </div>
              <div className="space-y-1 text-xs">
                <div>Platform: {systemInfo?.platform}</div>
                <div>CPU Cores: {systemInfo?.cpuCores}</div>
                <div>Node: {systemInfo?.nodeVersion}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation & Setup */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Installation & Setup</h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={initializeSystem}
              disabled={installing}
              className="btn btn-primary w-full"
            >
              {installing ? <span className="loading loading-spinner loading-sm"></span> : '🚀'}
              Initialize System
            </button>
            
            <button
              onClick={installSteamCmd}
              disabled={installing || systemInfo?.steamCmdInstalled}
              className="btn btn-secondary w-full"
            >
              {installing ? <span className="loading loading-spinner loading-sm"></span> : '🎮'}
              Install SteamCMD
            </button>
            
            <button
              onClick={loadSystemInfo}
              disabled={installing}
              className="btn btn-outline w-full"
            >
              🔄 Refresh Status
            </button>
          </div>

          <div className="divider"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setShowGlobalConfigManager(true)}
              className="btn btn-accent w-full"
            >
              ⚙️ Global Configs
            </button>
            
            <button
              onClick={() => setShowGlobalModManager(true)}
              className="btn btn-info w-full"
            >
              🎮 Global Mods
            </button>
            
            <button
              onClick={() => {/* TODO: Add other management tools */}}
              className="btn btn-warning w-full"
            >
              🔧 Manage Tools
            </button>
          </div>
        </div>

        {/* Existing Clusters */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Existing Clusters</h2>
          
          {clusters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <h3 className="text-xl font-semibold mb-2">No Clusters Found</h3>
              <p className="text-base-content/70 mb-4">
                Create your first cluster to get started with ASA server management.
              </p>
              {!systemInfo?.steamCmdInstalled && (
                <div className="alert alert-warning mb-4 max-w-md mx-auto">
                  <div>
                    <div className="font-semibold">SteamCMD Required</div>
                    <div className="text-sm">
                      SteamCMD is needed to download ASA server files. 
                      Click "Install SteamCMD" above to get started.
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowWizard(true)}
                className="btn btn-primary"
                disabled={!systemInfo?.steamCmdInstalled}
              >
                Create Your First Cluster
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clusters.map((cluster) => (
                <div key={cluster.name} className="bg-base-300 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-primary">{cluster.name}</h3>
                    <div className="dropdown dropdown-end">
                      <button className="btn btn-sm btn-error">
                        🗑️
                      </button>
                      <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <button onClick={() => deleteCluster(cluster.name)}>
                            Delete Cluster
                          </button>
                        </li>
                        <li>
                          <button onClick={() => deleteCluster(cluster.name, true)}>
                            Force Delete (Corrupted)
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Description:</span> {cluster.config.description || 'No description'}</div>
                    <div><span className="font-semibold">Servers:</span> {cluster.config.serverCount || 0}</div>
                    <div><span className="font-semibold">Base Port:</span> {cluster.config.basePort || 'Unknown'}</div>
                    <div><span className="font-semibold">Created:</span> {new Date(cluster.created).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-base-content/20">
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-primary flex-1">Start Cluster</button>
                      <button className="btn btn-sm btn-outline flex-1">Manage</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cluster Creation Wizard Modal */}
      {showWizard && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Create New Cluster</h2>
              <button
                onClick={() => setShowWizard(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            
            {/* Progress indicator */}
            <div className="mb-6">
              <ul className="steps steps-horizontal w-full">
                <li className={`step ${currentStep !== 'welcome' ? 'step-primary' : ''}`}>Welcome</li>
                <li className={`step ${['cluster-basic', 'map-selection', 'server-config', 'game-settings', 'review', 'creating'].includes(currentStep) ? 'step-primary' : ''}`}>Basic Info</li>
                <li className={`step ${['map-selection', 'server-config', 'game-settings', 'review', 'creating'].includes(currentStep) ? 'step-primary' : ''}`}>Map Selection</li>
                <li className={`step ${['server-config', 'game-settings', 'review', 'creating'].includes(currentStep) ? 'step-primary' : ''}`}>Server Config</li>
                <li className={`step ${['game-settings', 'review', 'creating'].includes(currentStep) ? 'step-primary' : ''}`}>Game Settings</li>
                <li className={`step ${['review', 'creating'].includes(currentStep) ? 'step-primary' : ''}`}>Review</li>
              </ul>
            </div>
            
            {/* Step content */}
            <div className="mb-6">
              {renderWizardStep()}
            </div>
            
            {/* Navigation buttons */}
            {currentStep !== 'creating' && (
              <div className="modal-action">
                {currentStep !== 'welcome' && (
                  <button
                    onClick={prevStep}
                    className="btn btn-outline"
                    disabled={installing}
                  >
                    ← Previous
                  </button>
                )}
                
                {currentStep === 'review' ? (
                  <button
                    onClick={createCluster}
                    className="btn btn-primary"
                    disabled={installing || !wizardData.clusterName.trim()}
                  >
                    {installing ? <span className="loading loading-spinner loading-sm"></span> : '🚀'}
                    Create Cluster
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="btn btn-primary"
                    disabled={
                      installing ||
                      (currentStep === 'cluster-basic' && !wizardData.clusterName.trim()) ||
                      (currentStep === 'map-selection' && wizardData.selectedMaps.length === 0)
                    }
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Config Manager Modal */}
      {showGlobalConfigManager && (
        <GlobalConfigManager onClose={() => setShowGlobalConfigManager(false)} />
      )}

      {/* Global Mod Manager Modal */}
      {showGlobalModManager && (
        <GlobalModManager onClose={() => setShowGlobalModManager(false)} />
      )}
    </div>
  );
};

export default ServerProvisioner; 