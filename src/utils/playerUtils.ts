/**
 * Player Utilities
 * 
 * Provides consistent player count derivation logic across the application.
 * Handles cases where player count may differ between reported count and actual list.
 */

import type { ServerLiveData, PlayerInfo } from '../types/serverStatus';

/**
 * Derived player count information
 */
export interface DerivedPlayerCount {
  /** Number of players currently online */
  online: number;
  /** Maximum player capacity */
  max: number;
  /** Whether the count is exact (from player list) or potentially stale */
  isExact: boolean;
  /** Source of the player count data */
  source: 'list' | 'count' | 'unknown';
  /** Whether there's a mismatch between list and count */
  hasMismatch: boolean;
  /** The player list if available */
  playerList?: PlayerInfo[];
}

/**
 * Derive player count from server live data
 * 
 * Prefers actual player list length when available, as this is the most accurate.
 * Falls back to reported count, marking it as potentially stale based on data source.
 * 
 * @param data Server live data or null
 * @returns Derived player count with metadata
 */
export function derivePlayerCount(data: ServerLiveData | null): DerivedPlayerCount {
  if (!data) {
    return {
      online: 0,
      max: 0,
      isExact: false,
      source: 'unknown',
      hasMismatch: false,
    };
  }

  const playerList = data.players?.list;
  const reportedOnline = data.players?.online ?? 0;
  const maxPlayers = data.players?.max ?? 0;

  // Prefer actual player list length if available and non-empty
  if (playerList && playerList.length > 0) {
    const hasMismatch = reportedOnline !== playerList.length;
    return {
      online: playerList.length,
      max: maxPlayers,
      isExact: true,
      source: 'list',
      hasMismatch,
      playerList,
    };
  }

  // Fall back to reported count, but mark as potentially stale
  // RCON and query sources are more reliable than cached data
  const isReliable = data.source === 'rcon' || data.source === 'query';
  
  return {
    online: reportedOnline,
    max: maxPlayers,
    isExact: isReliable,
    source: 'count',
    hasMismatch: false,
    playerList: playerList,
  };
}

/**
 * Format player count for display
 * 
 * @param count Derived player count
 * @returns Formatted string like "15/70" or "15/70*" for inexact counts
 */
export function formatPlayerCount(count: DerivedPlayerCount): string {
  const base = `${count.online}/${count.max}`;
  if (!count.isExact && count.source !== 'unknown') {
    return `${base}*`;
  }
  return base;
}

/**
 * Get tooltip text explaining player count accuracy
 * 
 * @param count Derived player count
 * @returns Tooltip text
 */
export function getPlayerCountTooltip(count: DerivedPlayerCount): string {
  if (count.source === 'unknown') {
    return 'Player count unavailable';
  }
  
  if (count.hasMismatch) {
    return `Player count from list (${count.online}) differs from reported count. Using list count.`;
  }
  
  if (!count.isExact) {
    return 'Player count may be cached or stale';
  }
  
  if (count.source === 'list') {
    return `${count.online} player${count.online !== 1 ? 's' : ''} connected`;
  }
  
  return `${count.online}/${count.max} players`;
}

/**
 * Check if there's a player count mismatch that should be displayed
 * 
 * @param count Derived player count
 * @returns true if there's a significant mismatch worth highlighting
 */
export function hasSignificantMismatch(count: DerivedPlayerCount): boolean {
  // Mismatch exists and count shows players but list is empty or different
  if (count.hasMismatch) {
    return true;
  }
  
  // Reported as having players but list is empty
  if (count.source === 'list' && count.online === 0 && count.playerList?.length === 0) {
    return false; // No mismatch, just no players
  }
  
  return false;
}

/**
 * Get player count status for styling purposes
 * 
 * @param count Derived player count
 * @returns Status string for styling
 */
export function getPlayerCountStatus(count: DerivedPlayerCount): 'normal' | 'warning' | 'error' | 'unknown' {
  if (count.source === 'unknown') {
    return 'unknown';
  }
  
  if (count.hasMismatch) {
    return 'warning';
  }
  
  if (!count.isExact) {
    return 'warning';
  }
  
  return 'normal';
}
