/**
 * Player Utilities Tests
 * 
 * Tests for player count derivation and formatting utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  derivePlayerCount,
  formatPlayerCount,
  getPlayerCountTooltip,
  hasSignificantMismatch,
  getPlayerCountStatus
} from '../utils/playerUtils';
import type { ServerLiveData, PlayerInfo } from '../types/serverStatus';

// Helper to create mock ServerLiveData
function createMockLiveData(overrides: Partial<ServerLiveData> = {}): ServerLiveData {
  return {
    serverId: 'test-server',
    status: 'running',
    players: {
      online: 0,
      max: 70
    },
    updatedAt: new Date().toISOString(),
    source: 'rcon',
    ...overrides
  };
}

describe('derivePlayerCount', () => {
  describe('with null/empty data', () => {
    it('returns defaults for null data', () => {
      const result = derivePlayerCount(null);

      expect(result.online).toBe(0);
      expect(result.max).toBe(0);
      expect(result.isExact).toBe(false);
      expect(result.source).toBe('unknown');
      expect(result.hasMismatch).toBe(false);
    });
  });

  describe('with player list', () => {
    it('uses player list length when list is available', () => {
      const playerList: PlayerInfo[] = [
        { name: 'Player1' },
        { name: 'Player2' },
        { name: 'Player3' }
      ];
      const data = createMockLiveData({
        players: { online: 5, max: 70, list: playerList }
      });

      const result = derivePlayerCount(data);

      expect(result.online).toBe(3); // Uses list length, not reported count
      expect(result.max).toBe(70);
      expect(result.isExact).toBe(true);
      expect(result.source).toBe('list');
      expect(result.hasMismatch).toBe(true); // 3 != 5
      expect(result.playerList).toBe(playerList);
    });

    it('marks no mismatch when list length matches reported count', () => {
      const playerList: PlayerInfo[] = [
        { name: 'Player1' },
        { name: 'Player2' }
      ];
      const data = createMockLiveData({
        players: { online: 2, max: 70, list: playerList }
      });

      const result = derivePlayerCount(data);

      expect(result.online).toBe(2);
      expect(result.hasMismatch).toBe(false);
      expect(result.source).toBe('list');
    });
  });

  describe('with count only (no list)', () => {
    it('falls back to reported count when list is empty', () => {
      const data = createMockLiveData({
        players: { online: 15, max: 70, list: [] },
        source: 'rcon'
      });

      const result = derivePlayerCount(data);

      expect(result.online).toBe(15);
      expect(result.max).toBe(70);
      expect(result.isExact).toBe(true); // RCON is reliable
      expect(result.source).toBe('count');
    });

    it('marks as inexact when source is cached', () => {
      const data = createMockLiveData({
        players: { online: 15, max: 70 },
        source: 'cached'
      });

      const result = derivePlayerCount(data);

      expect(result.online).toBe(15);
      expect(result.isExact).toBe(false);
      expect(result.source).toBe('count');
    });

    it('marks as exact when source is rcon', () => {
      const data = createMockLiveData({
        players: { online: 15, max: 70 },
        source: 'rcon'
      });

      const result = derivePlayerCount(data);

      expect(result.isExact).toBe(true);
    });

    it('marks as exact when source is query', () => {
      const data = createMockLiveData({
        players: { online: 15, max: 70 },
        source: 'query'
      });

      const result = derivePlayerCount(data);

      expect(result.isExact).toBe(true);
    });
  });

  describe('with undefined player data', () => {
    it('handles missing players object gracefully', () => {
      const data = createMockLiveData({
        players: undefined as unknown as ServerLiveData['players']
      });

      const result = derivePlayerCount(data);

      expect(result.online).toBe(0);
      expect(result.max).toBe(0);
    });
  });
});

describe('formatPlayerCount', () => {
  it('formats exact count without asterisk', () => {
    const count = {
      online: 15,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(formatPlayerCount(count)).toBe('15/70');
  });

  it('adds asterisk for inexact counts', () => {
    const count = {
      online: 15,
      max: 70,
      isExact: false,
      source: 'count' as const,
      hasMismatch: false
    };

    expect(formatPlayerCount(count)).toBe('15/70*');
  });

  it('does not add asterisk for unknown source', () => {
    const count = {
      online: 0,
      max: 0,
      isExact: false,
      source: 'unknown' as const,
      hasMismatch: false
    };

    expect(formatPlayerCount(count)).toBe('0/0');
  });

  it('formats zero players correctly', () => {
    const count = {
      online: 0,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(formatPlayerCount(count)).toBe('0/70');
  });
});

describe('getPlayerCountTooltip', () => {
  it('returns unavailable message for unknown source', () => {
    const count = {
      online: 0,
      max: 0,
      isExact: false,
      source: 'unknown' as const,
      hasMismatch: false
    };

    expect(getPlayerCountTooltip(count)).toBe('Player count unavailable');
  });

  it('explains mismatch when present', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: true
    };

    const tooltip = getPlayerCountTooltip(count);
    expect(tooltip).toContain('differs from reported count');
    expect(tooltip).toContain('5');
  });

  it('indicates potentially stale data', () => {
    const count = {
      online: 15,
      max: 70,
      isExact: false,
      source: 'count' as const,
      hasMismatch: false
    };

    expect(getPlayerCountTooltip(count)).toContain('stale');
  });

  it('shows connected players for list source', () => {
    const count = {
      online: 3,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(getPlayerCountTooltip(count)).toBe('3 players connected');
  });

  it('uses singular form for one player', () => {
    const count = {
      online: 1,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(getPlayerCountTooltip(count)).toBe('1 player connected');
  });
});

describe('hasSignificantMismatch', () => {
  it('returns true when hasMismatch is true', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: true
    };

    expect(hasSignificantMismatch(count)).toBe(true);
  });

  it('returns false when no mismatch', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(hasSignificantMismatch(count)).toBe(false);
  });

  it('returns false for empty server with list source', () => {
    const count = {
      online: 0,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false,
      playerList: []
    };

    expect(hasSignificantMismatch(count)).toBe(false);
  });
});

describe('getPlayerCountStatus', () => {
  it('returns unknown for unknown source', () => {
    const count = {
      online: 0,
      max: 0,
      isExact: false,
      source: 'unknown' as const,
      hasMismatch: false
    };

    expect(getPlayerCountStatus(count)).toBe('unknown');
  });

  it('returns warning for mismatch', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: true
    };

    expect(getPlayerCountStatus(count)).toBe('warning');
  });

  it('returns warning for inexact data', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: false,
      source: 'count' as const,
      hasMismatch: false
    };

    expect(getPlayerCountStatus(count)).toBe('warning');
  });

  it('returns normal for exact data without mismatch', () => {
    const count = {
      online: 5,
      max: 70,
      isExact: true,
      source: 'list' as const,
      hasMismatch: false
    };

    expect(getPlayerCountStatus(count)).toBe('normal');
  });
});
