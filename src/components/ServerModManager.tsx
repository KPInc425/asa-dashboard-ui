import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ServerModManagerProps {
  serverName: string;
  onClose: () => void;
}

const ServerModManager: React.FC<ServerModManagerProps> = ({ serverName, onClose }) => {
  const [sharedMods, setSharedMods] = useState<number[]>([]);
  const [serverMods, setServerMods] = useState<number[]>([]);
  const [excludeSharedMods, setExcludeSharedMods] = useState(false);
  // id -> display name, resolved by the API from the server install
  const [modNames, setModNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newModId, setNewModId] = useState('');

  const popularMods = [
    // Verified ASA CurseForge project ids. The previous entries were Steam
    // Workshop ids from ASE, so clicking one dropped a dead id on an ASA server.
    { id: 929420, name: 'Super Spyglass Plus', description: 'Detailed stat spyglass' },
    { id: 942024, name: 'Dino Depot', description: 'Cryopod storage and dinoballs' },
    { id: 928793, name: "Pelayori's Cryo Storage", description: 'Cryopods, cryogun, cryo terminal' },
    { id: 928597, name: 'Automated Ark', description: 'Automates feeding, gathering, crafting' },
    { id: 950914, name: 'Awesome Teleporters', description: 'Teleporter pad network' },
    { id: 940975, name: 'Cybers Structures QoL+', description: 'Crossplay building quality of life' },
    { id: 942452, name: 'CG Structures', description: 'Structures Plus style building (alpha)' },
    { id: 935408, name: 'Der Dino Finder', description: 'Locate dinos by species' },
    { id: 929868, name: 'Admin Panel', description: 'In-game admin tools' },
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
      if (sharedResponse.data.success) {
        setSharedMods(sharedResponse.data.sharedMods);
        if (sharedResponse.data.modNames) setModNames(prev => ({ ...prev, ...sharedResponse.data.modNames }));
      }

      // Load server-specific mods
      const serverResponse = await api.get(`/api/provisioning/server-mods/${serverName}`);
      if (serverResponse.data.success) {
        setServerMods(serverResponse.data.serverConfig.additionalMods);
        if (serverResponse.data.modNames) setModNames(prev => ({ ...prev, ...serverResponse.data.modNames }));
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

      // Save server-specific mods
      const response = await api.put(`/api/provisioning/server-mods/${serverName}`, {
        additionalMods: serverMods,
        excludeSharedMods
      });

      if (response.data.success) {
        onClose();
      } else {
        setError(response.data.message || 'Failed to save server mods');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save mods configuration');
      console.error('Error saving mods:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMod = (modId: number) => {
    if (!serverMods.includes(modId)) {
      setServerMods([...serverMods, modId]);
    }
  };

  const handleRemoveMod = (modId: number) => {
    setServerMods(serverMods.filter(id => id !== modId));
  };

  const handleAddCustomMod = () => {
    const inputValue = newModId.trim();
    
    if (!inputValue) return;
    
    // Split by comma and clean up each mod ID
    const modIds = inputValue
      .split(',')
      .map(id => id.trim())
      .filter(id => id && !isNaN(parseInt(id)))
      .map(id => parseInt(id));
    
    if (modIds.length === 0) return;
    
    // Add all valid mod IDs at once using functional state update
    setServerMods(prevMods => {
      const newMods = [...prevMods];
      modIds.forEach(modId => {
        if (!newMods.includes(modId)) {
          newMods.push(modId);
        }
      });
      return newMods;
    });
    
    // Clear the input
    setNewModId('');
  };

  const getModName = (modId: number) => {
    const resolved = modNames[String(modId)];
    if (resolved) return resolved;
    const popularMod = popularMods.find(mod => mod.id === modId);
    return popularMod ? popularMod.name : `Mod ${modId}`;
  };

  const renderModList = () => (
    <div className="space-y-2">
      {serverMods.map(modId => (
        <div key={modId} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div>
            <span className="font-medium text-base-content">{getModName(modId)}</span>
            <span className="text-sm text-base-content/60 ml-2">(ID: {modId})</span>
          </div>
          <button
            onClick={() => handleRemoveMod(modId)}
            className="btn btn-xs btn-error"
          >
            Remove
          </button>
        </div>
      ))}
      {serverMods.length === 0 && (
        <div className="text-center py-4 text-base-content/60">
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-sm italic">No server-specific mods configured</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Loading mods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared Mods Info */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-primary">Shared Mods</h3>
            <p className="text-sm text-base-content/70">
              These mods will be applied to all servers unless excluded
            </p>
            
            <div className="divider"></div>
            
            <div className="space-y-2">
              {sharedMods.map(modId => (
                <div key={modId} className="flex items-center justify-between p-2 bg-base-200 rounded">
                  <span className="text-sm">{getModName(modId)}</span>
                  <span className="text-xs text-base-content/60">(ID: {modId})</span>
                </div>
              ))}
              {sharedMods.length === 0 && (
                <div className="text-center py-4 text-base-content/60">
                  <p className="text-sm italic">No shared mods configured</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server-Specific Mods */}
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
            
            {renderModList()}
            
            <div className="space-y-3">
              <h4 className="font-medium text-base-content">Add Popular Mods</h4>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {popularMods.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => handleAddMod(mod.id)}
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModId}
                  onChange={(e) => setNewModId(e.target.value)}
                  placeholder="Enter mod ID(s) - separate multiple with commas (e.g., 929420, 942024)"
                  className="input input-bordered flex-1"
                />
                <button
                  onClick={handleAddCustomMod}
                  disabled={!newModId.trim()}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-info/10 border-info/20">
        <div className="card-body">
          <h4 className="card-title text-info">📊 Summary</h4>
          <div className="stats stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Shared Mods</div>
              <div className="stat-value text-primary">{sharedMods.length}</div>
            </div>
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
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
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
  );
};

export default ServerModManager; 