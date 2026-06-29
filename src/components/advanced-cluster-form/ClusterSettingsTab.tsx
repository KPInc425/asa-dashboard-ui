import React from 'react';
import type { ClusterForm } from './types';

interface ClusterSettingsTabProps {
  form: ClusterForm;
  updateForm: (updates: Partial<ClusterForm>) => void;
}

const ClusterSettingsTab: React.FC<ClusterSettingsTabProps> = ({ form, updateForm }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Cluster Settings</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cluster ID</label>
          <input
            type="text"
            value={form.clusterSettings.clusterId}
            onChange={(e) => updateForm({
              clusterSettings: {
                ...form.clusterSettings,
                clusterId: e.target.value
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="mycluster"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cluster Name</label>
          <input
            type="text"
            value={form.clusterSettings.clusterName}
            onChange={(e) => updateForm({
              clusterSettings: {
                ...form.clusterSettings,
                clusterName: e.target.value
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="My ARK Cluster"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cluster Password</label>
          <input
            type="text"
            value={form.clusterSettings.clusterPassword}
            onChange={(e) => updateForm({
              clusterSettings: {
                ...form.clusterSettings,
                clusterPassword: e.target.value
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Leave empty for no password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cluster Owner</label>
          <input
            type="text"
            value={form.clusterSettings.clusterOwner}
            onChange={(e) => updateForm({
              clusterSettings: {
                ...form.clusterSettings,
                clusterOwner: e.target.value
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Admin"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cluster Description</label>
        <textarea
          value={form.clusterSettings.clusterDescription}
          onChange={(e) => updateForm({
            clusterSettings: {
              ...form.clusterSettings,
              clusterDescription: e.target.value
            }
          })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          rows={3}
          placeholder="Description of your cluster"
        />
      </div>
    </div>
  );
};

export default ClusterSettingsTab;
