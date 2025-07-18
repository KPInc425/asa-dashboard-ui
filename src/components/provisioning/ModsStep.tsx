import React, { useState } from 'react';
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

  // State for global mod input
  const [globalModInput, setGlobalModInput] = useState('');
  // State for server mod inputs (per server)
  const [serverModInputs, setServerModInputs] = useState<Record<string, string>>({});

  const addGlobalMod = (modId: string) => {
    if (!wizardData.globalMods.includes(modId)) {
      setWizardData(prev => ({
        ...prev,
        globalMods: [...prev.globalMods, modId]
      }));
    }
  };

  const addMultipleGlobalMods = (modString: string) => {
    const ids = modString.split(',').map(s => s.trim()).filter(Boolean);
    const uniqueIds = ids.filter(id => !wizardData.globalMods.includes(id));
    if (uniqueIds.length > 0) {
      setWizardData(prev => ({
        ...prev,
        globalMods: [...prev.globalMods, ...uniqueIds]
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

  const addMultipleServerMods = (serverName: string, modString: string) => {
    const ids = modString.split(',').map(s => s.trim()).filter(Boolean);
    const currentMods = wizardData.serverMods[serverName]?.additionalMods || [];
    const uniqueIds = ids.filter(id => !currentMods.includes(id));
    if (uniqueIds.length > 0) {
      setWizardData(prev => ({
        ...prev,
        serverMods: {
          ...prev.serverMods,
          [serverName]: {
            additionalMods: [...currentMods, ...uniqueIds],
            excludeSharedMods: prev.serverMods[serverName]?.excludeSharedMods || false
          }
        }
      }));
    }
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
      <div className="bg-base-300 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Global Mods</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {wizardData.globalMods.map(modId => (
            <div key={modId} className="badge badge-secondary gap-2">
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
        <form
          className="flex gap-2 mb-2"
          onSubmit={e => {
            e.preventDefault();
            addMultipleGlobalMods(globalModInput);
            setGlobalModInput('');
          }}
        >
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="Add mod ID(s), comma separated"
            value={globalModInput}
            onChange={e => setGlobalModInput(e.target.value)}
          />
          <button className="btn btn-sm btn-primary" type="submit">Add</button>
        </form>
        <div className="mb-3">
          <h5 className="font-medium mb-2">Quick Add Popular Mods</h5>
          <div className="flex flex-wrap gap-1">
            {POPULAR_MODS.map(mod => (
              <button
                key={mod.id}
                className={`btn btn-xs ${wizardData.globalMods.includes(mod.id) ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => addGlobalMod(mod.id)}
                type="button"
              >
                {mod.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Server-specific Mods Section */}
      <div className="space-y-4">
        {servers.map((server, index) => (
          <div key={server.name} className="bg-base-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{server.name}</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={wizardData.serverMods[server.name]?.excludeSharedMods || false}
                  onChange={() => toggleExcludeSharedMods(server.name)}
                />
                <span className="text-xs">Exclude Global Mods</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(wizardData.serverMods[server.name]?.additionalMods || []).map(modId => (
                <div key={modId} className="badge badge-accent gap-2">
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
            <form
              className="flex gap-2 mb-2"
              onSubmit={e => {
                e.preventDefault();
                addMultipleServerMods(server.name, serverModInputs[server.name] || '');
                setServerModInputs(inputs => ({ ...inputs, [server.name]: '' }));
              }}
            >
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Add mod ID(s), comma separated"
                value={serverModInputs[server.name] || ''}
                onChange={e => setServerModInputs(inputs => ({ ...inputs, [server.name]: e.target.value }))}
              />
              <button className="btn btn-sm btn-primary" type="submit">Add</button>
            </form>
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
                    type="button"
                  >
                    {mod.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModsStep; 