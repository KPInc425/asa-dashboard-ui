import React from 'react';
import type { StepProps } from '../../types/provisioning';

const GameSettingsStep: React.FC<StepProps> = ({ wizardData, setWizardData }) => {
  const updateGameSetting = (field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      gameSettings: {
        ...prev.gameSettings,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Game Settings</h2>
      
      {/* Basic Multipliers */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Basic Multipliers</h3>
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
              placeholder="2.0"
              value={wizardData.gameSettings.harvestMultiplier}
              onChange={(e) => updateGameSetting('harvestMultiplier', parseFloat(e.target.value) || 2.0)}
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
              placeholder="2.0"
              value={wizardData.gameSettings.xpMultiplier}
              onChange={(e) => updateGameSetting('xpMultiplier', parseFloat(e.target.value) || 2.0)}
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
              placeholder="3.0"
              value={wizardData.gameSettings.tamingMultiplier}
              onChange={(e) => updateGameSetting('tamingMultiplier', parseFloat(e.target.value) || 3.0)}
            />
            <label className="label">
              <span className="label-text-alt">How fast creatures tame</span>
            </label>
          </div>
        </div>
      </div>

      {/* Breeding Settings */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Breeding Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Mating Interval Multiplier</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="0.5"
              value={wizardData.gameSettings.matingIntervalMultiplier}
              onChange={(e) => updateGameSetting('matingIntervalMultiplier', parseFloat(e.target.value) || 0.5)}
            />
            <label className="label">
              <span className="label-text-alt">Lower = faster breeding</span>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Egg Hatch Speed Multiplier</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="10.0"
              value={wizardData.gameSettings.eggHatchSpeedMultiplier}
              onChange={(e) => updateGameSetting('eggHatchSpeedMultiplier', parseFloat(e.target.value) || 10.0)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Baby Mature Speed Multiplier</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="20.0"
              value={wizardData.gameSettings.babyMatureSpeedMultiplier}
              onChange={(e) => updateGameSetting('babyMatureSpeedMultiplier', parseFloat(e.target.value) || 20.0)}
            />
          </div>
        </div>
      </div>

      {/* Time Settings */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Time Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Day Cycle Speed Scale</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="1.0"
              value={wizardData.gameSettings.dayCycleSpeedScale}
              onChange={(e) => updateGameSetting('dayCycleSpeedScale', parseFloat(e.target.value) || 1.0)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Day Time Speed Scale</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="1.0"
              value={wizardData.gameSettings.dayTimeSpeedScale}
              onChange={(e) => updateGameSetting('dayTimeSpeedScale', parseFloat(e.target.value) || 1.0)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Night Time Speed Scale</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="input input-bordered"
              placeholder="1.0"
              value={wizardData.gameSettings.nightTimeSpeedScale}
              onChange={(e) => updateGameSetting('nightTimeSpeedScale', parseFloat(e.target.value) || 1.0)}
            />
          </div>
        </div>
      </div>

      {/* Damage Settings */}
      <div className="bg-base-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">Damage & Resistance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Dino Damage Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.dinoDamageMultiplier}
                onChange={(e) => updateGameSetting('dinoDamageMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Player Damage Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.playerDamageMultiplier}
                onChange={(e) => updateGameSetting('playerDamageMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Structure Damage Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.structureDamageMultiplier}
                onChange={(e) => updateGameSetting('structureDamageMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Player Resistance Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.playerResistanceMultiplier}
                onChange={(e) => updateGameSetting('playerResistanceMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Dino Resistance Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.dinoResistanceMultiplier}
                onChange={(e) => updateGameSetting('dinoResistanceMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Structure Resistance Multiplier</span>
              </label>
              <input
                type="number"
                step="0.1"
                className="input input-bordered"
                placeholder="1.0"
                value={wizardData.gameSettings.structureResistanceMultiplier}
                onChange={(e) => updateGameSetting('structureResistanceMultiplier', parseFloat(e.target.value) || 1.0)}
              />
            </div>
          </div>
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
};

export default GameSettingsStep; 