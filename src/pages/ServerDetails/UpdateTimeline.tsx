import React, { useState, useEffect, useCallback, useRef } from 'react';
import { autoUpdateApi } from '../../services/api-auto-update';
import { socketService } from '../../services/socket';
import type {
  UpdateTimelineProps,
  UpdateStatus,
  UpdateStep,
  UpdateEvent,
  AutoUpdateSocketEvent
} from '../../types/autoUpdate';

/**
 * UpdateTimeline Component
 * 
 * Timeline visualization showing update progress and countdowns.
 * Features real-time updates via socket events.
 */
const UpdateTimeline: React.FC<UpdateTimelineProps> = ({
  serverName,
  onUpdateNow,
  onCancel,
  showManualControls = true
}) => {
  // Current status state
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [currentStep, setCurrentStep] = useState<UpdateStep | undefined>();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [minutesRemaining, setMinutesRemaining] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  
  // Version info
  const [currentVersion, setCurrentVersion] = useState<string | undefined>();
  const [latestVersion, setLatestVersion] = useState<string | undefined>();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  // History
  const [history, setHistory] = useState<UpdateEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'check' | 'update' | 'cancel' | null>(null);
  
  // Countdown timer
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update steps for progress display
  const UPDATE_STEPS: { step: UpdateStep; label: string; icon: string }[] = [
    { step: 'save', label: 'Saving World', icon: '💾' },
    { step: 'stop', label: 'Stopping Server', icon: '⏹️' },
    { step: 'update', label: 'Updating Files', icon: '📥' },
    { step: 'start', label: 'Starting Server', icon: '▶️' },
    { step: 'verify', label: 'Verifying', icon: '✅' }
  ];

  // Get step index for progress calculation
  const getStepIndex = (step?: UpdateStep): number => {
    if (!step) return -1;
    return UPDATE_STEPS.findIndex(s => s.step === step);
  };

  // Fetch initial status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await autoUpdateApi.getStatus(serverName);
      
      if (response.success) {
        setStatus(response.status);
        setCurrentVersion(response.currentVersion);
        setLatestVersion(response.latestVersion);
        setUpdateAvailable(response.updateAvailable);
        
        if (response.status === 'idle') {
          setMessage('No update in progress');
        }
      }
    } catch (err) {
      console.error('Failed to fetch update status:', err);
    } finally {
      setLoading(false);
    }
  }, [serverName]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await autoUpdateApi.getHistory(serverName, 10);
      if (response.success) {
        setHistory(response.events);
      }
    } catch (err) {
      console.error('Failed to fetch update history:', err);
    }
  }, [serverName]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [fetchStatus, fetchHistory]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    const handleAutoUpdateEvent = (data: AutoUpdateSocketEvent) => {
      if (data.serverName !== serverName) return;
      
      const progress = data.data;
      setStatus(progress.status);
      setCurrentStep(progress.step);
      setProgress(progress.progress);
      setMessage(progress.message);
      setMinutesRemaining(progress.minutesRemaining);
      setError(progress.error);
      
      // Refresh history on completion or failure
      if (progress.status === 'completed' || progress.status === 'failed') {
        fetchHistory();
      }
    };

    // Subscribe to auto-update events using colon separator to match backend
    socketService.onCustomEvent('auto-update:progress', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:checking', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:available', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:warning', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:starting', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:completed', handleAutoUpdateEvent);
    socketService.onCustomEvent('auto-update:failed', handleAutoUpdateEvent);

    return () => {
      socketService.offCustomEvent('auto-update:progress', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:checking', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:available', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:warning', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:starting', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:completed', handleAutoUpdateEvent);
      socketService.offCustomEvent('auto-update:failed', handleAutoUpdateEvent);
    };
  }, [serverName, fetchHistory]);

  // Countdown timer for warning phase
  useEffect(() => {
    if (status === 'warning' && minutesRemaining !== undefined && minutesRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setMinutesRemaining(prev => {
          if (prev !== undefined && prev > 0) {
            return prev - (1 / 60); // Decrease by 1 second
          }
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [status, minutesRemaining]);

  // Handle check for updates
  const handleCheckForUpdates = async () => {
    try {
      setActionLoading('check');
      setError(undefined);
      
      const response = await autoUpdateApi.checkForUpdates(serverName);
      
      if (response.success) {
        setUpdateAvailable(response.updateAvailable);
        setCurrentVersion(response.currentVersion);
        setLatestVersion(response.latestVersion);
        setMessage(response.message || 'Check completed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle update now
  const handleUpdateNow = async () => {
    try {
      setActionLoading('update');
      setError(undefined);
      
      const response = await autoUpdateApi.triggerUpdate(serverName);
      
      if (response.success) {
        setStatus('warning');
        setMessage('Update initiated');
        onUpdateNow?.();
      } else {
        setError(response.message || 'Failed to trigger update');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger update');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel update
  const handleCancel = async () => {
    try {
      setActionLoading('cancel');
      setError(undefined);
      
      const response = await autoUpdateApi.cancelUpdate(serverName);
      
      if (response.success) {
        setStatus('idle');
        setMessage('Update cancelled');
        onCancel?.();
      } else {
        setError(response.message || 'Failed to cancel update');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel update');
    } finally {
      setActionLoading(null);
    }
  };

  // Format countdown display
  const formatCountdown = (minutes?: number): string => {
    if (minutes === undefined) return '--:--';
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp for history
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
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

  // Get status color
  const getStatusColor = (s: UpdateStatus): string => {
    switch (s) {
      case 'idle': return 'badge-ghost';
      case 'checking': return 'badge-info';
      case 'warning': return 'badge-warning';
      case 'updating': return 'badge-primary';
      case 'completed': return 'badge-success';
      case 'failed': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  // Get status icon
  const getStatusIcon = (s: UpdateStatus): string => {
    switch (s) {
      case 'idle': return '⏸️';
      case 'checking': return '🔍';
      case 'warning': return '⚠️';
      case 'updating': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getStatusIcon(status)}</div>
          <div>
            <h3 className="text-lg font-bold">Update Status</h3>
            <div className="flex items-center gap-2">
              <span className={`badge ${getStatusColor(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {updateAvailable && status === 'idle' && (
                <span className="badge badge-warning">Update Available</span>
              )}
            </div>
          </div>
        </div>

        {/* Version Info */}
        {currentVersion && (
          <div className="text-right text-sm">
            <div className="text-base-content/70">Current: <span className="font-mono">{currentVersion}</span></div>
            {latestVersion && latestVersion !== currentVersion && (
              <div className="text-success">Latest: <span className="font-mono">{latestVersion}</span></div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Warning Countdown */}
      {status === 'warning' && (
        <div className="card bg-warning/20 border border-warning">
          <div className="card-body items-center text-center">
            <div className="text-4xl font-mono font-bold text-warning">
              {formatCountdown(minutesRemaining)}
            </div>
            <p className="text-sm">
              Server will restart for update in {Math.ceil(minutesRemaining || 0)} minute{(minutesRemaining || 0) > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-base-content/70">{message}</p>
          </div>
        </div>
      )}

      {/* Update Progress Timeline */}
      {status === 'updating' && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="font-semibold mb-4">Update Progress</h4>
            
            {/* Progress Bar */}
            <div className="w-full bg-base-300 rounded-full h-3 mb-4">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Steps */}
            <ul className="steps steps-horizontal w-full">
              {UPDATE_STEPS.map((step, index) => {
                const currentIndex = getStepIndex(currentStep);
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                
                return (
                  <li
                    key={step.step}
                    className={`step ${isCompleted || isCurrent ? 'step-primary' : ''}`}
                    data-content={isCompleted ? '✓' : step.icon}
                  >
                    <span className={`text-xs ${isCurrent ? 'font-bold' : ''}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Current Message */}
            <div className="text-center mt-4 text-sm text-base-content/70">
              {message}
            </div>
          </div>
        </div>
      )}

      {/* Idle State */}
      {status === 'idle' && (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">
              {updateAvailable ? '📥' : '✔️'}
            </div>
            <p className="text-base-content/70">
              {updateAvailable 
                ? 'An update is available for this server'
                : 'Server is up to date'
              }
            </p>
          </div>
        </div>
      )}

      {/* Completed State */}
      {status === 'completed' && (
        <div className="card bg-success/20 border border-success">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-semibold text-success">Update Completed Successfully</p>
            <p className="text-sm text-base-content/70">{message}</p>
          </div>
        </div>
      )}

      {/* Failed State */}
      {status === 'failed' && (
        <div className="card bg-error/20 border border-error">
          <div className="card-body items-center text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="font-semibold text-error">Update Failed</p>
            <p className="text-sm text-base-content/70">{message || error}</p>
          </div>
        </div>
      )}

      {/* Manual Controls */}
      {showManualControls && (
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Check for Updates */}
          <button
            className="btn btn-outline btn-info"
            onClick={handleCheckForUpdates}
            disabled={actionLoading !== null || status === 'updating' || status === 'warning'}
          >
            {actionLoading === 'check' ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              '🔍'
            )}
            Check for Updates
          </button>

          {/* Update Now */}
          {(updateAvailable || status === 'idle') && (
            <button
              className="btn btn-primary"
              onClick={handleUpdateNow}
              disabled={actionLoading !== null || status === 'updating' || status === 'warning'}
            >
              {actionLoading === 'update' ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                '🚀'
              )}
              Update Now
            </button>
          )}

          {/* Cancel */}
          {(status === 'warning' || status === 'updating') && (
            <button
              className="btn btn-error btn-outline"
              onClick={handleCancel}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'cancel' ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                '✖️'
              )}
              Cancel Update
            </button>
          )}
        </div>
      )}

      {/* History Toggle */}
      <div className="divider">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? '▲ Hide History' : '▼ Show History'}
        </button>
      </div>

      {/* Update History */}
      {showHistory && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="font-semibold mb-4">Update History</h4>
            
            {history.length === 0 ? (
              <p className="text-center text-base-content/50">No update history</p>
            ) : (
              <div className="space-y-3">
                {history.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-base-100 rounded-lg"
                  >
                    <div className="text-xl">{getStatusIcon(event.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-sm ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-base-content/50">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.message}</p>
                      {event.fromVersion && event.toVersion && (
                        <p className="text-xs text-base-content/50 mt-1">
                          {event.fromVersion} → {event.toVersion}
                        </p>
                      )}
                      {event.error && (
                        <p className="text-xs text-error mt-1">{event.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTimeline;
