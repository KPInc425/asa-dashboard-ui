import React from 'react';
import { POPULAR_MODS } from './constants';

interface ModManagementTabProps {
  globalMods: string[];
  addGlobalMod: (modId: string) => void;
  removeGlobalMod: (modId: string) => void;
}

const ModManagementTab: React.FC<ModManagementTabProps> = ({ globalMods, addGlobalMod, removeGlobalMod }) => {
  return (
    <div className="space-y-6">
      {/* Global Mods */}
      <div>
        <h3 className="text-lg font-medium mb-4">Global Mods (Applied to all servers)</h3>
        <div className="space-y-3">
          {POPULAR_MODS.map(mod => (
            <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium">{mod.name}</div>
                <div className="text-sm text-gray-500">ID: {mod.id}</div>
              </div>
              <button
                type="button"
                onClick={() => addGlobalMod(mod.id)}
                disabled={globalMods.includes(mod.id)}
                className={`px-3 py-1 rounded text-sm ${
                  globalMods.includes(mod.id)
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {globalMods.includes(mod.id) ? 'Added' : 'Add'}
              </button>
            </div>
          ))}
        </div>

        {globalMods.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Selected Global Mods:</h4>
            <div className="space-y-2">
              {globalMods.map(modId => {
                const mod = POPULAR_MODS.find(m => m.id === modId);
                return (
                  <div key={modId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{mod?.name || modId}</span>
                    <button
                      type="button"
                      onClick={() => removeGlobalMod(modId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Mod Input */}
      <div>
        <h3 className="text-lg font-medium mb-4">Add Custom Mod</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Steam Workshop Mod ID"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  addGlobalMod(input.value.trim());
                  input.value = '';
                }
              }
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                addGlobalMod(input.value.trim());
                input.value = '';
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModManagementTab;
