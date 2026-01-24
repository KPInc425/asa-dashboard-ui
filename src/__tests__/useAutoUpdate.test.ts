/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutoUpdate, useAllServersUpdateStatus } from '../hooks/useAutoUpdate';

// Mock dependencies
vi.mock('../services/api-auto-update', () => ({
  autoUpdateApi: {
    getConfig: vi.fn().mockResolvedValue({
      success: true,
      config: {
        enabled: true,
        checkIntervalMinutes: 60,
        updateIfEmpty: true,
        forceUpdate: false,
        notifications: { rcon: true, discord: true, socket: true },
        warningMinutes: [30, 10, 5, 1],
        messageTemplates: { rcon: {}, discord: {} },
        servers: {}
      }
    }),
    getServerConfig: vi.fn().mockResolvedValue({
      success: true,
      config: {
        enabled: true,
        serverName: 'TestServer',
        lastCheck: new Date().toISOString(),
        updateAvailable: false
      }
    }),
    getStatus: vi.fn().mockResolvedValue({
      success: true,
      status: 'idle',
      updateAvailable: false,
      serverName: 'TestServer'
    }),
    updateServerConfig: vi.fn().mockResolvedValue({
      success: true,
      config: { enabled: false }
    }),
    checkForUpdates: vi.fn().mockResolvedValue({
      success: true,
      updateAvailable: true,
      serverName: 'TestServer'
    }),
    triggerUpdate: vi.fn().mockResolvedValue({
      success: true,
      jobId: 'test-job-123',
      serverName: 'TestServer'
    }),
    cancelUpdate: vi.fn().mockResolvedValue({
      success: true,
      serverName: 'TestServer'
    }),
    getAllStatus: vi.fn().mockResolvedValue({
      success: true,
      servers: {
        'Server1': { success: true, serverName: 'Server1', status: 'idle', updateAvailable: false },
        'Server2': { success: true, serverName: 'Server2', status: 'updating', updateAvailable: true }
      }
    })
  }
}));

// Mock socket service
vi.mock('../services/socket', () => ({
  socketService: {
    onCustomEvent: vi.fn(),
    offCustomEvent: vi.fn()
  }
}));

describe('useAutoUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches initial data on mount', async () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toBeDefined();
    expect(result.current.serverConfig).toBeDefined();
    expect(result.current.status).toBe('idle');
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));
    
    // Initially loading should be true
    expect(result.current.loading).toBe(true);
  });

  it('toggleEnabled updates server config', async () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.toggleEnabled(false);
      expect(success).toBe(true);
    });
  });

  it('checkForUpdates triggers update check', async () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.checkForUpdates();
      expect(success).toBe(true);
    });

    expect(result.current.updateAvailable).toBe(true);
  });

  it('triggerUpdate starts update process', async () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.triggerUpdate(true);
      expect(success).toBe(true);
    });
  });

  it('cancelUpdate cancels pending update', async () => {
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.cancelUpdate();
      expect(success).toBe(true);
    });

    expect(result.current.status).toBe('idle');
  });

  it('returns false for actions when no serverName', async () => {
    const { result } = renderHook(() => useAutoUpdate({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.toggleEnabled(true)).toBe(false);
      expect(await result.current.checkForUpdates()).toBe(false);
      expect(await result.current.triggerUpdate()).toBe(false);
      expect(await result.current.cancelUpdate()).toBe(false);
    });
  });

  it('refresh function refetches data', async () => {
    const { autoUpdateApi } = await import('../services/api-auto-update');
    const { result } = renderHook(() => useAutoUpdate({ serverName: 'TestServer' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (autoUpdateApi.getConfig as any).mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect((autoUpdateApi.getConfig as any).mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});

describe('useAllServersUpdateStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all server statuses on mount', async () => {
    const { result } = renderHook(() => useAllServersUpdateStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toBeDefined();
    expect(result.current.statuses['Server1']).toBe('idle');
    expect(result.current.statuses['Server2']).toBe('updating');
  });

  it('refresh function refetches all statuses', async () => {
    const { autoUpdateApi } = await import('../services/api-auto-update');
    const { result } = renderHook(() => useAllServersUpdateStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (autoUpdateApi.getAllStatus as any).mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect((autoUpdateApi.getAllStatus as any).mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
