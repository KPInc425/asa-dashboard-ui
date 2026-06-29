import React, { useState, useEffect } from 'react';
import { discordService, type DiscordWebhook, type DiscordBotConfig } from '../../services/discord';
import { useConfirm } from '../../contexts/ConfirmContext2';
import type { DiscordWebhookForm, DiscordBotConfigForm } from './types';
import WebhooksSection from './WebhooksSection';
import BotConfigSection from './BotConfigSection';
import AddWebhookModal from './AddWebhookModal';
import BotConfigModal from './BotConfigModal';
import IntegrationGuide from './IntegrationGuide';

const DiscordSetup: React.FC = () => {
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [botConfig, setBotConfig] = useState<DiscordBotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [showBotConfig, setShowBotConfig] = useState(false);
  const { showConfirm } = useConfirm();

  const [newWebhook, setNewWebhook] = useState<DiscordWebhookForm>({
    name: '', url: '', channel: '', enabled: true
  });

  const [botConfigForm, setBotConfigForm] = useState<DiscordBotConfigForm>({
    enabled: false, token: '', applicationId: '', allowedChannels: [], allowedRoles: []
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await discordService.initialize();
      setWebhooks(discordService.getWebhooks());
      setBotConfig(discordService.getBotConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Discord configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const webhook = await discordService.addWebhook(newWebhook);
      if (webhook) {
        setWebhooks(discordService.getWebhooks());
        setShowAddWebhook(false);
        setNewWebhook({ name: '', url: '', channel: '', enabled: true });
        setSuccess('Webhook added successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add webhook');
    }
  };

  const handleUpdateWebhook = async (id: string, updates: Partial<DiscordWebhook>) => {
    try {
      const successResult = await discordService.updateWebhook(id, updates);
      if (successResult) {
        setWebhooks(discordService.getWebhooks());
        setSuccess('Webhook updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const proceed = await showConfirm('Are you sure you want to delete this webhook?');
    if (!proceed) return;
    try {
      const successResult = await discordService.deleteWebhook(id);
      if (successResult) {
        setWebhooks(discordService.getWebhooks());
        setSuccess('Webhook deleted successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    }
  };

  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const successResult = await discordService.updateBotConfig(botConfigForm);
      if (successResult) {
        setBotConfig(discordService.getBotConfig());
        setShowBotConfig(false);
        setSuccess('Bot configuration saved successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bot configuration');
    }
  };

  const testWebhook = async () => {
    try {
      const successResult = await discordService.sendServerStatus({
        name: 'Test Server', status: 'online', players: 5, maxPlayers: 70, map: 'The Island', uptime: '2h 30m'
      });
      if (successResult) {
        setSuccess('Test notification sent successfully!');
      } else {
        setError('Failed to send test notification');
      }
    } catch (err) {
      setError('Error sending test notification: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-base-content/70">Loading Discord configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">Discord Integration</h1>
          <p className="mt-2 text-base-content/70">
            Configure Discord webhooks and bot commands for server notifications
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WebhooksSection
            webhooks={webhooks}
            onAdd={() => setShowAddWebhook(true)}
            onTest={testWebhook}
            onDelete={handleDeleteWebhook}
            onToggle={(id, enabled) => handleUpdateWebhook(id, { enabled })}
          />
          <BotConfigSection
            botConfig={botConfig}
            onConfigure={() => setShowBotConfig(true)}
          />
        </div>

        <IntegrationGuide />

        {showAddWebhook && (
          <AddWebhookModal
            form={newWebhook}
            onChange={(updates) => setNewWebhook(prev => ({ ...prev, ...updates }))}
            onSubmit={handleAddWebhook}
            onClose={() => setShowAddWebhook(false)}
          />
        )}

        {showBotConfig && (
          <BotConfigModal
            form={botConfigForm}
            onChange={(updates) => setBotConfigForm(prev => ({ ...prev, ...updates }))}
            onSubmit={handleSaveBotConfig}
            onClose={() => setShowBotConfig(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DiscordSetup;
