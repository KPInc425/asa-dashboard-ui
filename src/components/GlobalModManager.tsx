import React, { useState, useEffect } from 'react';
import { api, regenerateStartScripts } from '../services/api';

interface GlobalModManagerProps {
  onClose: () => void;
  clusterName?: string;
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

      const result = await regenerateStartScripts();
      
      if (result.success) {
        // Show detailed success message
        const message = result.details 
          ? `✅ ${result.message}\n\nSuccessfully updated: ${result.details.successful.length} servers\nTotal processed: ${result.details.totalProcessed}`
          : result.message;
        alert(message);
      } else {
        // Show detailed error message
        let errorMessage = result.message;
        if (result.details) {
          errorMessage += `\n\n✅ Successful: ${result.details.successful.length} servers`;
          errorMessage += `\n❌ Failed: ${result.details.failed.length} servers`;
          errorMessage += `\n📊 Total processed: ${result.details.totalProcessed}`;
          
          if (result.details.failed.length > 0) {
            errorMessage += '\n\nFailed servers:';
            result.details.failed.forEach((failure: any) => {
              errorMessage += `\n• ${failure.serverName}: ${failure.message}`;
            });
          }
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to regenerate start scripts';
      setError(errorMessage);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Loading mods configuration...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-base-content">
                🎮 Global Mods Management
              </h2>
              <p className="text-sm text-base-content/70 mt-1">
                Configure shared mods that will be applied to all servers
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-circle btn-sm btn-ghost"
            >
              ✕
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          {/* Info Alert */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Shared Mods</h3>
              <div className="text-xs">
                These mods will be automatically applied to all servers unless a server specifically excludes them. 
                Changes are saved immediately and start scripts are regenerated automatically.
              </div>
            </div>
          </div>

          {/* Current Shared Mods */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title text-primary">Current Shared Mods</h3>
                <div className="badge badge-primary badge-lg">{sharedMods.length}</div>
              </div>
              
              <div className="space-y-2">
                {sharedMods.map(modId => (
                  <div key={modId} className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <span className="font-medium text-base-content">{getModName(modId)}</span>
                        <span className="text-sm text-base-content/60 ml-2">(ID: {modId})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMod(modId)}
                      className="btn btn-xs btn-error btn-outline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {sharedMods.length === 0 && (
                  <div className="text-center py-8 text-base-content/60">
                    <div className="text-4xl mb-3">🎮</div>
                    <p className="text-lg font-medium mb-2">No shared mods configured</p>
                    <p className="text-sm">Add mods below to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Popular Mods */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-primary mb-4">Add Popular Mods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {popularMods.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => handleAddMod(mod.id)}
                    disabled={sharedMods.includes(mod.id)}
                    className={`btn btn-outline justify-start text-left h-auto p-4 transition-all ${
                      sharedMods.includes(mod.id)
                        ? 'btn-success cursor-not-allowed opacity-60'
                        : 'hover:btn-primary hover:scale-105'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{mod.name}</div>
                      <div className="text-xs opacity-70 mt-1">{mod.description}</div>
                      <div className="text-xs opacity-50 mt-1">ID: {mod.id}</div>
                    </div>
                    {sharedMods.includes(mod.id) && (
                      <div className="text-success text-lg">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add Custom Mod */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-primary mb-4">Add Custom Mod</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newModId}
                    onChange={(e) => setNewModId(e.target.value)}
                    placeholder="Enter mod ID(s) - separate multiple with commas (e.g., 731604991, 1404697612)"
                    className="input input-bordered flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomMod()}
                  />
                  <button
                    onClick={handleAddCustomMod}
                    disabled={!newModId.trim()}
                    className="btn btn-primary"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-base-content/60">
                  Enter one or more mod IDs separated by commas. You can find mod IDs on the Steam Workshop page.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="stats stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="stat-title">Shared Mods</div>
              <div className="stat-value text-primary">{sharedMods.length}</div>
              <div className="stat-desc">Applied to all servers</div>
            </div>
            
            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title">Auto Updates</div>
              <div className="stat-value text-secondary">Enabled</div>
              <div className="stat-desc">Scripts regenerate on save</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
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
                <>
                  🔄 Regenerate Scripts
                </>
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
                <>
                  💾 Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalModManager; 