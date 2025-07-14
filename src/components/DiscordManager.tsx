import React, { useState, useEffect } from 'react';
import { discordService, type DiscordWebhook, type DiscordBotConfig } from '../services/discord';

const DiscordManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [botConfig, setBotConfig] = useState<DiscordBotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [showBotConfig, setShowBotConfig] = useState(false);
  
  // Form states
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    channel: '',
    enabled: true
  });
  
  const [botConfigForm, setBotConfigForm] = useState({
    enabled: false,
    token: '',
    prefix: '!',
    allowedChannels: [] as string[],
    allowedRoles: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add webhook');
    }
  };

  const handleUpdateWebhook = async (id: string, updates: Partial<DiscordWebhook>) => {
    try {
      const success = await discordService.updateWebhook(id, updates);
      if (success) {
        setWebhooks(discordService.getWebhooks());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        const success = await discordService.deleteWebhook(id);
        if (success) {
          setWebhooks(discordService.getWebhooks());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete webhook');
      }
    }
  };

  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await discordService.updateBotConfig(botConfigForm);
      if (success) {
        setBotConfig(discordService.getBotConfig());
        setShowBotConfig(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bot configuration');
    }
  };

  const testWebhook = async () => {
    try {
      const success = await discordService.sendServerStatus({
        name: 'Test Server',
        status: 'online',
        players: 5,
        maxPlayers: 70,
        map: 'The Island',
        uptime: '2h 30m'
      });
      
      if (success) {
        alert('Test notification sent successfully!');
      } else {
        alert('Failed to send test notification');
      }
    } catch (err) {
      alert('Error sending test notification: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading Discord configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">Discord Integration</h1>
                <p className="text-base-content/70">
                  Manage Discord webhooks and bot configuration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError('')} className="btn btn-sm">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhooks Section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">Discord Webhooks</h2>
                <button
                  onClick={() => setShowAddWebhook(true)}
                  className="btn btn-primary btn-sm"
                >
                  ➕ Add Webhook
                </button>
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
                          <button
                            onClick={() => testWebhook()}
                            className="btn btn-xs btn-outline btn-info"
                          >
                            🧪 Test
                          </button>
                          <button
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="btn btn-xs btn-outline btn-error"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-base-content/70 mb-2">
                        Channel: {webhook.channel}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Enabled:</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={webhook.enabled}
                          onChange={(e) => handleUpdateWebhook(webhook.id, { enabled: e.target.checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bot Configuration Section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">Discord Bot</h2>
                <button
                  onClick={() => setShowBotConfig(true)}
                  className="btn btn-primary btn-sm"
                >
                  ⚙️ Configure
                </button>
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
                      <div>Prefix: {botConfig.prefix}</div>
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
        </div>

        {/* Add Webhook Modal */}
        {showAddWebhook && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Add Discord Webhook</h3>
              <form onSubmit={handleAddWebhook} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Channel Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={newWebhook.channel}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, channel: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Enabled</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={newWebhook.enabled}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  </label>
                </div>
                
                <div className="modal-action">
                  <button type="submit" className="btn btn-primary">Add Webhook</button>
                  <button
                    type="button"
                    onClick={() => setShowAddWebhook(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bot Config Modal */}
        {showBotConfig && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">Discord Bot Configuration</h3>
              <form onSubmit={handleSaveBotConfig} className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Enable Bot</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={botConfigForm.enabled}
                      onChange={(e) => setBotConfigForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  </label>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bot Token</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={botConfigForm.token}
                    onChange={(e) => setBotConfigForm(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="Enter your Discord bot token"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Command Prefix</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={botConfigForm.prefix}
                    onChange={(e) => setBotConfigForm(prev => ({ ...prev, prefix: e.target.value }))}
                    placeholder="!"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Allowed Channels (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={botConfigForm.allowedChannels.join(', ')}
                    onChange={(e) => setBotConfigForm(prev => ({ 
                      ...prev, 
                      allowedChannels: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    placeholder="general, admin, announcements"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Allowed Roles (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={botConfigForm.allowedRoles.join(', ')}
                    onChange={(e) => setBotConfigForm(prev => ({ 
                      ...prev, 
                      allowedRoles: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    placeholder="Admin, Moderator, Server Manager"
                  />
                </div>
                
                <div className="modal-action">
                  <button type="submit" className="btn btn-primary">Save Configuration</button>
                  <button
                    type="button"
                    onClick={() => setShowBotConfig(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordManager; 