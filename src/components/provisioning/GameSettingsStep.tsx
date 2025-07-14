import React from 'react';
import type { StepProps } from '../../types/provisioning';

const GameSettingsStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-primary">Game Settings</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Harvest Multiplier</span>
          <div className="tooltip tooltip-right" data-tip="How much resources you get from harvesting">
            <span className="label-text-alt cursor-help">ℹ️</span>
          </div>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="3.0"
          value={wizardData.harvestMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, harvestMultiplier: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">XP Multiplier</span>
          <div className="tooltip tooltip-right" data-tip="How fast you gain experience">
            <span className="label-text-alt cursor-help">ℹ️</span>
          </div>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="3.0"
          value={wizardData.xpMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, xpMultiplier: parseFloat(e.target.value) }))}
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Taming Multiplier</span>
        </label>
        <input
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="5.0"
          value={wizardData.tamingMultiplier}
          onChange={(e) => setWizardData(prev => ({ ...prev, tamingMultiplier: parseFloat(e.target.value) }))}
        />
        <label className="label">
          <span className="label-text-alt">How fast creatures tame</span>
        </label>
      </div>
    </div>
    
    {/* Custom Dynamic Config URL */}
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">Custom Dynamic Config URL (Optional)</span>
        <div className="tooltip tooltip-right" data-tip="URL to a custom dynamic config file that will be used for all servers in this cluster">
          <span className="label-text-alt cursor-help">ℹ️</span>
        </div>
      </label>
      <input
        type="url"
        className="input input-bordered"
        placeholder="https://example.com/dynamic-config.ini"
        value={wizardData.customDynamicConfigUrl}
        onChange={(e) => setWizardData(prev => ({ ...prev, customDynamicConfigUrl: e.target.value }))}
      />
      <label className="label">
        <span className="label-text-alt">Leave empty to use default dynamic config</span>
      </label>
    </div>
    
    <div className="bg-base-300 rounded-lg p-4">
      <h3 className="font-semibold mb-2">Recommended Settings:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-semibold">Casual:</span>
          <div>Harvest: 2.0</div>
          <div>XP: 2.0</div>
          <div>Taming: 3.0</div>
        </div>
        <div>
          <span className="font-semibold">Balanced:</span>
          <div>Harvest: 3.0</div>
          <div>XP: 3.0</div>
          <div>Taming: 5.0</div>
        </div>
        <div>
          <span className="font-semibold">Fast:</span>
          <div>Harvest: 5.0</div>
          <div>XP: 5.0</div>
          <div>Taming: 10.0</div>
        </div>
      </div>
    </div>
  </div>
);

export default GameSettingsStep; 