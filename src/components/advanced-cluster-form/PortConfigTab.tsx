import React from 'react';
import type { ClusterForm } from './types';

interface PortConfigTabProps {
  form: ClusterForm;
  updateForm: (updates: Partial<ClusterForm>) => void;
}

const PortConfigTab: React.FC<PortConfigTabProps> = ({ form, updateForm }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Port Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Port</label>
          <input
            type="number"
            value={form.portConfiguration.basePort}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                basePort: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">First server port (default: 7777)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Port Increment</label>
          <input
            type="number"
            value={form.portConfiguration.portIncrement}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                portIncrement: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Port increment between servers</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Query Port Base</label>
          <input
            type="number"
            value={form.portConfiguration.queryPortBase}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                queryPortBase: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">First query port (default: 27015)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Query Port Increment</label>
          <input
            type="number"
            value={form.portConfiguration.queryPortIncrement}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                queryPortIncrement: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Query port increment between servers</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">RCON Port Base</label>
          <input
            type="number"
            value={form.portConfiguration.rconPortBase}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                rconPortBase: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">First RCON port (default: 32330)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">RCON Port Increment</label>
          <input
            type="number"
            value={form.portConfiguration.rconPortIncrement}
            onChange={(e) => updateForm({
              portConfiguration: {
                ...form.portConfiguration,
                rconPortIncrement: parseInt(e.target.value)
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">RCON port increment between servers</p>
        </div>
      </div>

      {form.servers.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Port Preview:</h4>
          <div className="bg-gray-50 p-3 rounded">
            {form.servers.map((server, index) => (
              <div key={index} className="text-sm">
                {server.name}: Port {server.gamePort}, Query {server.queryPort}, RCON {server.rconPort}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortConfigTab;
