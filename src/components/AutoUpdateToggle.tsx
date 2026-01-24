import React, { useState, useEffect, useCallback } from 'react';
import { autoUpdateApi } from '../services/api-auto-update';
import type { AutoUpdateToggleProps } from '../types/autoUpdate';

/**
 * AutoUpdateToggle Component
 * 
 * A simple toggle component to enable/disable auto-update for a server.
 * Can be placed in server cards or headers.
 */
const AutoUpdateToggle: React.FC<AutoUpdateToggleProps> = ({
  serverName,
  enabled: initialEnabled,
  onToggle,
  showLastCheck = false,
  compact = false,
  lastCheck: initialLastCheck
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | undefined>(initialLastCheck);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Sync with parent props
  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setLastCheck(initialLastCheck);
  }, [initialLastCheck]);

  // Fetch current status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await autoUpdateApi.getServerConfig(serverName);
        if (response.success) {
          setEnabled(response.config.enabled);
          setLastCheck(response.config.lastCheck);
          setUpdateAvailable(response.config.updateAvailable || false);
        }
      } catch (err) {
        // Silently fail on initial load
        console.error('Failed to fetch auto-update status:', err);
      }
    };

    fetchStatus();
  }, [serverName]);

  const handleToggle = useCallback(async () => {
    const newValue = !enabled;
    setLoading(true);
    setError(null);

    try {
      const response = await autoUpdateApi.updateServerConfig(serverName, {
        enabled: newValue
      });

      if (response.success) {
        setEnabled(newValue);
        onToggle?.(newValue);
      } else {
        setError(response.message || 'Failed to update configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      // Revert on error
      setEnabled(!newValue);
    } finally {
      setLoading(false);
    }
  }, [enabled, serverName, onToggle]);

  const formatLastCheck = (dateString?: string): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Compact version for server cards
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="tooltip tooltip-left" data-tip={enabled ? 'Auto-update enabled' : 'Auto-update disabled'}>
          <label className="swap swap-rotate">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              disabled={loading}
              className="hidden"
            />
            <span className={`swap-on ${loading ? 'opacity-50' : ''}`}>
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </span>
            <span className={`swap-off ${loading ? 'opacity-50' : ''}`}>
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </span>
          </label>
        </div>
        {updateAvailable && (
          <span className="badge badge-warning badge-xs">Update</span>
        )}
      </div>
    );
  }

  // Full version with more details
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">Auto-Update</span>
          {updateAvailable && (
            <span className="badge badge-warning badge-sm">Update Available</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={enabled}
            onChange={handleToggle}
            disabled={loading}
          />
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-base-content/70">
        <span className={`badge badge-xs ${enabled ? 'badge-success' : 'badge-ghost'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        
        {showLastCheck && lastCheck && (
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last check: {formatLastCheck(lastCheck)}
          </span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="text-xs text-error flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default AutoUpdateToggle;
