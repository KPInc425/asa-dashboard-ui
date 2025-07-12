import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface GlobalModManagerProps {
  onClose: () => void;
}

const GlobalModManager: React.FC<GlobalModManagerProps> = ({ onClose }) => {
  const [sharedMods, setSharedMods] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newModId, setNewModId] = useState('');

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
  }, []);

  const loadMods = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load shared mods
      const sharedResponse = await api.get('/api/provisioning/shared-mods');
      if (sharedResponse.data.success) {
        setSharedMods(sharedResponse.data.sharedMods);
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

      // Save shared mods
      const response = await api.put('/api/provisioning/shared-mods', {
        modList: sharedMods
      });

      if (response.data.success) {
        onClose();
      } else {
        setError(response.data.message || 'Failed to save shared mods');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save mods configuration');
      console.error('Error saving mods:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateStartScripts = async () => {
    try {
      setRegenerating(true);
      setError(null);

      const response = await api.post('/api/provisioning/regenerate-start-scripts');
      
      if (response.data.success) {
        alert('Start scripts have been regenerated successfully!');
      } else {
        setError(response.data.message || 'Failed to regenerate start scripts');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate start scripts');
      console.error('Error regenerating start scripts:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddMod = (modId: number) => {
    if (!sharedMods.includes(modId)) {
      setSharedMods([...sharedMods, modId]);
    }
  };

  const handleRemoveMod = (modId: number) => {
    setSharedMods(sharedMods.filter(id => id !== modId));
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
    setSharedMods(prevMods => {
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
    const popularMod = popularMods.find(mod => mod.id === modId);
    return popularMod ? popularMod.name : `Mod ${modId}`;
  };

  const renderModList = () => (
    <div className="space-y-2">
      {sharedMods.map(modId => (
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
      {sharedMods.length === 0 && (
        <div className="text-center py-4 text-base-content/60">
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-sm italic">No shared mods configured</p>
        </div>
      )}
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
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-base-content">
            🎮 Global Mods Management
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

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-primary">Shared Mods</h3>
            <p className="text-sm text-base-content/70">
              These mods will be applied to all servers unless excluded
            </p>
            
            <div className="divider"></div>
            
            {renderModList()}
            
            <div className="space-y-3">
              <h4 className="font-medium text-base-content">Add Popular Mods</h4>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {popularMods.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => handleAddMod(mod.id)}
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModId}
                  onChange={(e) => setNewModId(e.target.value)}
                  placeholder="Enter mod ID(s) - separate multiple with commas (e.g., 731604991, 1404697612)"
                  className="input input-bordered flex-1"
                />
                <button
                  onClick={handleAddCustomMod}
                  disabled={!newModId.trim()}
                  className="btn btn-primary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
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
            </div>
            <div className="alert alert-info mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold">Automatic Updates</h3>
                <div className="text-xs">When you save mod changes, start.bat files are automatically regenerated for all servers. You can also manually regenerate them using the button below.</div>
              </div>
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
            onClick={handleRegenerateStartScripts}
            disabled={regenerating}
            className="btn btn-warning"
          >
            {regenerating ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Regenerating...
              </>
            ) : (
              '🔄 Regenerate Start Scripts'
            )}
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

export default GlobalModManager; 