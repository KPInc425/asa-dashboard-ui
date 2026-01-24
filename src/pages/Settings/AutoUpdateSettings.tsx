import React, { useState, useEffect, useCallback } from 'react';
import { autoUpdateApi } from '../../services/api-auto-update';
import type {
  AutoUpdateConfig,
  AutoUpdateSettingsProps,
  NotificationChannel
} from '../../types/autoUpdate';

/**
 * AutoUpdateSettings Component
 * 
 * Full settings page/panel for configuring auto-update options.
 * Includes notification channels, warning schedules, message templates, and more.
 */
const AutoUpdateSettings: React.FC<AutoUpdateSettingsProps> = ({
  onSave,
  onCancel
}) => {
  // Form state
  const [config, setConfig] = useState<AutoUpdateConfig>({
    enabled: false,
    checkIntervalMinutes: 60,
    updateIfEmpty: true,
    forceUpdate: false,
    notifications: {
      rcon: true,
      discord: true,
      socket: true
    },
    warningMinutes: [30, 10, 5, 1],
    messageTemplates: {
      rcon: {
        warning: 'Server will restart for update in {time} minutes',
        updating: 'Server is now updating. Please wait...',
        completed: 'Server update completed successfully!',
        failed: 'Server update failed. Please contact an administrator.'
      },
      discord: {
        warning: '⚠️ **{serverName}** will restart for update in **{time} minutes**',
        updating: '🔄 **{serverName}** is now updating...',
        completed: '✅ **{serverName}** update completed successfully!',
        failed: '❌ **{serverName}** update failed: {error}'
      }
    },
    servers: {}
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    notifications: true,
    warnings: true,
    templates: false,
    advanced: false
  });

  // New warning minute input
  const [newWarningMinute, setNewWarningMinute] = useState('');

  // Test notification state
  const [testingChannel, setTestingChannel] = useState<NotificationChannel | null>(null);
  const [testResult, setTestResult] = useState<{ channel: NotificationChannel; success: boolean; message: string } | null>(null);

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await autoUpdateApi.getConfig();
        if (response.success) {
          setConfig(response.config);
        } else {
          setError(response.message || 'Failed to load configuration');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Track changes
  const updateConfig = useCallback((updates: Partial<AutoUpdateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
    setSuccess(null);
  }, []);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle notification channel toggle
  const toggleNotificationChannel = (channel: NotificationChannel) => {
    updateConfig({
      notifications: {
        ...config.notifications,
        [channel]: !config.notifications[channel]
      }
    });
  };

  // Add warning minute
  const addWarningMinute = () => {
    const minute = parseInt(newWarningMinute, 10);
    if (isNaN(minute) || minute <= 0 || minute > 1440) {
      return;
    }
    if (config.warningMinutes.includes(minute)) {
      return;
    }
    const newWarnings = [...config.warningMinutes, minute].sort((a, b) => b - a);
    updateConfig({ warningMinutes: newWarnings });
    setNewWarningMinute('');
  };

  // Remove warning minute
  const removeWarningMinute = (minute: number) => {
    const newWarnings = config.warningMinutes.filter(m => m !== minute);
    updateConfig({ warningMinutes: newWarnings });
  };

  // Update message template
  const updateTemplate = (
    channel: 'rcon' | 'discord',
    type: 'warning' | 'updating' | 'completed' | 'failed',
    value: string
  ) => {
    updateConfig({
      messageTemplates: {
        ...config.messageTemplates,
        [channel]: {
          ...config.messageTemplates[channel],
          [type]: value
        }
      }
    });
  };

  // Save configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await autoUpdateApi.updateConfig(config);
      
      if (response.success) {
        setSuccess('Configuration saved successfully!');
        setHasChanges(false);
        onSave?.();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Test notification
  const handleTestNotification = async (channel: NotificationChannel) => {
    try {
      setTestingChannel(channel);
      setTestResult(null);
      
      const response = await autoUpdateApi.testNotification(channel);
      
      setTestResult({
        channel,
        success: response.success,
        message: response.message || (response.success ? 'Test sent successfully!' : 'Failed to send test')
      });
    } catch (err) {
      setTestResult({
        channel,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send test notification'
      });
    } finally {
      setTestingChannel(null);
    }
  };

  // Preview template with placeholders replaced
  const previewTemplate = (template: string): string => {
    return template
      .replace(/{time}/g, '5')
      .replace(/{serverName}/g, 'TheIsland')
      .replace(/{error}/g, 'Connection timeout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading auto-update settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Auto-Update Settings</h2>
          <p className="text-sm text-base-content/70 mt-1">
            Configure automatic server updates and notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${config.enabled ? 'badge-success' : 'badge-error'}`}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Section 1: Global Enable/Disable */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-lg"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
              />
              <div>
                <span className="label-text font-semibold text-lg">Enable Auto-Update</span>
                <p className="text-sm text-base-content/70">
                  Automatically check and apply server updates
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Notification Channels */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('notifications')}
          >
            <h3 className="card-title">Notification Channels</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${expandedSections.notifications ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.notifications && (
            <div className="mt-4 space-y-4">
              {/* RCON Channel */}
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🖥️</span>
                  </div>
                  <div>
                    <div className="font-medium">RCON Broadcast</div>
                    <div className="text-sm text-base-content/70">In-game server messages</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleTestNotification('rcon')}
                    disabled={testingChannel === 'rcon' || !config.notifications.rcon}
                  >
                    {testingChannel === 'rcon' ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Test'
                    )}
                  </button>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.rcon}
                    onChange={() => toggleNotificationChannel('rcon')}
                  />
                </div>
              </div>

              {/* Discord Channel */}
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5865F2]/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💬</span>
                  </div>
                  <div>
                    <div className="font-medium">Discord Webhook</div>
                    <div className="text-sm text-base-content/70">Discord channel notifications</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleTestNotification('discord')}
                    disabled={testingChannel === 'discord' || !config.notifications.discord}
                  >
                    {testingChannel === 'discord' ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Test'
                    )}
                  </button>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.discord}
                    onChange={() => toggleNotificationChannel('discord')}
                  />
                </div>
              </div>

              {/* Socket Channel */}
              <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔌</span>
                  </div>
                  <div>
                    <div className="font-medium">WebSocket Events</div>
                    <div className="text-sm text-base-content/70">Real-time dashboard updates</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleTestNotification('socket')}
                    disabled={testingChannel === 'socket' || !config.notifications.socket}
                  >
                    {testingChannel === 'socket' ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Test'
                    )}
                  </button>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.notifications.socket}
                    onChange={() => toggleNotificationChannel('socket')}
                  />
                </div>
              </div>

              {/* Test result display */}
              {testResult && (
                <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'} mt-2`}>
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Warning Schedule */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('warnings')}
          >
            <h3 className="card-title">Warning Schedule</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${expandedSections.warnings ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.warnings && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-base-content/70">
                Configure when warning messages are sent before an update begins.
              </p>

              {/* Warning chips */}
              <div className="flex flex-wrap gap-2">
                {config.warningMinutes.map(minute => (
                  <div
                    key={minute}
                    className="badge badge-lg badge-primary gap-2"
                  >
                    <span>{minute} min</span>
                    <button
                      className="btn btn-ghost btn-xs p-0"
                      onClick={() => removeWarningMinute(minute)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new warning */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input input-bordered input-sm w-24"
                  placeholder="Minutes"
                  value={newWarningMinute}
                  onChange={(e) => setNewWarningMinute(e.target.value)}
                  min="1"
                  max="1440"
                  onKeyPress={(e) => e.key === 'Enter' && addWarningMinute()}
                />
                <button
                  className="btn btn-sm btn-outline btn-primary"
                  onClick={addWarningMinute}
                  disabled={!newWarningMinute || parseInt(newWarningMinute, 10) <= 0}
                >
                  Add Warning
                </button>
              </div>

              <div className="text-xs text-base-content/50">
                Warnings are sent at these intervals before the update begins (in minutes).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Message Templates */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('templates')}
          >
            <h3 className="card-title">Message Templates</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${expandedSections.templates ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.templates && (
            <div className="mt-4 space-y-6">
              <div className="text-sm text-base-content/70 mb-2">
                <strong>Available placeholders:</strong>{' '}
                <code className="text-xs bg-base-200 px-1 rounded">{'{time}'}</code> - minutes remaining,{' '}
                <code className="text-xs bg-base-200 px-1 rounded">{'{serverName}'}</code> - server name,{' '}
                <code className="text-xs bg-base-200 px-1 rounded">{'{error}'}</code> - error message
              </div>

              {/* RCON Templates */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title font-medium">
                  🖥️ RCON Messages
                </div>
                <div className="collapse-content space-y-4">
                  {(['warning', 'updating', 'completed', 'failed'] as const).map(type => (
                    <div key={type} className="form-control">
                      <label className="label">
                        <span className="label-text font-medium capitalize">{type}</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        rows={2}
                        value={config.messageTemplates.rcon[type]}
                        onChange={(e) => updateTemplate('rcon', type, e.target.value)}
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          Preview: {previewTemplate(config.messageTemplates.rcon[type])}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discord Templates */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="checkbox" />
                <div className="collapse-title font-medium">
                  💬 Discord Messages
                </div>
                <div className="collapse-content space-y-4">
                  {(['warning', 'updating', 'completed', 'failed'] as const).map(type => (
                    <div key={type} className="form-control">
                      <label className="label">
                        <span className="label-text font-medium capitalize">{type}</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        rows={2}
                        value={config.messageTemplates.discord[type]}
                        onChange={(e) => updateTemplate('discord', type, e.target.value)}
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/50">
                          Preview: {previewTemplate(config.messageTemplates.discord[type])}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Advanced Options */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('advanced')}
          >
            <h3 className="card-title">Advanced Options</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expandedSections.advanced && (
            <div className="mt-4 space-y-4">
              {/* Check Interval */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Check Interval (minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-32"
                  value={config.checkIntervalMinutes}
                  onChange={(e) => updateConfig({ checkIntervalMinutes: parseInt(e.target.value, 10) || 60 })}
                  min="5"
                  max="1440"
                />
                <label className="label">
                  <span className="label-text-alt">How often to check for updates (minimum 5 minutes)</span>
                </label>
              </div>

              {/* Update if Empty */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={config.updateIfEmpty}
                    onChange={(e) => updateConfig({ updateIfEmpty: e.target.checked })}
                  />
                  <div>
                    <span className="label-text font-semibold">Update Only When Empty</span>
                    <p className="text-sm text-base-content/70">
                      Only apply updates when no players are online
                    </p>
                  </div>
                </label>
              </div>

              {/* Force Update */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={config.forceUpdate}
                    onChange={(e) => updateConfig({ forceUpdate: e.target.checked })}
                  />
                  <div>
                    <span className="label-text font-semibold">Force Update</span>
                    <p className="text-sm text-base-content/70">
                      Skip waiting for empty server (use with caution)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-base-200">
        <div>
          {hasChanges && (
            <span className="text-sm text-warning">You have unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateSettings;
