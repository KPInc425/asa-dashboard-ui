import React, { useState, useEffect } from "react";
import {
  getMaps,
  addCustomMap,
  removeCustomMap,
  toggleMapAvailable,
  type MapEntry,
} from "../config/maps";

interface MapManagerProps {
  onClose: () => void;
}

const MapManager: React.FC<MapManagerProps> = ({ onClose }) => {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = () => {
    setMaps(getMaps());
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) {
      setError("Map name is required");
      return;
    }
    if (!newDisplayName.trim()) {
      setError("Display name is required");
      return;
    }

    const result = addCustomMap(newName, newDisplayName);
    if (result) {
      setSuccess(`Map "${newDisplayName}" added successfully`);
      setNewName("");
      setNewDisplayName("");
      refresh();
    } else {
      setError(
        "Failed to add map. It may already exist or conflict with an official map.",
      );
    }
  };

  const handleToggle = (name: string) => {
    toggleMapAvailable(name);
    refresh();
  };

  const handleRemove = (name: string, official: boolean) => {
    if (official) {
      setError("Cannot remove official maps — disable them instead");
      return;
    }
    const result = removeCustomMap(name);
    if (result) {
      setSuccess(`Map removed successfully`);
      refresh();
    } else {
      setError("Failed to remove map");
    }
  };

  const officialCount = maps.filter((m) => m.official).length;
  const customCount = maps.filter((m) => !m.official).length;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">🗺️ Map Manager</h3>
        <p className="text-xs text-base-content/60 mb-4">
          Manage which ARK maps are available for provisioning. Official maps
          are built-in; custom maps are added by you and stored in your browser.
          Disabled maps are hidden from the provisioning UI.
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        {/* Add custom map form */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-3">Add Custom Map</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Internal name (e.g. NewMap)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Display name (e.g. New Map)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
            <button
              onClick={handleAdd}
              className="btn btn-primary btn-sm"
              disabled={!newName.trim() || !newDisplayName.trim()}
            >
              ➕ Add
            </button>
          </div>
        </div>

        {/* Map list */}
        <div className="max-h-96 overflow-y-auto space-y-1">
          <div className="text-sm text-base-content/70 mb-2">
            {maps.length} maps ({officialCount} official, {customCount} custom)
          </div>
          {maps.map((map) => (
            <div
              key={map.name}
              className="flex items-center justify-between p-2 bg-base-200 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handleToggle(map.name)}
                  className={`btn btn-xs btn-circle ${map.available ? "btn-success" : "btn-ghost"}`}
                  title={
                    map.available ? "Click to disable" : "Click to enable"
                  }
                >
                  {map.available ? "✓" : ""}
                </button>
                <div className="min-w-0">
                  <span className="font-medium text-sm">{map.displayName}</span>
                  <span className="text-xs text-base-content/50 ml-2 font-mono">
                    {map.name}
                  </span>
                  {map.official && (
                    <span className="badge badge-xs badge-ghost ml-2">
                      official
                    </span>
                  )}
                </div>
              </div>
              {!map.official && (
                <button
                  onClick={() => handleRemove(map.name, map.official)}
                  className="btn btn-ghost btn-xs text-error"
                  title="Remove custom map"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapManager;
