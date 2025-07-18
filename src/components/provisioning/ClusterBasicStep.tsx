import React from 'react';
import type { StepProps } from '../../types/provisioning';
import PortAllocationPreview from './PortAllocationPreview';

const ClusterBasicStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => {
  // Helper to update portConfiguration
  const updatePortConfig = (field: string, value: number) => {
    setWizardData(prev => ({
      ...prev,
      portConfiguration: {
        ...prev.portConfiguration,
        [field]: value
      }
    }));
  };

  // Keep portConfiguration.basePort in sync with basePort
  React.useEffect(() => {
    if (wizardData.basePort !== wizardData.portConfiguration?.basePort) {
      setWizardData(prev => ({
        ...prev,
        portConfiguration: {
          ...prev.portConfiguration,
          basePort: prev.basePort
        }
      }));
    }
  }, [wizardData.basePort]);

  // Keep portConfiguration in sync with portAllocationMode (if needed)
  React.useEffect(() => {
    // Optionally, adjust increments based on mode
    // (You can add logic here if increments should change with mode)
  }, [wizardData.portAllocationMode]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Cluster Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Cluster Name *</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="MyAwesomeCluster"
            value={wizardData.clusterName}
            onChange={(e) => setWizardData(prev => ({ ...prev, clusterName: e.target.value }))}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Description</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="My awesome ARK cluster"
            value={wizardData.description}
            onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Number of Servers</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="1"
            min="1"
            max="50"
            value={wizardData.serverCount}
            onChange={(e) => setWizardData(prev => ({ ...prev, serverCount: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Base Port</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="7777"
            value={wizardData.basePort}
            onChange={(e) => setWizardData(prev => ({ ...prev, basePort: parseInt(e.target.value) }))}
            onBlur={(e) => updatePortConfig('basePort', parseInt(e.target.value) || 7777)}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Port Allocation Mode</span>
          </label>
          <select
            className="select select-bordered"
            value={wizardData.portAllocationMode}
            onChange={(e) => setWizardData(prev => ({ ...prev, portAllocationMode: e.target.value as 'sequential' | 'even' }))}
          >
            <option value="sequential">Sequential (Game: 7777,7778... Query: 27015,27016... RCON: 24553+ Game)</option>
            <option value="even">Even (Server1: 7777,7779,7781... Server2: 7787,7789,7791...)</option>
          </select>
        </div>
        {/* Port increments and advanced config */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Game Port Increment</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="3"
            value={wizardData.portConfiguration?.portIncrement || 3}
            onChange={(e) => updatePortConfig('portIncrement', parseInt(e.target.value) || 3)}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Query Port Base</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="27015"
            value={wizardData.portConfiguration?.queryPortBase || 27015}
            onChange={(e) => updatePortConfig('queryPortBase', parseInt(e.target.value) || 27015)}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Query Port Increment</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="3"
            value={wizardData.portConfiguration?.queryPortIncrement || 3}
            onChange={(e) => updatePortConfig('queryPortIncrement', parseInt(e.target.value) || 3)}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">RCON Port Base</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="32330"
            value={wizardData.portConfiguration?.rconPortBase || 32330}
            onChange={(e) => updatePortConfig('rconPortBase', parseInt(e.target.value) || 32330)}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">RCON Port Increment</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="3"
            value={wizardData.portConfiguration?.rconPortIncrement || 3}
            onChange={(e) => updatePortConfig('rconPortIncrement', parseInt(e.target.value) || 3)}
          />
        </div>
      </div>
      <PortAllocationPreview wizardData={wizardData} />
    </div>
  );
};

export default ClusterBasicStep; 