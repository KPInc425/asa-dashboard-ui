import React from 'react';
import type { StepProps, WizardStep } from '../../types/provisioning';

// Shared port assignment logic
const getServerPorts = (wizardData: any, index: number) => {
  const basePort = wizardData.basePort || 7777;
  const baseQueryPort = wizardData.portConfiguration?.queryPortBase || 27015;
  const baseRconPort = wizardData.portConfiguration?.rconPortBase || 32330;
  if (wizardData.portAllocationMode === 'even') {
    return {
      gamePort: basePort + (index * 6),
      queryPort: basePort + (index * 6) + 2,
      rconPort: basePort + (index * 6) + 4,
    };
  } else {
    return {
      gamePort: basePort + index,
      queryPort: baseQueryPort + index,
      rconPort: baseRconPort + index,
    };
  }
};

const IndividualServersStep: React.FC<StepProps & { setCurrentStep?: (step: WizardStep) => void }> = ({ wizardData, setWizardData, generateServers, setCurrentStep }) => {
  const servers = generateServers();
  const [activeTab, setActiveTab] = React.useState(0);

  // Update a single server config field
  const updateServerConfig = (index: number, field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      serverConfigs: prev.serverConfigs.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    }));
  };

  // Initialize server configs with correct port logic
  const initializeServerConfigs = () => {
    if (wizardData.serverConfigs.length === 0) {
      const configs = servers.map((server, index) => {
        const ports = getServerPorts(wizardData, index);
        return {
          name: server.name,
          map: server.map,
          gamePort: ports.gamePort,
          queryPort: ports.queryPort,
          rconPort: ports.rconPort,
          maxPlayers: server.maxPlayers,
          adminPassword: server.adminPassword || wizardData.adminPassword,
          serverPassword: server.serverPassword || wizardData.serverPassword,
          sessionName: server.sessionName || server.name,
          customSettings: {}
        };
      });
      setWizardData(prev => ({ ...prev, serverConfigs: configs }));
    }
  };

  // Re-initialize when servers change
  React.useEffect(() => {
    initializeServerConfigs();
  }, [servers]);

  // Tab UI for each server
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Individual Server Configuration</h2>
        <p className="text-base-content/70 text-lg">
          Customize each server's settings individually. You can modify server names, ports, and other settings.
        </p>
      </div>

      {/* Tab bar for servers */}
      <div className="tabs tabs-boxed mb-4 flex flex-wrap">
        {wizardData.serverConfigs.map((serverConfig, idx) => (
          <button
            key={idx}
            className={`tab ${activeTab === idx ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {serverConfig.name || `Server ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Only show the active server config */}
      {wizardData.serverConfigs[activeTab] && (
        <div className="bg-base-300 rounded-lg p-6 border border-base-content/20">
          <h3 className="text-lg font-semibold mb-4 text-primary">
            Server {activeTab + 1}: {wizardData.serverConfigs[activeTab].map}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Server Name */}
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
                value={wizardData.serverConfigs[activeTab].name}
                onChange={(e) => updateServerConfig(activeTab, 'name', e.target.value)}
                placeholder="Server name"
              />
              <label className="label">
                <span className="label-text-alt">Example: MyCluster-TheIsland-1</span>
              </label>
            </div>
            {/* Session Name */}
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
                value={wizardData.serverConfigs[activeTab].sessionName}
                onChange={(e) => updateServerConfig(activeTab, 'sessionName', e.target.value)}
                placeholder="Session name"
              />
              <label className="label">
                <span className="label-text-alt">Example: [PvE] My Awesome Island Server</span>
              </label>
            </div>
            {/* Max Players */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Max Players</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].maxPlayers}
                onChange={(e) => updateServerConfig(activeTab, 'maxPlayers', parseInt(e.target.value) || 70)}
                min="1"
                max="100"
              />
            </div>
            {/* Game Port */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Game Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].gamePort}
                onChange={(e) => updateServerConfig(activeTab, 'gamePort', parseInt(e.target.value) || 7777)}
                min="1"
                max="65535"
              />
            </div>
            {/* Query Port */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Query Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].queryPort}
                onChange={(e) => updateServerConfig(activeTab, 'queryPort', parseInt(e.target.value) || 27015)}
                min="1"
                max="65535"
              />
            </div>
            {/* RCON Port */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">RCON Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].rconPort}
                onChange={(e) => updateServerConfig(activeTab, 'rconPort', parseInt(e.target.value) || 32330)}
                min="1"
                max="65535"
              />
            </div>
            {/* Admin Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Admin Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].adminPassword}
                onChange={(e) => updateServerConfig(activeTab, 'adminPassword', e.target.value)}
                placeholder="Admin password"
              />
            </div>
            {/* Server Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Server Password (Optional)</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={wizardData.serverConfigs[activeTab].serverPassword}
                onChange={(e) => updateServerConfig(activeTab, 'serverPassword', e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-base-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              setWizardData(prev => ({
                ...prev,
                serverConfigs: prev.serverConfigs.map((config, index) => {
                  const ports = getServerPorts(wizardData, index);
                  return {
                    ...config,
                    gamePort: ports.gamePort,
                    queryPort: ports.queryPort,
                    rconPort: ports.rconPort
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
      {setCurrentStep && (
        <button className="btn btn-outline mt-6" onClick={() => setCurrentStep('review')}>
          Back to Review
        </button>
      )}
    </div>
  );
};

export default IndividualServersStep; 