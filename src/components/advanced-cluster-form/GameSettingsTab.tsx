import React from 'react';
import type { ClusterForm } from './types';

interface GameSettingsTabProps {
  form: ClusterForm;
  updateGlobalSetting: (section: "gameIni" | "gameUserSettings", subsection: string, key: string, value: any) => void;
}

const GameSettingsTab: React.FC<GameSettingsTabProps> = ({ form, updateGlobalSetting }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Game Settings</h3>

      {/* Server Settings */}
      <div>
        <h4 className="font-medium mb-3">Server Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Players</label>
            <input
              type="number"
              value={form.globalSettings.gameUserSettings.ServerSettings.MaxPlayers}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'MaxPlayers', parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty Offset</label>
            <input
              type="number"
              step="0.1"
              value={form.globalSettings.gameUserSettings.ServerSettings.DifficultyOffset}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'DifficultyOffset', parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Harvest Amount Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={form.globalSettings.gameUserSettings.ServerSettings.HarvestAmountMultiplier}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'HarvestAmountMultiplier', parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Taming Speed Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={form.globalSettings.gameUserSettings.ServerSettings.TamingSpeedMultiplier}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'TamingSpeedMultiplier', parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">XP Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={form.globalSettings.gameUserSettings.ServerSettings.XPMultiplier}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'XPMultiplier', parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Baby Mature Speed Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={form.globalSettings.gameUserSettings.ServerSettings.BabyMatureSpeedMultiplier}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'ServerSettings', 'BabyMatureSpeedMultiplier', parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Session Settings */}
      <div>
        <h4 className="font-medium mb-3">Session Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Session Name</label>
            <input
              type="text"
              value={form.globalSettings.gameUserSettings.SessionSettings.SessionName}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'SessionName', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Server Password</label>
            <input
              type="text"
              value={form.globalSettings.gameUserSettings.SessionSettings.ServerPassword}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'ServerPassword', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Leave empty for no password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Password</label>
            <input
              type="text"
              value={form.globalSettings.gameUserSettings.SessionSettings.ServerAdminPassword}
              onChange={(e) => updateGlobalSetting('gameUserSettings', 'SessionSettings', 'ServerAdminPassword', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsTab;
