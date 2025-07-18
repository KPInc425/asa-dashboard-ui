import React from 'react';
import type { StepProps } from '../../types/provisioning';

const MapSelectionStep: React.FC<StepProps> = ({ wizardData, setWizardData, availableMaps, toggleMap, updateMapCount }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-primary">Map Selection</h2>
    <p className="text-base-content/70 text-lg">
      Choose which maps you want to include in your cluster.
      You can select multiple maps and specify how many servers for each.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {availableMaps.map(map => (
        <div key={map.name} className={`bg-base-300 rounded-lg p-4 ${!map.available ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{map.displayName}</h3>
            {!map.available && (
              <span className="badge badge-warning badge-sm">Coming Soon</span>
            )}
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Enabled:</span>
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={wizardData.selectedMaps.some(m => m.map === map.name && m.enabled)}
              onChange={() => toggleMap && toggleMap(map.name)}
              disabled={!map.available}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Count:</span>
            <input
              type="number"
              className="input input-bordered input-sm w-24"
              value={wizardData.selectedMaps.find(m => m.map === map.name)?.count || 1}
              onChange={(e) => updateMapCount && updateMapCount(map.name, parseInt(e.target.value))}
              min="1"
              disabled={!map.available}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Custom Map Input */}
    <div className="bg-base-300 rounded-lg p-4 border-2 border-dashed border-base-content/30">
      <h3 className="font-semibold mb-3">Custom Map (Premium/Mod Maps)</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Map Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="CustomMapName"
            value={wizardData.customMapName || ''}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapName: e.target.value }))}
          />
          <label className="label">
            <span className="label-text-alt text-xs">Enter the exact map name (e.g., ModMapName)</span>
          </label>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Display Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="My Custom Map"
            value={wizardData.customMapDisplayName || ''}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapDisplayName: e.target.value }))}
          />
          <label className="label">
            <span className="label-text-alt text-xs">Friendly name for display</span>
          </label>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Server Count</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="1"
            min="1"
            max="10"
            value={wizardData.customMapCount || 1}
            onChange={(e) => setWizardData(prev => ({ ...prev, customMapCount: parseInt(e.target.value) || 1 }))}
          />
          <label className="label">
            <span className="label-text-alt text-xs">Number of servers for this map</span>
          </label>
        </div>
      </div>
      
      {wizardData.customMapName && (
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{wizardData.customMapDisplayName || wizardData.customMapName}</span>
              <span className="text-sm text-base-content/70 ml-2">({wizardData.customMapCount} server{wizardData.customMapCount !== 1 ? 's' : ''})</span>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                const customMap = {
                  map: wizardData.customMapName,
                  count: wizardData.customMapCount,
                  enabled: true,
                  displayName: wizardData.customMapDisplayName || wizardData.customMapName
                };
                setWizardData(prev => ({
                  ...prev,
                  selectedMaps: [...prev.selectedMaps, customMap],
                  customMapName: '',
                  customMapDisplayName: '',
                  customMapCount: 1
                }));
              }}
            >
              Add Map
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default MapSelectionStep; 