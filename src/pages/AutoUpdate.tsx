import React, { startTransition, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/LoadingSpinner';
import { useServers } from '../hooks/useServerData';
import { autoUpdateApi } from '../services/api-auto-update';
import { DEFAULT_SERVER_CONFIG, type AutoUpdateServerConfig, type UpdateStatus } from '../types/autoUpdate';

type MessageState = {
  type: 'success' | 'error';
  text: string;
} | null;

const schedulerQueryKey = ['auto-update', 'scheduler'];
const statusQueryKey = ['auto-update', 'status'];
const configQueryKey = (serverNames: string[]) => ['auto-update', 'configs', ...serverNames];

function getStatusBadgeClass(status: UpdateStatus | string | undefined) {
  switch (status) {
    case 'available':
      return 'badge-warning';
    case 'warning':
      return 'badge-info';
    case 'updating':
      return 'badge-primary';
    case 'completed':
      return 'badge-success';
    case 'failed':
      return 'badge-error';
    default:
      return 'badge-ghost';
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

const AutoUpdate: React.FC = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<MessageState>(null);
  const [schedulerBusy, setSchedulerBusy] = useState(false);
  const [globalBusy, setGlobalBusy] = useState(false);
  const [serverBusy, setServerBusy] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, AutoUpdateServerConfig>>({});

  const {
    data: servers = [],
    isLoading: serversLoading,
    error: serversError,
  } = useServers({
    refetchInterval: 30_000,
  });

  const serverNames = useMemo(
    () => servers.map((server) => server.name).sort((left, right) => left.localeCompare(right)),
    [servers]
  );

  const schedulerQuery = useQuery({
    queryKey: schedulerQueryKey,
    queryFn: autoUpdateApi.getConfig,
  });

  const statusQuery = useQuery({
    queryKey: statusQueryKey,
    queryFn: autoUpdateApi.getAllStatus,
    refetchInterval: 30_000,
  });

  const serverConfigQuery = useQuery({
    queryKey: configQueryKey(serverNames),
    enabled: serverNames.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        serverNames.map(async (serverName) => {
          const response = await autoUpdateApi.getServerConfig(serverName);
          return [serverName, response.config] as const;
        })
      );

      return Object.fromEntries(entries) as Record<string, AutoUpdateServerConfig>;
    },
  });

  useEffect(() => {
    if (!serverConfigQuery.data) {
      return;
    }

    startTransition(() => {
      setDrafts(serverConfigQuery.data);
    });
  }, [serverConfigQuery.data]);

  const isLoading =
    serversLoading ||
    schedulerQuery.isLoading ||
    statusQuery.isLoading ||
    (serverNames.length > 0 && serverConfigQuery.isLoading);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const schedulerEnabled = schedulerQuery.data?.config.enabled ?? false;
  const statusMap = statusQuery.data?.servers ?? {};
  const serverConfigMap = serverConfigQuery.data ?? {};
  const pageError =
    (serversError instanceof Error && serversError.message) ||
    (schedulerQuery.error instanceof Error && schedulerQuery.error.message) ||
    (statusQuery.error instanceof Error && statusQuery.error.message) ||
    (serverConfigQuery.error instanceof Error && serverConfigQuery.error.message) ||
    null;

  async function refreshAutoUpdateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: schedulerQueryKey }),
      queryClient.invalidateQueries({ queryKey: statusQueryKey }),
      queryClient.invalidateQueries({ queryKey: configQueryKey(serverNames) }),
    ]);
  }

  function updateDraft(serverName: string, updates: Partial<AutoUpdateServerConfig>) {
    setDrafts((previous) => ({
      ...previous,
      [serverName]: {
        ...(previous[serverName] ?? { ...DEFAULT_SERVER_CONFIG, serverName }),
        ...updates,
      },
    }));
    setMessage(null);
  }

  async function handleSchedulerToggle() {
    try {
      setSchedulerBusy(true);
      setMessage(null);
      const response = await autoUpdateApi.updateConfig({ enabled: !schedulerEnabled });
      await refreshAutoUpdateData();
      setMessage({
        type: 'success',
        text: response.config.enabled ? 'Auto-update scheduler started.' : 'Auto-update scheduler stopped.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update scheduler state.',
      });
    } finally {
      setSchedulerBusy(false);
    }
  }

  async function handleCheckAll() {
    try {
      setGlobalBusy(true);
      setMessage(null);
      const response = await autoUpdateApi.checkAllForUpdates();
      await refreshAutoUpdateData();
      setMessage({
        type: 'success',
        text: response.success ? 'Triggered update checks for enabled servers.' : 'Update checks did not start.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to trigger update checks.',
      });
    } finally {
      setGlobalBusy(false);
    }
  }

  async function handleServerAction(
    serverName: string,
    action: 'save' | 'check' | 'run-now',
    operation: () => Promise<void>
  ) {
    try {
      setServerBusy((previous) => ({ ...previous, [serverName]: action }));
      setMessage(null);
      await operation();
      await refreshAutoUpdateData();

      const successText =
        action === 'save'
          ? `Saved auto-update settings for ${serverName}.`
          : action === 'check'
            ? `Triggered update check for ${serverName}.`
            : `Triggered update flow for ${serverName}.`;

      setMessage({ type: 'success', text: successText });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `Failed to ${action} ${serverName}.`,
      });
    } finally {
      setServerBusy((previous) => {
        const next = { ...previous };
        delete next[serverName];
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <section className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Auto-Update</h1>
              <p className="text-sm md:text-base text-base-content/70 max-w-3xl">
                Configure automatic update checks, decide whether servers should update on start,
                and control whether they restart automatically after the update completes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${schedulerEnabled ? 'badge-success' : 'badge-ghost'} badge-lg`}>
                {schedulerEnabled ? 'Scheduler Running' : 'Scheduler Stopped'}
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSchedulerToggle}
                disabled={schedulerBusy}
              >
                {schedulerBusy ? <span className="loading loading-spinner loading-xs"></span> : null}
                {schedulerEnabled ? 'Stop Scheduler' : 'Start Scheduler'}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleCheckAll}
                disabled={globalBusy}
              >
                {globalBusy ? <span className="loading loading-spinner loading-xs"></span> : null}
                Check Enabled Servers Now
              </button>
            </div>
          </div>
        </section>

        {pageError ? (
          <div className="alert alert-error">
            <span>{pageError}</span>
          </div>
        ) : null}

        {message ? (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span>{message.text}</span>
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4">
            <div className="text-sm text-base-content/70">Servers Discovered</div>
            <div className="text-2xl font-bold text-primary">{servers.length}</div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4">
            <div className="text-sm text-base-content/70">Auto-Update Enabled</div>
            <div className="text-2xl font-bold text-success">
              {serverNames.filter((serverName) => (drafts[serverName] ?? serverConfigMap[serverName])?.enabled).length}
            </div>
          </div>
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4">
            <div className="text-sm text-base-content/70">Updates Available</div>
            <div className="text-2xl font-bold text-warning">
              {Object.values(statusMap).filter((status) => status.updateAvailable).length}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {servers.length === 0 ? (
            <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🔄</div>
              <h2 className="text-xl font-semibold mb-2">No servers available yet</h2>
              <p className="text-base-content/70">
                Create or import a server first. The scheduler can already be started, but per-server
                auto-update controls appear here once servers exist.
              </p>
            </div>
          ) : (
            servers.map((server) => {
              const originalConfig = serverConfigMap[server.name] ?? { ...DEFAULT_SERVER_CONFIG, serverName: server.name };
              const draft = drafts[server.name] ?? originalConfig;
              const status = statusMap[server.name];
              const busyAction = serverBusy[server.name];
              const isDirty = JSON.stringify(draft) !== JSON.stringify(originalConfig);

              return (
                <article
                  key={server.name}
                  className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 md:p-6 space-y-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-primary">{server.name}</h2>
                        <span className="badge badge-outline">{server.type}</span>
                        <span className={`badge ${getStatusBadgeClass(status?.status)}`}>
                          {status?.status ?? 'idle'}
                        </span>
                        {status?.updateAvailable ? <span className="badge badge-warning">Update available</span> : null}
                      </div>
                      <p className="text-sm text-base-content/70">
                        Last check: {formatDateTime(status?.lastCheck)}. Last update: {formatDateTime(draft.lastUpdate)}.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          handleServerAction(server.name, 'check', async () => {
                            await autoUpdateApi.checkForUpdates(server.name);
                          })
                        }
                        disabled={!!busyAction}
                      >
                        {busyAction === 'check' ? <span className="loading loading-spinner loading-xs"></span> : null}
                        Check Now
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleServerAction(server.name, 'run-now', async () => {
                            await autoUpdateApi.triggerUpdate(server.name);
                          })
                        }
                        disabled={!!busyAction}
                      >
                        {busyAction === 'run-now' ? <span className="loading loading-spinner loading-xs"></span> : null}
                        Run Update Now
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleServerAction(server.name, 'save', async () => {
                            await autoUpdateApi.updateServerConfig(server.name, draft);
                          })
                        }
                        disabled={!!busyAction || !isDirty}
                      >
                        {busyAction === 'save' ? <span className="loading loading-spinner loading-xs"></span> : null}
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary mt-1"
                        checked={draft.enabled}
                        onChange={(event) => updateDraft(server.name, { enabled: event.target.checked })}
                        aria-label={`Enable auto-update for ${server.name}`}
                      />
                      <div>
                        <div className="font-medium">Enable auto-update</div>
                        <div className="text-sm text-base-content/70">Include this server in scheduled checks.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary mt-1"
                        checked={draft.updateOnStart ?? false}
                        onChange={(event) => updateDraft(server.name, { updateOnStart: event.target.checked })}
                        aria-label={`Update on start for ${server.name}`}
                      />
                      <div>
                        <div className="font-medium">Update on start</div>
                        <div className="text-sm text-base-content/70">Check for updates before the server boots.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary mt-1"
                        checked={draft.autoRestart ?? true}
                        onChange={(event) => updateDraft(server.name, { autoRestart: event.target.checked })}
                        aria-label={`Auto restart after update for ${server.name}`}
                      />
                      <div>
                        <div className="font-medium">Auto restart after update</div>
                        <div className="text-sm text-base-content/70">Start the server again once update steps succeed.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary mt-1"
                        checked={draft.updateIfEmpty ?? true}
                        onChange={(event) => updateDraft(server.name, { updateIfEmpty: event.target.checked })}
                        aria-label={`Update when empty for ${server.name}`}
                      />
                      <div>
                        <div className="font-medium">Update when empty</div>
                        <div className="text-sm text-base-content/70">Apply immediately when no players are online.</div>
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr]">
                    <label className="form-control">
                      <span className="label-text font-medium mb-2">Check interval (minutes)</span>
                      <input
                        type="number"
                        min={5}
                        max={1440}
                        className="input input-bordered"
                        value={draft.checkIntervalMinutes ?? draft.checkInterval ?? 60}
                        onChange={(event) => {
                          const value = Number.parseInt(event.target.value, 10);
                          updateDraft(server.name, {
                            checkIntervalMinutes: Number.isNaN(value) ? 60 : value,
                          });
                        }}
                        aria-label={`Check interval for ${server.name}`}
                      />
                    </label>

                    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                      <div className="font-medium mb-2">Warning cadence</div>
                      <p className="text-sm text-base-content/70 mb-3">
                        When players are online, the server warns at these minute marks before save, restart,
                        and update execution.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(draft.warningMinutes ?? originalConfig.warningMinutes ?? DEFAULT_SERVER_CONFIG.warningMinutes ?? []).map((minute) => (
                          <span key={`${server.name}-${minute}`} className="badge badge-outline">
                            {minute}m
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default AutoUpdate;