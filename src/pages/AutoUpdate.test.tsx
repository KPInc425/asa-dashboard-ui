import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AutoUpdate from './AutoUpdate';
import { useServers } from '../hooks/useServerData';
import { autoUpdateApi } from '../services/api-auto-update';

vi.mock('../hooks/useServerData', () => ({
  useServers: vi.fn(),
}));

vi.mock('../services/api-auto-update', () => ({
  autoUpdateApi: {
    getConfig: vi.fn(),
    getAllStatus: vi.fn(),
    getServerConfig: vi.fn(),
    updateConfig: vi.fn(),
    checkAllForUpdates: vi.fn(),
    checkForUpdates: vi.fn(),
    triggerUpdate: vi.fn(),
    updateServerConfig: vi.fn(),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AutoUpdate />
    </QueryClientProvider>
  );
}

describe('AutoUpdate page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useServers).mockReturnValue({
      data: [
        {
          name: 'TheIsland',
          type: 'native',
          status: 'running',
        },
      ],
      isLoading: false,
      error: null,
    } as never);

    vi.mocked(autoUpdateApi.getConfig).mockResolvedValue({
      success: true,
      config: {
        enabled: true,
        checkIntervalMinutes: 60,
        updateIfEmpty: true,
        forceUpdate: false,
        notifications: { rcon: true, discord: true, socket: true },
        warningMinutes: [30, 10, 5, 1],
        messageTemplates: {
          rcon: {
            warning: 'warning',
            updating: 'updating',
            completed: 'completed',
            failed: 'failed',
          },
          discord: {
            warning: 'warning',
            updating: 'updating',
            completed: 'completed',
            failed: 'failed',
          },
        },
        servers: {},
      },
    });

    vi.mocked(autoUpdateApi.getAllStatus).mockResolvedValue({
      success: true,
      servers: {
        TheIsland: {
          success: true,
          serverName: 'TheIsland',
          status: 'available',
          updateAvailable: true,
          lastCheck: '2026-03-20T20:00:00.000Z',
        },
      },
    });

    vi.mocked(autoUpdateApi.getServerConfig).mockResolvedValue({
      success: true,
      serverName: 'TheIsland',
      config: {
        enabled: true,
        serverName: 'TheIsland',
        updateOnStart: true,
        autoRestart: true,
        updateIfEmpty: true,
        checkIntervalMinutes: 60,
        warningMinutes: [30, 10, 5, 1],
      },
    });
  });

  it('renders scheduler controls and per-server auto-update fields', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Auto-Update' })).toBeInTheDocument();
    expect(await screen.findByText('TheIsland')).toBeInTheDocument();
    expect(await screen.findByText('Scheduler Running')).toBeInTheDocument();
    expect(screen.getByLabelText('Update on start for TheIsland')).toBeChecked();
    expect(screen.getByLabelText('Auto restart after update for TheIsland')).toBeChecked();
    expect(screen.getByLabelText('Check interval for TheIsland')).toHaveValue(60);

    await waitFor(() => {
      expect(autoUpdateApi.getServerConfig).toHaveBeenCalledWith('TheIsland');
    });
  });
});