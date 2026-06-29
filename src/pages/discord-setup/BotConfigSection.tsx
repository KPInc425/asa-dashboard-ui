import React from 'react';
import type { DiscordBotConfig } from '../../services/discord';

interface BotConfigSectionProps {
  botConfig: DiscordBotConfig | null;
  onConfigure: () => void;
}

const BotConfigSection: React.FC<BotConfigSectionProps> = ({ botConfig, onConfigure }) => {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">Discord Bot</h2>
          <button onClick={onConfigure} className="btn btn-primary btn-sm">⚙️ Configure</button>
        </div>

        {botConfig ? (
          <div className="space-y-4">
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Bot Status</h3>
                <div className={`badge ${botConfig.enabled ? 'badge-success' : 'badge-error'}`}>
                  {botConfig.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="text-sm text-base-content/70">
                <div>Application ID: {botConfig.applicationId || 'Not set'}</div>
                <div>Allowed Channels: {botConfig.allowedChannels.length}</div>
                <div>Allowed Roles: {botConfig.allowedRoles.length}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/50">
            <div className="text-4xl mb-4">🤖</div>
            <p>Discord bot not configured</p>
            <p className="text-sm">Configure the bot to allow Discord commands</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotConfigSection;
