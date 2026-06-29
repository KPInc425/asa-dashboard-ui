import React from 'react';
import type { DiscordWebhook } from '../../services/discord';

interface WebhooksSectionProps {
  webhooks: DiscordWebhook[];
  onAdd: () => void;
  onTest: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const WebhooksSection: React.FC<WebhooksSectionProps> = ({ webhooks, onAdd, onTest, onDelete, onToggle }) => {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">Discord Webhooks</h2>
          <button onClick={onAdd} className="btn btn-primary btn-sm">➕ Add Webhook</button>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <div className="text-4xl mb-4">🔗</div>
            <p>No Discord webhooks configured</p>
            <p className="text-sm">Add a webhook to receive server notifications in Discord</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="bg-base-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{webhook.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={onTest} className="btn btn-xs btn-outline btn-info">🧪 Test</button>
                    <button onClick={() => onDelete(webhook.id)} className="btn btn-xs btn-outline btn-error">🗑️</button>
                  </div>
                </div>
                <div className="text-sm text-base-content/70 mb-2">Channel: {webhook.channel}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Enabled:</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={webhook.enabled}
                    onChange={(e) => onToggle(webhook.id, e.target.checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhooksSection;
