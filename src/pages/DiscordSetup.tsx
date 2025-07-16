import React, { useState, useEffect } from 'react';
import { discordService, type DiscordWebhook, type DiscordBotConfig } from '../services/discord';

const DiscordSetup: React.FC = () => {
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [botConfig, setBotConfig] = useState<DiscordBotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    applicationId: '',
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
        setSuccess('Webhook added successfully!');
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
        setSuccess('Webhook updated successfully!');
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
          setSuccess('Webhook deleted successfully!');
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
        setSuccess('Bot configuration saved successfully!');
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
        </div>

        {/* Documentation Section */}
        <div className="mt-8">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">📚 Discord Integration Guide</h2>
              
              <div className="space-y-6">
                {/* Webhook Setup */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🔗 Setting Up Webhooks</h3>
                  <div className="bg-base-200 rounded-lg p-4 space-y-3">
                    <div className="steps steps-vertical">
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">1. Create a Discord Webhook</h4>
                          <p className="text-sm text-base-content/70">
                            Go to your Discord server → Server Settings → Integrations → Webhooks → New Webhook
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">2. Copy the Webhook URL</h4>
                          <p className="text-sm text-base-content/70">
                            Copy the webhook URL from the Discord webhook settings
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">3. Add to Dashboard</h4>
                          <p className="text-sm text-base-content/70">
                            Click "Add Webhook" above and paste the URL with a descriptive name
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bot Setup */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🤖 Setting Up Discord Bot</h3>
                  <div className="bg-base-200 rounded-lg p-4 space-y-3">
                    <div className="steps steps-vertical">
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">1. Create a Discord Application</h4>
                          <p className="text-sm text-base-content/70">
                            Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="link link-primary">Discord Developer Portal</a> → New Application
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">2. Create a Bot</h4>
                          <p className="text-sm text-base-content/70">
                            Go to Bot section → Add Bot → Copy the bot token
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">3. Enable Slash Commands</h4>
                          <p className="text-sm text-base-content/70">
                            Go to Bot section → Enable "Message Content Intent" and "Server Members Intent"
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">4. Invite Bot to Server</h4>
                          <p className="text-sm text-base-content/70">
                            Go to OAuth2 → URL Generator → Select "bot" and "applications.commands" scopes → Use the generated URL
                          </p>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-content">
                          <h4 className="font-medium">5. Configure in Dashboard</h4>
                          <p className="text-sm text-base-content/70">
                            Click "Configure Bot" above and enter the bot token and application ID
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bot Commands */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">⌨️ Available Bot Commands</h3>
                  <div className="bg-base-200 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="table table-zebra table-sm">
                        <thead>
                          <tr>
                            <th>Command</th>
                            <th>Description</th>
                            <th>Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-mono">/servers</td>
                            <td>List all servers and their status</td>
                            <td className="font-mono">/servers</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/start [server]</td>
                            <td>Start a specific server</td>
                            <td className="font-mono">/start TheIsland</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/stop [server]</td>
                            <td>Stop a specific server</td>
                            <td className="font-mono">/stop TheIsland</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/restart [server]</td>
                            <td>Restart a specific server</td>
                            <td className="font-mono">/restart TheIsland</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/status [server]</td>
                            <td>Get detailed status of a server</td>
                            <td className="font-mono">/status TheIsland</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/players [server]</td>
                            <td>Show current players on a server</td>
                            <td className="font-mono">/players TheIsland</td>
                          </tr>
                          <tr>
                            <td className="font-mono">/help</td>
                            <td>Show all available commands</td>
                            <td className="font-mono">/help</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🔔 Notification Types</h3>
                  <div className="bg-base-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Server Events</h4>
                        <ul className="text-sm space-y-1 text-base-content/70">
                          <li>• Server start/stop</li>
                          <li>• Server crashes</li>
                          <li>• Server status changes</li>
                          <li>• Auto-shutdown warnings</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Player Events</h4>
                        <ul className="text-sm space-y-1 text-base-content/70">
                          <li>• Player joins/leaves</li>
                          <li>• Player count updates</li>
                          <li>• Server population alerts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Webhook Modal */}
        {showAddWebhook && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Add Discord Webhook</h3>
              <form onSubmit={handleAddWebhook}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Server Notifications"
                    className="input input-bordered"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    className="input input-bordered"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Channel Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., #server-status"
                    className="input input-bordered"
                    value={newWebhook.channel}
                    onChange={(e) => setNewWebhook({ ...newWebhook, channel: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-action">
                  <button type="button" className="btn" onClick={() => setShowAddWebhook(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Webhook
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bot Config Modal */}
        {showBotConfig && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Configure Discord Bot</h3>
              <form onSubmit={handleSaveBotConfig}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bot Token</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your Discord bot token"
                    className="input input-bordered"
                    value={botConfigForm.token}
                    onChange={(e) => setBotConfigForm({ ...botConfigForm, token: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Application ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your Discord application ID"
                    className="input input-bordered"
                    value={botConfigForm.applicationId}
                    onChange={(e) => setBotConfigForm({ ...botConfigForm, applicationId: e.target.value })}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">Found in Discord Developer Portal → General Information</span>
                  </label>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Enable Bot</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={botConfigForm.enabled}
                      onChange={(e) => setBotConfigForm({ ...botConfigForm, enabled: e.target.checked })}
                    />
                  </label>
                </div>
                <div className="modal-action">
                  <button type="button" className="btn" onClick={() => setShowBotConfig(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Configuration
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

export default DiscordSetup; 