import React from 'react';
import type { AdvancedClusterFormProps } from './types';
import { TABS } from './constants';
import { useClusterForm } from './useClusterForm';
import BasicSettingsTab from './BasicSettingsTab';
import MapSelectionTab from './MapSelectionTab';
import ModManagementTab from './ModManagementTab';
import ServerConfigTab from './ServerConfigTab';
import PortConfigTab from './PortConfigTab';
import GameSettingsTab from './GameSettingsTab';
import ClusterSettingsTab from './ClusterSettingsTab';

const AdvancedClusterForm: React.FC<AdvancedClusterFormProps> = ({
  onSubmit,
  onCancel,
  loading
}) => {
  const {
    activeTab,
    setActiveTab,
    form,
    updateForm,
    updateGlobalSetting,
    updateMapSelection,
    addGlobalMod,
    removeGlobalMod,
    addServerMod,
    removeServerMod,
    generateServers,
    updateServer,
    getTotalServerCount,
    handleSubmit,
  } = useClusterForm();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create ARK Cluster</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={(e) => handleSubmit(e, onSubmit)}>
        {activeTab === 'basic' && (
          <BasicSettingsTab
            form={form}
            updateForm={updateForm}
            getTotalServerCount={getTotalServerCount}
          />
        )}

        {activeTab === 'maps' && (
          <MapSelectionTab
            selectedMaps={form.selectedMaps}
            updateMapSelection={updateMapSelection}
            generateServers={generateServers}
            getTotalServerCount={getTotalServerCount}
          />
        )}

        {activeTab === 'mods' && (
          <ModManagementTab
            globalMods={form.globalMods}
            addGlobalMod={addGlobalMod}
            removeGlobalMod={removeGlobalMod}
          />
        )}

        {activeTab === 'servers' && (
          <ServerConfigTab
            servers={form.servers}
            generateServers={generateServers}
            updateServer={updateServer}
            addServerMod={addServerMod}
            removeServerMod={removeServerMod}
          />
        )}

        {activeTab === 'ports' && (
          <PortConfigTab
            form={form}
            updateForm={updateForm}
          />
        )}

        {activeTab === 'settings' && (
          <GameSettingsTab
            form={form}
            updateGlobalSetting={updateGlobalSetting}
          />
        )}

        {activeTab === 'cluster' && (
          <ClusterSettingsTab
            form={form}
            updateForm={updateForm}
          />
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Cluster'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvancedClusterForm;
