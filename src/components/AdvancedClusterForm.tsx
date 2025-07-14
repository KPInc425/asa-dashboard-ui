import React, { useState } from 'react';

interface ServerConfig {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  password: string;
  adminPassword: string;
  mods: string[];
  customSettings?: any;
}

interface MapSelection {
  map: string;
  count: number;
  enabled: boolean;
}

interface ClusterForm {
  name: string;
  description: string;
  basePort: number;
  serverCount: number;
  selectedMaps: MapSelection[];
  globalSettings: {
    gameUserSettings: {
      ServerSettings: any;
      MultiHome: any;
      SessionSettings: any;
    };
    gameIni: {
      ServerSettings: any;
    };
  };
  globalMods: string[];
  servers: ServerConfig[];
  clusterSettings: {
    clusterId: string;
    clusterName: string;
    clusterDescription: string;
    clusterPassword: string;
    clusterOwner: string;
  };
  portConfiguration: {
    basePort: number;
    portIncrement: number;
    queryPortBase: number;
    queryPortIncrement: number;
    rconPortBase: number;
    rconPortIncrement: number;
  };
  autoStart: boolean;
}

interface AdvancedClusterFormProps {
  onSubmit: (config: ClusterForm) => void;
  onCancel: () => void;
  loading: boolean;
}

const AVAILABLE_MAPS = [
  'TheIsland',
  'ScorchedEarth',
  'Aberration',
  'Extinction',
  'Genesis',
  'Genesis2',
  'LostIsland',
  'Fjordur',
  'CrystalIsles',
  'Ragnarok',
  'Valguero'
];

const POPULAR_MODS = [
  { id: '111111111', name: 'Structures Plus (S+)' },
  { id: '880871931', name: 'Super Structures' },
  { id: '731604991', name: 'StackMeMore' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' }
];

const AdvancedClusterForm: React.FC<AdvancedClusterFormProps> = ({
  onSubmit,
  onCancel,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<ClusterForm>({
    name: '',
    description: '',
    basePort: 7777,
    serverCount: 1,
    selectedMaps: AVAILABLE_MAPS.map(map => ({
      map,
      count: 1,
      enabled: false
    })),
    globalSettings: {
      gameUserSettings: {
        ServerSettings: {
          MaxPlayers: 70,
          DifficultyOffset: 1.0,
          HarvestAmountMultiplier: 2.0,
          TamingSpeedMultiplier: 3.0,
          MatingIntervalMultiplier: 0.5,
          EggHatchSpeedMultiplier: 10.0,
          BabyMatureSpeedMultiplier: 20.0,
          DayCycleSpeedScale: 1.0,
          DayTimeSpeedScale: 1.0,
          NightTimeSpeedScale: 1.0,
          DinoDamageMultiplier: 1.0,
          PlayerDamageMultiplier: 1.0,
          StructureDamageMultiplier: 1.0,
          PlayerResistanceMultiplier: 1.0,
          DinoResistanceMultiplier: 1.0,
          StructureResistanceMultiplier: 1.0,
          XPMultiplier: 2.0,
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
          SessionName: "",
          ServerPassword: "",
          ServerAdminPassword: "admin123",
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
    globalMods: [],
    servers: [],
    clusterSettings: {
      clusterId: '',
      clusterName: '',
      clusterDescription: '',
      clusterPassword: '',
      clusterOwner: 'Admin'
    },
    portConfiguration: {
      basePort: 7777,
      portIncrement: 1,
      queryPortBase: 27015,
      queryPortIncrement: 1,
      rconPortBase: 32330,
      rconPortIncrement: 1
    },
    autoStart: false
  });

  const updateForm = (updates: Partial<ClusterForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateGlobalSetting = (section: keyof typeof form.globalSettings, subsection: string, key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        [section]: {
          ...prev.globalSettings[section],
          [subsection]: {
            ...prev.globalSettings[section][subsection as keyof typeof prev.globalSettings[typeof section]],
            [key]: value
          }
        }
      }
    }));
  };

  const updateMapSelection = (mapName: string, updates: Partial<MapSelection>) => {
    setForm(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.map(map => 
        map.map === mapName ? { ...map, ...updates } : map
      )
    }));
  };

  const addGlobalMod = (modId: string) => {
    if (!form.globalMods.includes(modId)) {
      setForm(prev => ({
        ...prev,
        globalMods: [...prev.globalMods, modId]
      }));
    }
  };

  const removeGlobalMod = (modId: string) => {
    setForm(prev => ({
      ...prev,
      globalMods: prev.globalMods.filter(id => id !== modId)
    }));
  };

  const addServerMod = (serverIndex: number, modId: string) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) => 
        i === serverIndex 
          ? { ...server, mods: [...server.mods, modId] }
          : server
      )
    }));
  };

  const removeServerMod = (serverIndex: number, modId: string) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) => 
        i === serverIndex 
          ? { ...server, mods: server.mods.filter(id => id !== modId) }
          : server
      )
    }));
  };

  const generateServers = () => {
    const servers: ServerConfig[] = [];
    let portIndex = 0;

    // Generate servers based on selected maps
    form.selectedMaps.forEach(mapSelection => {
      if (mapSelection.enabled) {
        for (let i = 0; i < mapSelection.count; i++) {
          const serverName = `${form.name}-${mapSelection.map}${mapSelection.count > 1 ? `-${i + 1}` : ''}`;
          const serverPort = form.portConfiguration.basePort + (portIndex * form.portConfiguration.portIncrement);
          const queryPort = form.portConfiguration.queryPortBase + (portIndex * form.portConfiguration.queryPortIncrement);
          const rconPort = form.portConfiguration.rconPortBase + (portIndex * form.portConfiguration.rconPortIncrement);
          
          servers.push({
            name: serverName,
            map: mapSelection.map,
            gamePort: serverPort,
            queryPort: queryPort,
            rconPort: rconPort,
            maxPlayers: form.globalSettings.gameUserSettings.ServerSettings.MaxPlayers,
            password: form.globalSettings.gameUserSettings.SessionSettings.ServerPassword,
            adminPassword: form.globalSettings.gameUserSettings.SessionSettings.ServerAdminPassword,
            mods: [...form.globalMods] // Start with global mods
          });
          
          portIndex++;
        }
      }
    });

    updateForm({ servers });
  };

  const updateServer = (index: number, updates: Partial<ServerConfig>) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) => 
        i === index ? { ...server, ...updates } : server
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.servers.length === 0) {
      generateServers();
    }
    onSubmit(form);
  };

  const getTotalServerCount = () => {
    return form.selectedMaps.reduce((total, map) => 
      total + (map.enabled ? map.count : 0), 0
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create ARK Cluster</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Settings' },
            { id: 'maps', label: 'Map Selection' },
            { id: 'mods', label: 'Mod Management' },
            { id: 'servers', label: 'Server Configuration' },
            { id: 'ports', label: 'Port Configuration' },
            { id: 'settings', label: 'Game Settings' },
            { id: 'cluster', label: 'Cluster Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Settings Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cluster Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="MyARKCluster"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Description of your ARK cluster"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Servers: {getTotalServerCount()}
                </label>
                <p className="text-sm text-gray-500">Configure maps in the Map Selection tab</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auto Start Servers
                </label>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={form.autoStart}
                      onChange={(e) => updateForm({ autoStart: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Start servers after creation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Selection Tab */}
        {activeTab === 'maps' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Map Selection</h3>
              <div className="text-sm text-gray-600">
                Total Servers: {getTotalServerCount()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {form.selectedMaps.map((mapSelection) => (
                <div key={mapSelection.map} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mapSelection.enabled}
                        onChange={(e) => updateMapSelection(mapSelection.map, { enabled: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 font-medium">{mapSelection.map}</span>
                    </label>
                  </div>
                  
                  {mapSelection.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Servers
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={mapSelection.count}
                        onChange={(e) => updateMapSelection(mapSelection.map, { count: parseInt(e.target.value) })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={generateServers}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Generate Servers
              </button>
              <div className="text-sm text-gray-600">
                {getTotalServerCount()} servers will be created
              </div>
            </div>
          </div>
        )}

        {/* Mod Management Tab */}
        {activeTab === 'mods' && (
          <div className="space-y-6">
            {/* Global Mods */}
            <div>
              <h3 className="text-lg font-medium mb-4">Global Mods (Applied to all servers)</h3>
              <div className="space-y-3">
                {POPULAR_MODS.map(mod => (
                  <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">{mod.name}</div>
                      <div className="text-sm text-gray-500">ID: {mod.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addGlobalMod(mod.id)}
                      disabled={form.globalMods.includes(mod.id)}
                      className={`px-3 py-1 rounded text-sm ${
                        form.globalMods.includes(mod.id)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {form.globalMods.includes(mod.id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
              
              {form.globalMods.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Selected Global Mods:</h4>
                  <div className="space-y-2">
                    {form.globalMods.map(modId => {
                      const mod = POPULAR_MODS.find(m => m.id === modId);
                      return (
                        <div key={modId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{mod?.name || modId}</span>
                          <button
                            type="button"
                            onClick={() => removeGlobalMod(modId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Mod Input */}
            <div>
              <h3 className="text-lg font-medium mb-4">Add Custom Mod</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Steam Workshop Mod ID"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        addGlobalMod(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addGlobalMod(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Server Configuration Tab */}
        {activeTab === 'servers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Server Configuration</h3>
              <button
                type="button"
                onClick={generateServers}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Regenerate Servers
              </button>
            </div>
            
            {form.servers.length > 0 ? (
              <div className="space-y-4">
                {form.servers.map((server, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-3">{server.name}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Map</label>
                        <select
                          value={server.map}
                          onChange={(e) => updateServer(index, { map: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          {AVAILABLE_MAPS.map(map => (
                            <option key={map} value={map}>{map}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Players</label>
                        <input
                          type="number"
                          value={server.maxPlayers}
                          onChange={(e) => updateServer(index, { maxPlayers: parseInt(e.target.value) })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="text"
                          value={server.password}
                          onChange={(e) => updateServer(index, { password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Leave empty for no password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                        <input
                          type="text"
                          value={server.adminPassword}
                          onChange={(e) => updateServer(index, { adminPassword: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* Server-specific mods */}
                    <div>
                      <h5 className="font-medium mb-2">Server-specific Mods</h5>
                      <div className="space-y-2">
                        {POPULAR_MODS.map(mod => (
                          <div key={mod.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{mod.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (server.mods.includes(mod.id)) {
                                  removeServerMod(index, mod.id);
                                } else {
                                  addServerMod(index, mod.id);
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs ${
                                server.mods.includes(mod.id)
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {server.mods.includes(mod.id) ? 'Remove' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {server.mods.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Current mods: </span>
                          <span className="text-sm text-gray-600">
                            {server.mods.map(modId => {
                              const mod = POPULAR_MODS.find(m => m.id === modId);
                              return mod?.name || modId;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Configure maps in the Map Selection tab and click "Generate Servers"
              </div>
            )}
          </div>
        )}

        {/* Port Configuration Tab */}
        {activeTab === 'ports' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Port Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Port</label>
                <input
                  type="number"
                  value={form.portConfiguration.basePort}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      basePort: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">First server port (default: 7777)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Port Increment</label>
                <input
                  type="number"
                  value={form.portConfiguration.portIncrement}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      portIncrement: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Port increment between servers</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Query Port Base</label>
                <input
                  type="number"
                  value={form.portConfiguration.queryPortBase}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      queryPortBase: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">First query port (default: 27015)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Query Port Increment</label>
                <input
                  type="number"
                  value={form.portConfiguration.queryPortIncrement}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      queryPortIncrement: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Query port increment between servers</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">RCON Port Base</label>
                <input
                  type="number"
                  value={form.portConfiguration.rconPortBase}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      rconPortBase: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">First RCON port (default: 32330)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">RCON Port Increment</label>
                <input
                  type="number"
                  value={form.portConfiguration.rconPortIncrement}
                  onChange={(e) => updateForm({
                    portConfiguration: {
                      ...form.portConfiguration,
                      rconPortIncrement: parseInt(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">RCON port increment between servers</p>
              </div>
            </div>

            {form.servers.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Port Preview:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {form.servers.map((server, index) => (
                    <div key={index} className="text-sm">
                      {server.name}: Port {server.gamePort}, Query {server.queryPort}, RCON {server.rconPort}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Game Settings</h3>
            
            {/* Server Settings */}
            <div>
              <h4 className="font-medium mb-3">Server Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Players</label>
                  <input
                    type="number"
                    value={form.globalSettings.gameUserSettings.ServerSettings.MaxPlayers}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'MaxPlayers', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty Offset</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.globalSettings.gameUserSettings.ServerSettings.DifficultyOffset}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'DifficultyOffset', parseFloat(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harvest Amount Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.globalSettings.gameUserSettings.ServerSettings.HarvestAmountMultiplier}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'HarvestAmountMultiplier', parseFloat(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taming Speed Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.globalSettings.gameUserSettings.ServerSettings.TamingSpeedMultiplier}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'TamingSpeedMultiplier', parseFloat(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">XP Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.globalSettings.gameUserSettings.ServerSettings.XPMultiplier}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'XPMultiplier', parseFloat(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Baby Mature Speed Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.globalSettings.gameUserSettings.ServerSettings.BabyMatureSpeedMultiplier}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'BabyMatureSpeedMultiplier', parseFloat(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Session Settings */}
            <div>
              <h4 className="font-medium mb-3">Session Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Name</label>
                  <input
                    type="text"
                    value={form.globalSettings.gameUserSettings.SessionSettings.SessionName}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'SessionName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Server Password</label>
                  <input
                    type="text"
                    value={form.globalSettings.gameUserSettings.SessionSettings.ServerPassword}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'ServerPassword', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Leave empty for no password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                  <input
                    type="text"
                    value={form.globalSettings.gameUserSettings.SessionSettings.ServerAdminPassword}
                    onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'ServerAdminPassword', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cluster Settings Tab */}
        {activeTab === 'cluster' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cluster Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cluster ID</label>
                <input
                  type="text"
                  value={form.clusterSettings.clusterId}
                  onChange={(e) => updateForm({
                    clusterSettings: {
                      ...form.clusterSettings,
                      clusterId: e.target.value
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="mycluster"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cluster Name</label>
                <input
                  type="text"
                  value={form.clusterSettings.clusterName}
                  onChange={(e) => updateForm({
                    clusterSettings: {
                      ...form.clusterSettings,
                      clusterName: e.target.value
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="My ARK Cluster"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cluster Password</label>
                <input
                  type="text"
                  value={form.clusterSettings.clusterPassword}
                  onChange={(e) => updateForm({
                    clusterSettings: {
                      ...form.clusterSettings,
                      clusterPassword: e.target.value
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Leave empty for no password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cluster Owner</label>
                <input
                  type="text"
                  value={form.clusterSettings.clusterOwner}
                  onChange={(e) => updateForm({
                    clusterSettings: {
                      ...form.clusterSettings,
                      clusterOwner: e.target.value
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Admin"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Cluster Description</label>
              <textarea
                value={form.clusterSettings.clusterDescription}
                onChange={(e) => updateForm({
                  clusterSettings: {
                    ...form.clusterSettings,
                    clusterDescription: e.target.value
                  }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Description of your ARK cluster"
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || getTotalServerCount() === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Cluster'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvancedClusterForm; 