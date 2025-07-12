import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ModManagerProps {
  onClose: () => void;
  serverName?: string; // If provided, manage server-specific mods
}

// interface ServerModConfig {
//   additionalMods: number[];
//   excludeSharedMods: boolean;
// }

const ModManager: React.FC<ModManagerProps> = ({ onClose, serverName }) => {
  const [sharedMods, setSharedMods] = useState<number[]>([]);
  const [serverMods, setServerMods] = useState<number[]>([]);
  const [excludeSharedMods, setExcludeSharedMods] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSharedModId, setNewSharedModId] = useState('');
  const [newServerModId, setNewServerModId] = useState('');

  const popularMods = [
    { id: 928102085, name: 'Structures Plus (S+)', description: 'Enhanced building system' },
    { id: 1404697612, name: 'Super Spyglass', description: 'Enhanced spyglass with detailed info' },
    { id: 1565015734, name: 'Awesome Teleporters', description: 'Teleportation system' },
    { id: 1609138312, name: 'Awesome SpyGlass!', description: 'Advanced spyglass with stats' },
    { id: 215527665, name: 'Death Helper', description: 'Death location and recovery tools' },
    { id: 558651608, name: 'Pet Finder', description: 'Find lost tames easily' },
    { id: 731604991, name: 'Stairs Mod', description: 'Additional stair variants' },
    { id: 566885854, name: 'Bridge', description: 'Bridge building system' },
    { id: 1005639, name: 'Club ARK', description: 'Club ARK official mod' }
  ];

  useEffect(() => {
    loadMods();
  }, [serverName]);

  const loadMods = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load shared mods
      const sharedResponse = await api.get('/api/provisioning/shared-mods');
      if (sharedResponse.data?.success) {
        setSharedMods(sharedResponse.data.sharedMods);
      }

      // Load server-specific mods if serverName is provided
      if (serverName) {
        const serverResponse = await api.get(`/api/provisioning/server-mods/${serverName}`);
        if (serverResponse.data?.success) {
          setServerMods(serverResponse.data.serverConfig.additionalMods);
          setExcludeSharedMods(serverResponse.data.serverConfig.excludeSharedMods);
        } else {
          // Set defaults for Club ARK servers
          const isClubArkServer = serverName.toLowerCase().includes('club') || 
                                 serverName.toLowerCase().includes('bobs');
          if (isClubArkServer) {
            setServerMods([1005639]); // Club ARK mod
            setExcludeSharedMods(true); // Exclude shared mods
          }
        }
      }
    } catch (err: any) {
      setError('Failed to load mods configuration');
      console.error('Error loading mods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (serverName) {
        // Save server-specific mods
        const response = await api.put(`/api/provisioning/server-mods/${serverName}`, {
          additionalMods: serverMods,
          excludeSharedMods
        });

        if (response.data?.success) {
          onClose();
        } else {
          setError(response.data?.message || 'Failed to save server mods');
        }
      } else {
        // Save shared mods
        const response = await api.put('/api/provisioning/shared-mods', {
          modList: sharedMods
        });

        if (response.data?.success) {
          onClose();
        } else {
          setError(response.data?.message || 'Failed to save shared mods');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save mods configuration');
      console.error('Error saving mods:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMod = (modId: number, isShared: boolean = true) => {
    if (isShared) {
      if (!sharedMods.includes(modId)) {
        setSharedMods([...sharedMods, modId]);
      }
    } else {
      if (!serverMods.includes(modId)) {
        setServerMods([...serverMods, modId]);
      }
    }
  };

  const handleRemoveMod = (modId: number, isShared: boolean = true) => {
    if (isShared) {
      setSharedMods(sharedMods.filter(id => id !== modId));
    } else {
      setServerMods(serverMods.filter(id => id !== modId));
    }
  };

  const handleAddCustomMod = (isShared: boolean = true) => {
    const inputValue = isShared ? newSharedModId.trim() : newServerModId.trim();
    
    if (!inputValue) return;
    
    // Split by comma and clean up each mod ID
    const modIds = inputValue
      .split(',')
      .map(id => id.trim())
      .filter(id => id && !isNaN(parseInt(id)))
      .map(id => parseInt(id));
    
    if (modIds.length === 0) return;
    
    // Add all valid mod IDs at once using functional state update
    if (isShared) {
      setSharedMods(prevMods => {
        const newMods = [...prevMods];
        modIds.forEach(modId => {
          if (!newMods.includes(modId)) {
            newMods.push(modId);
          }
        });
        return newMods;
      });
      setNewSharedModId('');
    } else {
      setServerMods(prevMods => {
        const newMods = [...prevMods];
        modIds.forEach(modId => {
          if (!newMods.includes(modId)) {
            newMods.push(modId);
          }
        });
        return newMods;
      });
      setNewServerModId('');
    }
  };

  const getModName = (modId: number) => {
    const popularMod = popularMods.find(mod => mod.id === modId);
    return popularMod ? popularMod.name : `Mod ${modId}`;
  };

  const renderModList = (mods: number[], isShared: boolean = true) => (
    <div className="space-y-2">
      {mods.map(modId => (
        <div key={modId} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div>
            <span className="font-medium text-base-content">{getModName(modId)}</span>
            <span className="text-sm text-base-content/60 ml-2">(ID: {modId})</span>
          </div>
          <button
            onClick={() => handleRemoveMod(modId, isShared)}
            className="btn btn-xs btn-error"
          >
            Remove
          </button>
        </div>
      ))}
      {mods.length === 0 && (
        <div className="text-center py-4 text-base-content/60">
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-sm italic">No mods configured</p>
        </div>
      )}
    </div>
  );

  const renderModInput = (isShared: boolean = true) => (
    <div className="flex gap-2">
      <input
        type="text"
        value={isShared ? newSharedModId : newServerModId}
        onChange={(e) => isShared ? setNewSharedModId(e.target.value) : setNewServerModId(e.target.value)}
        placeholder="Enter mod ID(s) - separate multiple with commas (e.g., 731604991, 1404697612)"
        className="input input-bordered flex-1"
      />
      <button
        onClick={() => handleAddCustomMod(isShared)}
        disabled={!((isShared ? newSharedModId : newServerModId).trim())}
        className="btn btn-primary"
      >
        Add
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="flex flex-col items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-base-content/70">Loading mods...</p>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-base-content">
            {serverName ? `🎮 Mods for ${serverName}` : '🎮 Shared Mods Management'}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-circle btn-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shared Mods Section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-primary">Shared Mods</h3>
              <p className="text-sm text-base-content/70">
                These mods will be applied to all servers unless excluded
              </p>
              
              <div className="divider"></div>
              
              {renderModList(sharedMods, true)}
              
              <div className="space-y-3">
                <h4 className="font-medium text-base-content">Add Popular Mods</h4>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {popularMods.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => handleAddMod(mod.id, true)}
                      disabled={sharedMods.includes(mod.id)}
                      className={`btn btn-outline btn-sm justify-start text-left h-auto p-3 ${
                        sharedMods.includes(mod.id)
                          ? 'btn-success cursor-not-allowed'
                          : 'hover:btn-primary'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{mod.name}</div>
                        <div className="text-xs opacity-70">{mod.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-base-content">Add Custom Mod</h4>
                {renderModInput(true)}
              </div>
            </div>
          </div>

          {/* Server-Specific Mods Section */}
          {serverName ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-secondary">Server-Specific Mods</h3>
                <p className="text-sm text-base-content/70">
                  Additional mods for {serverName} only
                </p>

                <div className="divider"></div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Exclude shared mods for this server</span>
                    <input
                      type="checkbox"
                      checked={excludeSharedMods}
                      onChange={(e) => setExcludeSharedMods(e.target.checked)}
                      className="checkbox checkbox-warning"
                    />
                  </label>
                </div>
                
                {renderModList(serverMods, false)}
                
                <div className="space-y-3">
                  <h4 className="font-medium text-base-content">Add Popular Mods</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {popularMods.map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => handleAddMod(mod.id, false)}
                        disabled={serverMods.includes(mod.id)}
                        className={`btn btn-outline btn-sm justify-start text-left h-auto p-3 ${
                          serverMods.includes(mod.id)
                            ? 'btn-success cursor-not-allowed'
                            : 'hover:btn-secondary'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{mod.name}</div>
                          <div className="text-xs opacity-70">{mod.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-base-content">Add Custom Mod</h4>
                  {renderModInput(false)}
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-secondary">Server-Specific Mods</h3>
                <p className="text-sm text-base-content/70">
                  Select a server to manage its specific mods
                </p>
                <div className="text-center py-8 text-base-content/60">
                  <div className="text-4xl mb-2">🖥️</div>
                  <p>Click the 🎮 button on any server in the server list to manage its mods</p>
                  <div className="mt-4 text-sm">
                    <p>• Desktop: Look for the 🎮 button in the Actions column</p>
                    <p>• Mobile: Look for the "🎮 Mods" button in the server card</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card bg-info/10 border-info/20 mt-6">
          <div className="card-body">
            <h4 className="card-title text-info">📊 Summary</h4>
            <div className="stats stats-horizontal shadow">
              <div className="stat">
                <div className="stat-title">Shared Mods</div>
                <div className="stat-value text-primary">{sharedMods.length}</div>
              </div>
              {serverName && (
                <>
                  <div className="stat">
                    <div className="stat-title">Server Mods</div>
                    <div className="stat-value text-secondary">{serverMods.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Exclude Shared</div>
                    <div className="stat-value text-warning">{excludeSharedMods ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total for Server</div>
                    <div className="stat-value text-accent">{excludeSharedMods ? serverMods.length : sharedMods.length + serverMods.length}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default ModManager; 