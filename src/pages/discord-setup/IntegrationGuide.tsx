import React from 'react';

const IntegrationGuide: React.FC = () => {
  return (
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
                      <p className="text-sm text-base-content/70">Copy the webhook URL from the Discord webhook settings</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-content">
                      <h4 className="font-medium">3. Add to Dashboard</h4>
                      <p className="text-sm text-base-content/70">Click "Add Webhook" above and paste the URL with a descriptive name</p>
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
                      <p className="text-sm text-base-content/70">Go to Bot section → Add Bot → Copy the bot token</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-content">
                      <h4 className="font-medium">3. Enable Slash Commands</h4>
                      <p className="text-sm text-base-content/70">Go to Bot section → Enable "Message Content Intent" and "Server Members Intent"</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-content">
                      <h4 className="font-medium">4. Invite Bot to Server</h4>
                      <p className="text-sm text-base-content/70">Go to OAuth2 → URL Generator → Select "bot" and "applications.commands" scopes → Use the generated URL</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-content">
                      <h4 className="font-medium">5. Configure in Dashboard</h4>
                      <p className="text-sm text-base-content/70">Click "Configure Bot" above and enter the bot token and application ID</p>
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
                      <tr><td className="font-mono">/servers</td><td>List all servers and their status</td><td className="font-mono">/servers</td></tr>
                      <tr><td className="font-mono">/start [server]</td><td>Start a specific server</td><td className="font-mono">/start TheIsland</td></tr>
                      <tr><td className="font-mono">/stop [server]</td><td>Stop a specific server</td><td className="font-mono">/stop TheIsland</td></tr>
                      <tr><td className="font-mono">/restart [server]</td><td>Restart a specific server</td><td className="font-mono">/restart TheIsland</td></tr>
                      <tr><td className="font-mono">/status [server]</td><td>Get detailed status of a server</td><td className="font-mono">/status TheIsland</td></tr>
                      <tr><td className="font-mono">/players [server]</td><td>Show current players on a server</td><td className="font-mono">/players TheIsland</td></tr>
                      <tr><td className="font-mono">/help</td><td>Show all available commands</td><td className="font-mono">/help</td></tr>
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
  );
};

export default IntegrationGuide;
