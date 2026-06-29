import React from 'react';
import type { MapSelection } from './types';

interface MapSelectionTabProps {
  selectedMaps: MapSelection[];
  updateMapSelection: (mapName: string, updates: Partial<MapSelection>) => void;
  generateServers: () => void;
  getTotalServerCount: () => number;
}

const MapSelectionTab: React.FC<MapSelectionTabProps> = ({
  selectedMaps,
  updateMapSelection,
  generateServers,
  getTotalServerCount,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Map Selection</h3>
        <div className="text-sm text-gray-600">
          Total Servers: {getTotalServerCount()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedMaps.map((mapSelection) => (
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
  );
};

export default MapSelectionTab;
