/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AutoUpdateToggle from '../components/AutoUpdateToggle';

// Mock the API service
vi.mock('../services/api-auto-update', () => ({
  autoUpdateApi: {
    getServerConfig: vi.fn().mockResolvedValue({
      success: true,
      config: {
        enabled: false,
        serverName: 'TestServer',
        lastCheck: new Date().toISOString(),
        updateAvailable: false
      }
    }),
    updateServerConfig: vi.fn().mockResolvedValue({
      success: true,
      config: { enabled: true }
    })
  }
}));

describe('AutoUpdateToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders in default state', async () => {
    const { container } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={false}
      />
    );

    // Should show the toggle
    const toggle = container.querySelector('input[type="checkbox"]');
    expect(toggle).toBeDefined();
  });

  it('renders compact version when compact prop is true', () => {
    const { container } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={true}
        compact={true}
      />
    );

    // Compact version uses swap component
    const swap = container.querySelector('.swap');
    expect(swap).toBeDefined();
  });

  it('shows disabled badge when disabled', async () => {
    const { getByText } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={false}
      />
    );

    await waitFor(() => {
      const badge = getByText('Disabled');
      expect(badge).toBeDefined();
    });
  });

  it('shows enabled badge when enabled', async () => {
    const { getByText } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={true}
      />
    );

    await waitFor(() => {
      const badge = getByText('Enabled');
      expect(badge).toBeDefined();
    });
  });

  it('shows last check time when showLastCheck is true', async () => {
    const lastCheck = new Date().toISOString();
    
    const { getByText } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={false}
        showLastCheck={true}
        lastCheck={lastCheck}
      />
    );

    await waitFor(() => {
      const lastCheckText = getByText(/Last check:/);
      expect(lastCheckText).toBeDefined();
    });
  });

  it('calls onToggle when toggle is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <AutoUpdateToggle 
        serverName="TestServer"
        enabled={false}
        onToggle={onToggle}
      />
    );

    const toggle = container.querySelector('input.toggle');
    expect(toggle).not.toBeNull();
    await user.click(toggle!);

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });
});
