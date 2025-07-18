import React from 'react';
import type { StepProps } from '../../types/provisioning';

const POPULAR_MODS = [
  { id: '111111111', name: 'Structures Plus (S+)' },
  { id: '880871931', name: 'Super Structures' },
  { id: '731604991', name: 'StackMeMore' },
  { id: '1404697612', name: 'Dino Storage v2' },
  { id: '1565015734', name: 'Awesome SpyGlass!' },
  { id: '1005639', name: 'Club ARK' }
];

const ModsStep: React.FC<StepProps> = ({ wizardData, setWizardData, generateServers }) => {
  const servers = generateServers();
  
  const addGlobalMod = (modId: string) => {
    if (!wizardData.globalMods.includes(modId)) {
      setWizardData(prev => ({
        ...prev,
        globalMods: [...prev.globalMods, modId]
      }));
    }
  };

  const removeGlobalMod = (modId: string) => {
    setWizardData(prev => ({
      ...prev,
      globalMods: prev.globalMods.filter(id => id !== modId)
    }));
  };

  const addServerMod = (serverName: string, modId: string) => {
    setWizardData(prev => ({
      ...prev,
      serverMods: {
        ...prev.serverMods,
        [serverName]: {
          additionalMods: [...(prev.serverMods[serverName]?.additionalMods || []), modId],
          excludeSharedMods: prev.serverMods[serverName]?.excludeSharedMods || false
        }
      }
    }));
  };

  const removeServerMod = (serverName: string, modId: string) => {
    setWizardData(prev => ({
      ...prev,
      serverMods: {
        ...prev.serverMods,
        [serverName]: {
          additionalMods: (prev.serverMods[serverName]?.additionalMods || []).filter(id => id !== modId),
          excludeSharedMods: prev.serverMods[serverName]?.excludeSharedMods || false
        }
      }
    }));
  };

  const toggleExcludeSharedMods = (serverName: string) => {
    setWizardData(prev => ({
      ...prev,
      serverMods: {
        ...prev.serverMods,
        [serverName]: {
          additionalMods: prev.serverMods[serverName]?.additionalMods || [],
          excludeSharedMods: !(prev.serverMods[serverName]?.excludeSharedMods || false)
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Mod Configuration</h2>
        <p className="text-base-content/70 text-lg">
          Configure mods for your cluster. Global mods apply to all servers, while server-specific mods can be added individually.
        </p>
      </div>

      {/* Global Mods Section */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Global Mods</h3>
        <p className="text-base-content/70 mb-4">
          These mods will be applied to all servers in the cluster (unless excluded).
        </p>

        {/* Popular Mods */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Popular Mods</h4>
          <div className="flex flex-wrap gap-2">
            {POPULAR_MODS.map(mod => (
              <button
                key={mod.id}
                className={`btn btn-sm ${wizardData.globalMods.includes(mod.id) ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  if (wizardData.globalMods.includes(mod.id)) {
                    removeGlobalMod(mod.id);
                  } else {
                    addGlobalMod(mod.id);
                  }
                }}
              >
                {mod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Mod Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Add Custom Mod</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Enter mod ID (e.g., 123456789)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  const modId = input.value.trim();
                  if (modId && /^\d+$/.test(modId)) {
                    addGlobalMod(modId);
                    input.value = '';
                  }
                }
              }}
            />
            <button
              className="btn btn-primary"
              onClick={(e) => {
                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                const modId = input.value.trim();
                if (modId && /^\d+$/.test(modId)) {
                  addGlobalMod(modId);
                  input.value = '';
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Current Global Mods */}
        {wizardData.globalMods.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Current Global Mods</h4>
            <div className="flex flex-wrap gap-2">
              {wizardData.globalMods.map(modId => (
                <div key={modId} className="badge badge-primary gap-2">
                  {modId}
                  <button
                    className="btn btn-xs btn-circle btn-ghost"
                    onClick={() => removeGlobalMod(modId)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Individual Server Mods */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Individual Server Mods</h3>
        <p className="text-base-content/70 mb-4">
          Configure mods for specific servers. These are in addition to global mods.
        </p>

        <div className="space-y-4">
          {servers.map((server, index) => (
            <div key={index} className="border border-base-content/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{server.name}</h4>
                <div className="flex items-center gap-2">
                  <label className="label cursor-pointer">
                    <span className="label-text mr-2">Exclude Global Mods</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={wizardData.serverMods[server.name]?.excludeSharedMods || false}
                      onChange={() => toggleExcludeSharedMods(server.name)}
                    />
                  </label>
                </div>
              </div>

              {/* Popular Mods for this server */}
              <div className="mb-3">
                <h5 className="font-medium mb-2">Quick Add Popular Mods</h5>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_MODS.map(mod => (
                    <button
                      key={mod.id}
                      className={`btn btn-xs ${(wizardData.serverMods[server.name]?.additionalMods || []).includes(mod.id) ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        const currentMods = wizardData.serverMods[server.name]?.additionalMods || [];
                        if (currentMods.includes(mod.id)) {
                          removeServerMod(server.name, mod.id);
                        } else {
                          addServerMod(server.name, mod.id);
                        }
                      }}
                    >
                      {mod.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Server Mods */}
              {(wizardData.serverMods[server.name]?.additionalMods || []).length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Server-Specific Mods</h5>
                  <div className="flex flex-wrap gap-2">
                    {(wizardData.serverMods[server.name]?.additionalMods || []).map(modId => (
                      <div key={modId} className="badge badge-secondary gap-2">
                        {modId}
                        <button
                          className="btn btn-xs btn-circle btn-ghost"
                          onClick={() => removeServerMod(server.name, modId)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Mod Input for this server */}
              <div className="form-control mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Add custom mod ID"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const modId = input.value.trim();
                        if (modId && /^\d+$/.test(modId)) {
                          addServerMod(server.name, modId);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      const modId = input.value.trim();
                      if (modId && /^\d+$/.test(modId)) {
                        addServerMod(server.name, modId);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mod Information */}
      <div className="bg-base-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Mod Information</h4>
        <ul className="text-sm space-y-1">
          <li>• Global mods apply to all servers unless excluded</li>
          <li>• Server-specific mods are added in addition to global mods</li>
          <li>• Use "Exclude Global Mods" for servers that need different mod setups</li>
          <li>• Club ARK servers automatically exclude global mods and add the Club ARK mod</li>
        </ul>
      </div>
    </div>
  );
};

export default ModsStep; 