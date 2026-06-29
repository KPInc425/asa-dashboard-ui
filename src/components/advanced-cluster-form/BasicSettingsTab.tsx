import React from 'react';
import type { ClusterForm } from './types';

interface BasicSettingsTabProps {
  form: ClusterForm;
  updateForm: (updates: Partial<ClusterForm>) => void;
  getTotalServerCount: () => number;
}

const BasicSettingsTab: React.FC<BasicSettingsTabProps> = ({ form, updateForm, getTotalServerCount }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cluster Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="MyARKCluster"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          rows={3}
          placeholder="Description of your ARK cluster"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Servers: {getTotalServerCount()}
          </label>
          <p className="text-sm text-gray-500">Configure maps in the Map Selection tab</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Auto Start Servers
          </label>
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={form.autoStart}
                onChange={(e) => updateForm({ autoStart: e.target.checked })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Start servers after creation</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicSettingsTab;
