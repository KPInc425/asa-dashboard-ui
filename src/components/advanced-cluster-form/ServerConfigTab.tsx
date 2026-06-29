import React from 'react';
import type { ServerConfig } from './types';
import { AVAILABLE_MAPS, POPULAR_MODS } from './constants';

interface ServerConfigTabProps {
  servers: ServerConfig[];
  generateServers: () => void;
  updateServer: (index: number, updates: Partial<ServerConfig>) => void;
  addServerMod: (serverIndex: number, modId: string) => void;
  removeServerMod: (serverIndex: number, modId: string) => void;
}

const ServerConfigTab: React.FC<ServerConfigTabProps> = ({
  servers,
  generateServers,
  updateServer,
  addServerMod,
  removeServerMod,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Server Configuration</h3>
        <button
          type="button"
          onClick={generateServers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Regenerate Servers
        </button>
      </div>

      {servers.length > 0 ? (
        <div className="space-y-4">
          {servers.map((server, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">{server.name}</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Map</label>
                  <select
                    value={server.map}
                    onChange={(e) => updateServer(index, { map: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {AVAILABLE_MAPS.map(map => (
                      <option key={map} value={map}>{map}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Players</label>
                  <input
                    type="number"
                    value={server.maxPlayers}
                    onChange={(e) => updateServer(index, { maxPlayers: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="text"
                    value={server.password}
                    onChange={(e) => updateServer(index, { password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Leave empty for no password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                  <input
                    type="text"
                    value={server.adminPassword}
                    onChange={(e) => updateServer(index, { adminPassword: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {/* Server-specific mods */}
              <div>
                <h5 className="font-medium mb-2">Server-specific Mods</h5>
                <div className="space-y-2">
                  {POPULAR_MODS.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{mod.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (server.mods.includes(mod.id)) {
                            removeServerMod(index, mod.id);
                          } else {
                            addServerMod(index, mod.id);
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs ${
                          server.mods.includes(mod.id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {server.mods.includes(mod.id) ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>

                {server.mods.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Current mods: </span>
                    <span className="text-sm text-gray-600">
                      {server.mods.map(modId => {
                        const mod = POPULAR_MODS.find(m => m.id === modId);
                        return mod?.name || modId;
                      }).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Configure maps in the Map Selection tab and click "Generate Servers"
        </div>
      )}
    </div>
  );
};

export default ServerConfigTab;
