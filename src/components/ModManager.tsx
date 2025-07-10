import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ModManagerProps {
  onClose: () => void;
  serverName?: string; // If provided, manage server-specific mods
}

interface ServerModConfig {
  additionalMods: number[];
  excludeSharedMods: boolean;
}

const ModManager: React.FC<ModManagerProps> = ({ onClose, serverName }) => {
  const [sharedMods, setSharedMods] = useState<number[]>([]);
  const [serverMods, setServerMods] = useState<number[]>([]);
  const [excludeSharedMods, setExcludeSharedMods] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    { id: 566885854, name: 'Bridge', description: 'Bridge building system' }
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
      if (sharedResponse.success) {
        setSharedMods(sharedResponse.sharedMods);
      }

      // Load server-specific mods if serverName is provided
      if (serverName) {
        const serverResponse = await api.get(`/api/provisioning/server-mods/${serverName}`);
        if (serverResponse.success) {
          setServerMods(serverResponse.serverConfig.additionalMods);
          setExcludeSharedMods(serverResponse.serverConfig.excludeSharedMods);
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

        if (response.success) {
          alert('Server mods configuration saved successfully!');
          onClose();
        } else {
          setError(response.message || 'Failed to save server mods');
        }
      } else {
        // Save shared mods
        const response = await api.put('/api/provisioning/shared-mods', {
          modList: sharedMods
        });

        if (response.success) {
          alert('Shared mods configuration saved successfully!');
          onClose();
        } else {
          setError(response.message || 'Failed to save shared mods');
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
    const modId = parseInt(newModId.trim());
    if (modId && !isNaN(modId)) {
      handleAddMod(modId, isShared);
      setNewModId('');
    }
  };

  const getModName = (modId: number) => {
    const popularMod = popularMods.find(mod => mod.id === modId);
    return popularMod ? popularMod.name : `Mod ${modId}`;
  };

  const renderModList = (mods: number[], isShared: boolean = true) => (
    <div className="space-y-2">
      {mods.map(modId => (
        <div key={modId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div>
            <span className="font-medium">{getModName(modId)}</span>
            <span className="text-sm text-gray-500 ml-2">(ID: {modId})</span>
          </div>
          <button
            onClick={() => handleRemoveMod(modId, isShared)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
      ))}
      {mods.length === 0 && (
        <p className="text-gray-500 text-sm italic">No mods configured</p>
      )}
    </div>
  );

  const renderModInput = (isShared: boolean = true) => (
    <div className="flex gap-2">
      <input
        type="text"
        value={newModId}
        onChange={(e) => setNewModId(e.target.value)}
        placeholder="Enter CurseForge Project ID"
        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={() => handleAddCustomMod(isShared)}
        disabled={!newModId.trim() || isNaN(parseInt(newModId.trim()))}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading mods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {serverName ? `Mods for ${serverName}` : 'Shared Mods Management'}
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shared Mods Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shared Mods</h3>
            <p className="text-sm text-gray-600">
              These mods will be applied to all servers unless excluded
            </p>
            
            {renderModList(sharedMods, true)}
            
            <div className="space-y-3">
              <h4 className="font-medium">Add Popular Mods</h4>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {popularMods.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => handleAddMod(mod.id, true)}
                    disabled={sharedMods.includes(mod.id)}
                    className={`text-left p-2 rounded border ${
                      sharedMods.includes(mod.id)
                        ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{mod.name}</div>
                    <div className="text-sm text-gray-600">{mod.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Add Custom Mod</h4>
              {renderModInput(true)}
            </div>
          </div>

          {/* Server-Specific Mods Section */}
          {serverName && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Server-Specific Mods</h3>
              <p className="text-sm text-gray-600">
                Additional mods for this server only
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={excludeSharedMods}
                    onChange={(e) => setExcludeSharedMods(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Exclude shared mods for this server</span>
                </label>
              </div>
              
              {renderModList(serverMods, false)}
              
              <div className="space-y-3">
                <h4 className="font-medium">Add Popular Mods</h4>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {popularMods.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => handleAddMod(mod.id, false)}
                      disabled={serverMods.includes(mod.id)}
                      className={`text-left p-2 rounded border ${
                        serverMods.includes(mod.id)
                          ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{mod.name}</div>
                      <div className="text-sm text-gray-600">{mod.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Add Custom Mod</h4>
                {renderModInput(false)}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Shared Mods: {sharedMods.length} mods</div>
            {serverName && (
              <>
                <div>Server Mods: {serverMods.length} mods</div>
                <div>Exclude Shared: {excludeSharedMods ? 'Yes' : 'No'}</div>
                <div>Total for this server: {excludeSharedMods ? serverMods.length : sharedMods.length + serverMods.length} mods</div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModManager; 