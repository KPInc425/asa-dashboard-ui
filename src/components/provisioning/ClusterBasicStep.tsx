import React, { useRef, useState } from 'react';
import type { StepProps } from '../../types/provisioning';
import PortAllocationPreview from './PortAllocationPreview';

const ClusterBasicStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      if (!config.name) throw new Error('Config must have a name');
      setWizardData(prev => ({
        ...prev,
        clusterName: config.name || '',
        description: config.description || '',
        serverCount: config.serverCount || 1,
        basePort: config.basePort || 7777,
        portAllocationMode: config.portAllocationMode || 'sequential',
        // Add more fields as needed
      }));
    } catch (err) {
      setImportError('Invalid config file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Cluster Information</h2>
      <div className="mb-4 flex gap-2 items-center">
        <button className="btn btn-outline btn-info" onClick={() => fileInputRef.current?.click()}>
          Import Config
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImportConfig}
        />
        {importError && <span className="text-error ml-2">{importError}</span>}
      </div>
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
      </div>
      <PortAllocationPreview wizardData={wizardData} />
    </div>
  );
};

export default ClusterBasicStep; 