import React from 'react';
import type { StepProps } from '../../types/provisioning';

const IndividualServersStep: React.FC<StepProps> = ({ wizardData, setWizardData, generateServers }) => {
  const servers = generateServers();
  
  const updateServerConfig = (index: number, field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      serverConfigs: prev.serverConfigs.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    }));
  };

  const initializeServerConfigs = () => {
    if (wizardData.serverConfigs.length === 0) {
      const basePort = wizardData.basePort || 7777;
      const portAllocationMode = wizardData.portAllocationMode || 'sequential';
      
      const configs = servers.map((server, index) => {
        // Calculate ports based on wizard settings
        let gamePort, queryPort, rconPort;
        
        if (portAllocationMode === 'even') {
          // Even allocation: basePort, basePort+2, basePort+4, etc.
          gamePort = basePort + (index * 2);
          queryPort = basePort + (index * 2) + 1;
          rconPort = basePort + (index * 2) + 2;
        } else {
          // Sequential allocation: basePort, basePort+3, basePort+6, etc.
          gamePort = basePort + (index * 3);
          queryPort = basePort + (index * 3) + 1;
          rconPort = basePort + (index * 3) + 2;
        }
        
        return {
          name: server.name,
          map: server.map,
          gamePort: gamePort,
          queryPort: queryPort,
          rconPort: rconPort,
          maxPlayers: server.maxPlayers,
          adminPassword: server.adminPassword || wizardData.adminPassword,
          serverPassword: server.serverPassword || wizardData.serverPassword,
          sessionName: server.sessionName || server.name,
          customSettings: {}
        };
      });
      
      setWizardData(prev => ({
        ...prev,
        serverConfigs: configs
      }));
    }
  };

  // Initialize server configs if not already done
  React.useEffect(() => {
    initializeServerConfigs();
  }, [servers]); // Re-initialize when servers change

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Individual Server Configuration</h2>
        <p className="text-base-content/70 text-lg">
          Customize each server's settings individually. You can modify server names, ports, and other settings.
        </p>
      </div>

      {/* Information Box */}
      <div className="bg-base-200 rounded-lg p-4 border-l-4 border-primary">
        <div className="flex items-start space-x-3">
          <div className="text-primary text-xl">ℹ️</div>
          <div>
            <h4 className="font-semibold mb-2">Server Name vs Session Name</h4>
            <div className="text-sm space-y-1">
              <p><strong>Server Name:</strong> Internal identifier for management (not visible to players)</p>
              <p><strong>Session Name:</strong> Public name shown in server browser (visible to all players)</p>
              <p className="text-base-content/70">Use server names for organization and session names to attract players!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {wizardData.serverConfigs.map((serverConfig, index) => (
          <div key={index} className="bg-base-300 rounded-lg p-6 border border-base-content/20">
            <h3 className="text-lg font-semibold mb-4 text-primary">Server {index + 1}: {serverConfig.map}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Server Name</span>
                  <div className="tooltip tooltip-right" data-tip="Internal name used for server management. Not visible to players. Use format: ClusterName-MapName-Number">
                    <span className="label-text-alt cursor-help">ℹ️</span>
                  </div>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={serverConfig.name}
                  onChange={(e) => updateServerConfig(index, 'name', e.target.value)}
                  placeholder="Server name"
                />
                <label className="label">
                  <span className="label-text-alt">Example: MyCluster-TheIsland-1</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Session Name</span>
                  <div className="tooltip tooltip-right" data-tip="Public name visible to players in server browser. Use descriptive names with tags like [PvE], [PvP], [Modded]">
                    <span className="label-text-alt cursor-help">ℹ️</span>
                  </div>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={serverConfig.sessionName}
                  onChange={(e) => updateServerConfig(index, 'sessionName', e.target.value)}
                  placeholder="Session name"
                />
                <label className="label">
                  <span className="label-text-alt">Example: [PvE] My Awesome Island Server</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Max Players</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={serverConfig.maxPlayers}
                  onChange={(e) => updateServerConfig(index, 'maxPlayers', parseInt(e.target.value) || 70)}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Game Port</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={serverConfig.gamePort}
                  onChange={(e) => updateServerConfig(index, 'gamePort', parseInt(e.target.value) || 7777)}
                  min="1"
                  max="65535"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Query Port</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={serverConfig.queryPort}
                  onChange={(e) => updateServerConfig(index, 'queryPort', parseInt(e.target.value) || 27015)}
                  min="1"
                  max="65535"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">RCON Port</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={serverConfig.rconPort}
                  onChange={(e) => updateServerConfig(index, 'rconPort', parseInt(e.target.value) || 32330)}
                  min="1"
                  max="65535"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Admin Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={serverConfig.adminPassword}
                  onChange={(e) => updateServerConfig(index, 'adminPassword', e.target.value)}
                  placeholder="Admin password"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Server Password (Optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={serverConfig.serverPassword}
                  onChange={(e) => updateServerConfig(index, 'serverPassword', e.target.value)}
                  placeholder="Leave empty for no password"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-base-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              const basePort = wizardData.basePort || 7777;
              const portAllocationMode = wizardData.portAllocationMode || 'sequential';
              
              setWizardData(prev => ({
                ...prev,
                serverConfigs: prev.serverConfigs.map((config, index) => {
                  let gamePort, queryPort, rconPort;
                  
                  if (portAllocationMode === 'even') {
                    // Even allocation: basePort, basePort+2, basePort+4, etc.
                    gamePort = basePort + (index * 2);
                    queryPort = basePort + (index * 2) + 1;
                    rconPort = basePort + (index * 2) + 2;
                  } else {
                    // Sequential allocation: basePort, basePort+3, basePort+6, etc.
                    gamePort = basePort + (index * 3);
                    queryPort = basePort + (index * 3) + 1;
                    rconPort = basePort + (index * 3) + 2;
                  }
                  
                  return {
                    ...config,
                    gamePort: gamePort,
                    queryPort: queryPort,
                    rconPort: rconPort
                  };
                })
              }));
            }}
          >
            Auto-assign Ports
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              setWizardData(prev => ({
                ...prev,
                serverConfigs: prev.serverConfigs.map(config => ({
                  ...config,
                  adminPassword: wizardData.adminPassword,
                  serverPassword: wizardData.serverPassword
                }))
              }));
            }}
          >
            Apply Global Passwords
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndividualServersStep; 