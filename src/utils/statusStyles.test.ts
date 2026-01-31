/**
 * Status Styling Utilities Tests
 * 
 * Tests for status styling utilities that provide consistent
 * visual styling across the application.
 */

import { describe, it, expect } from 'vitest';
import {
  getStatusStyle,
  getStatusIcon,
  getStatusLabel,
  getStatusBadgeClass,
  getExtendedStatusInfo,
  STATUS_COLORS
} from '../utils/statusStyles';
import { ServerStatus } from '../types/serverStatus';

describe('getStatusStyle', () => {
  it('returns valid style for running status', () => {
    const style = getStatusStyle(ServerStatus.RUNNING);

    expect(style.badgeClass).toBe('badge-success');
    expect(style.icon).toBe('🟢');
    expect(style.animate).toBe(false);
    expect(style.textClass).toContain('success');
    expect(style.bgClass).toContain('success');
  });

  it('returns valid style for stopped status', () => {
    const style = getStatusStyle(ServerStatus.STOPPED);

    expect(style.badgeClass).toBe('badge-ghost');
    expect(style.icon).toBe('🔴');
    expect(style.animate).toBe(false);
  });

  it('returns animated style for starting status', () => {
    const style = getStatusStyle(ServerStatus.STARTING);

    expect(style.badgeClass).toBe('badge-info');
    expect(style.icon).toBe('🟡');
    expect(style.animate).toBe(true);
  });

  it('returns animated style for stopping status', () => {
    const style = getStatusStyle(ServerStatus.STOPPING);

    expect(style.badgeClass).toBe('badge-warning');
    expect(style.icon).toBe('🟠');
    expect(style.animate).toBe(true);
  });

  it('returns valid style for failed status', () => {
    const style = getStatusStyle(ServerStatus.FAILED);

    expect(style.badgeClass).toBe('badge-error');
    expect(style.icon).toBe('💥');
    expect(style.animate).toBe(false);
  });

  it('returns valid style for unknown status', () => {
    const style = getStatusStyle(ServerStatus.UNKNOWN);

    expect(style.badgeClass).toContain('badge-warning');
    expect(style.badgeClass).toContain('badge-outline');
    expect(style.icon).toBe('❓');
    expect(style.pattern).toBe('striped');
  });

  it('normalizes legacy status values', () => {
    const onlineStyle = getStatusStyle('online');
    const offlineStyle = getStatusStyle('offline');
    const errorStyle = getStatusStyle('error');

    expect(onlineStyle.badgeClass).toBe('badge-success');
    expect(offlineStyle.badgeClass).toBe('badge-ghost');
    expect(errorStyle.badgeClass).toBe('badge-error');
  });

  it('handles unknown string status', () => {
    const style = getStatusStyle('garbage-status');

    expect(style.badgeClass).toContain('badge-warning');
    expect(style.icon).toBe('❓');
  });

  it('returns border class derived from text class', () => {
    const style = getStatusStyle(ServerStatus.RUNNING);

    expect(style.borderClass).toContain('border-');
    // Border class should match text class pattern
    expect(style.borderClass.replace('border-', '')).toBe(style.textClass.replace('text-', ''));
  });
});

describe('getStatusIcon', () => {
  it('returns correct icons for all statuses', () => {
    expect(getStatusIcon(ServerStatus.RUNNING)).toBe('🟢');
    expect(getStatusIcon(ServerStatus.STOPPED)).toBe('🔴');
    expect(getStatusIcon(ServerStatus.STARTING)).toBe('🟡');
    expect(getStatusIcon(ServerStatus.STOPPING)).toBe('🟠');
    expect(getStatusIcon(ServerStatus.FAILED)).toBe('💥');
    expect(getStatusIcon(ServerStatus.UNKNOWN)).toBe('❓');
  });

  it('normalizes and returns icon for legacy status', () => {
    expect(getStatusIcon('online')).toBe('🟢');
    expect(getStatusIcon('offline')).toBe('🔴');
  });

  it('returns unknown icon for invalid status', () => {
    expect(getStatusIcon('invalid')).toBe('❓');
  });
});

describe('getStatusLabel', () => {
  it('returns human-readable labels for all statuses', () => {
    expect(getStatusLabel(ServerStatus.RUNNING)).toBe('Running');
    expect(getStatusLabel(ServerStatus.STOPPED)).toBe('Stopped');
    expect(getStatusLabel(ServerStatus.STARTING)).toBe('Starting');
    expect(getStatusLabel(ServerStatus.STOPPING)).toBe('Stopping');
    expect(getStatusLabel(ServerStatus.FAILED)).toBe('Failed');
    expect(getStatusLabel(ServerStatus.UNKNOWN)).toBe('Unknown');
  });

  it('includes reason for failed status when provided', () => {
    const label = getStatusLabel(ServerStatus.FAILED, 'Out of memory');

    expect(label).toBe('Failed: Out of memory');
  });

  it('includes reason for unknown status when provided', () => {
    const label = getStatusLabel(ServerStatus.UNKNOWN, 'Connection timeout');

    expect(label).toBe('Unknown: Connection timeout');
  });

  it('truncates long reasons', () => {
    const longReason = 'A'.repeat(100);
    const label = getStatusLabel(ServerStatus.FAILED, longReason);

    expect(label.length).toBeLessThan(70);
    expect(label).toContain('...');
  });

  it('does not add reason to non-error statuses', () => {
    const label = getStatusLabel(ServerStatus.RUNNING, 'Some reason');

    expect(label).toBe('Running');
  });

  it('normalizes legacy status before labeling', () => {
    expect(getStatusLabel('online')).toBe('Running');
    expect(getStatusLabel('offline')).toBe('Stopped');
  });
});

describe('getStatusBadgeClass', () => {
  it('returns badge class with animation by default', () => {
    const classes = getStatusBadgeClass(ServerStatus.STARTING);

    expect(classes).toContain('badge');
    expect(classes).toContain('badge-info');
    expect(classes).toContain('animate-pulse');
  });

  it('excludes animation when requested', () => {
    const classes = getStatusBadgeClass(ServerStatus.STARTING, false);

    expect(classes).toContain('badge-info');
    expect(classes).not.toContain('animate-pulse');
  });

  it('does not add animation for non-transitioning statuses', () => {
    const classes = getStatusBadgeClass(ServerStatus.RUNNING);

    expect(classes).not.toContain('animate-pulse');
  });
});

describe('getExtendedStatusInfo', () => {
  it('returns complete status information for running', () => {
    const info = getExtendedStatusInfo(ServerStatus.RUNNING);

    expect(info.label).toBe('Running');
    expect(info.description).toContain('online');
    expect(info.icon).toBe('🟢');
    expect(info.severity).toBe('success');
  });

  it('returns complete status information for stopped', () => {
    const info = getExtendedStatusInfo(ServerStatus.STOPPED);

    expect(info.label).toBe('Stopped');
    expect(info.description).toContain('offline');
    expect(info.severity).toBe('neutral');
  });

  it('returns complete status information for starting', () => {
    const info = getExtendedStatusInfo(ServerStatus.STARTING);

    expect(info.label).toBe('Starting');
    expect(info.description).toContain('starting');
    expect(info.severity).toBe('info');
  });

  it('returns complete status information for stopping', () => {
    const info = getExtendedStatusInfo(ServerStatus.STOPPING);

    expect(info.label).toBe('Stopping');
    expect(info.description).toContain('shutting down');
    expect(info.severity).toBe('warning');
  });

  it('returns complete status information for failed with reason', () => {
    const info = getExtendedStatusInfo(ServerStatus.FAILED, 'Crash detected');

    expect(info.label).toBe('Failed');
    expect(info.description).toBe('Crash detected');
    expect(info.severity).toBe('error');
  });

  it('returns complete status information for unknown with reason', () => {
    const info = getExtendedStatusInfo(ServerStatus.UNKNOWN, 'No response');

    expect(info.label).toBe('Unknown');
    expect(info.description).toBe('No response');
    expect(info.severity).toBe('warning');
  });

  it('uses default description when no reason provided', () => {
    const info = getExtendedStatusInfo(ServerStatus.FAILED);

    expect(info.description).toContain('error');
  });
});

describe('STATUS_COLORS', () => {
  it('contains all canonical status values', () => {
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.RUNNING);
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.STOPPED);
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.STARTING);
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.STOPPING);
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.FAILED);
    expect(STATUS_COLORS).toHaveProperty(ServerStatus.UNKNOWN);
  });

  it('each status has bg and text colors', () => {
    for (const status of Object.values(ServerStatus)) {
      const colors = STATUS_COLORS[status];
      expect(colors).toHaveProperty('bg');
      expect(colors).toHaveProperty('text');
      expect(colors.bg).toContain('bg-');
      expect(colors.text).toContain('text-');
    }
  });

  it('unknown status has striped pattern', () => {
    expect(STATUS_COLORS[ServerStatus.UNKNOWN].pattern).toBe('striped');
  });
});
