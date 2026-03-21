import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeveloperProvider } from '../contexts/DeveloperContext';
import SystemLogs from '../pages/SystemLogs';

const { mockNavigate, getSystemLogs } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  getSystemLogs: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    provisioningApi: {
      ...actual.provisioningApi,
      getSystemLogs,
    },
  };
});

describe('SystemLogs', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    getSystemLogs.mockReset();
    localStorage.clear();
  });

  it('deduplicates grouped tabs and resolves content from the normalized source key', async () => {
    getSystemLogs.mockResolvedValue({
      success: true,
      serviceInfo: {
        mode: 'native',
        isWindowsService: false,
        serviceInstallPath: null,
        logBasePath: 'C:/ARK/logs',
        currentWorkingDirectory: 'C:/ARK',
        processId: 123,
        parentProcessId: 1,
      },
      logFiles: {
        'node-out-2026-03-20': {
          content: 'primary node stdout content',
          path: 'C:/ARK/logs/node-out-2026-03-20.log',
          exists: true,
        },
        'node-out': {
          content: 'legacy duplicate node stdout content',
          path: 'C:/ARK/logs/node-out.log',
          exists: true,
        },
        'combined-2026-03-20': {
          content: 'combined content',
          path: 'C:/ARK/logs/combined-2026-03-20.log',
          exists: true,
        },
      },
      type: 'all',
      lines: 100,
      totalLogFiles: 3,
    });

    render(
      <DeveloperProvider>
        <SystemLogs />
      </DeveloperProvider>
    );

    await waitFor(() => expect(getSystemLogs).toHaveBeenCalledWith('all', 100));

    const nodeStdoutTabs = await screen.findAllByRole('button', { name: /Node Stdout/i });
    expect(nodeStdoutTabs).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Combined Logs/i })).toHaveLength(1);

    const user = userEvent.setup();
    await user.click(nodeStdoutTabs[0]);

    expect(await screen.findByText('primary node stdout content')).toBeInTheDocument();
    expect(screen.getByText('node-out-2026-03-20.log')).toBeInTheDocument();
    expect(screen.queryByText('legacy duplicate node stdout content')).not.toBeInTheDocument();
  });
});