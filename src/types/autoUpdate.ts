/**
 * Auto-Update Feature Types
 * TypeScript interfaces for the auto-update system
 */

// Update status enumeration
export type UpdateStatus = 
  | 'idle' 
  | 'checking' 
  | 'available'
  | 'warning' 
  | 'updating' 
  | 'completed' 
  | 'failed'
  | 'cancelled';

// Update step during the update process
export type UpdateStep = 
  | 'save' 
  | 'stop' 
  | 'update' 
  | 'start' 
  | 'verify';

// Notification channel types
export type NotificationChannel = 'rcon' | 'discord' | 'socket';

// Server auto-update configuration
export interface AutoUpdateServerConfig {
  enabled: boolean;
  serverName: string;
  lastCheck?: string;
  lastUpdate?: string;
  updateAvailable?: boolean;
  currentVersion?: string;
  latestVersion?: string;
  checkInterval?: number;
  updateIfEmpty?: boolean;
  forceUpdate?: boolean;
}

// Global auto-update configuration
export interface AutoUpdateConfig {
  enabled: boolean;
  checkIntervalMinutes: number;
  updateIfEmpty: boolean;
  forceUpdate: boolean;
  notifications: {
    rcon: boolean;
    discord: boolean;
    socket: boolean;
  };
  warningMinutes: number[];
  messageTemplates: {
    rcon: {
      warning: string;
      updating: string;
      completed: string;
      failed: string;
    };
    discord: {
      warning: string;
      updating: string;
      completed: string;
      failed: string;
    };
  };
  servers: Record<string, AutoUpdateServerConfig>;
}

// Update event for timeline/history
export interface UpdateEvent {
  id: string;
  serverName: string;
  status: UpdateStatus;
  step?: UpdateStep;
  message: string;
  timestamp: string;
  error?: string;
  minutesRemaining?: number;
  progress?: number;
  fromVersion?: string;
  toVersion?: string;
}

// Real-time update progress
export interface UpdateProgress {
  serverName: string;
  status: UpdateStatus;
  step?: UpdateStep;
  progress: number;
  message: string;
  minutesRemaining?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// API Response types
export interface AutoUpdateConfigResponse {
  success: boolean;
  config: AutoUpdateConfig;
  message?: string;
}

export interface AutoUpdateServerConfigResponse {
  success: boolean;
  serverName: string;
  config: AutoUpdateServerConfig;
  message?: string;
}

export interface AutoUpdateStatusResponse {
  success: boolean;
  serverName: string;
  status: UpdateStatus;
  updateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  lastCheck?: string;
  message?: string;
}

export interface AutoUpdateCheckResponse {
  success: boolean;
  serverName: string;
  updateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  message?: string;
}

export interface AutoUpdateTriggerResponse {
  success: boolean;
  serverName: string;
  jobId?: string;
  message?: string;
}

export interface AutoUpdateCancelResponse {
  success: boolean;
  serverName: string;
  message?: string;
}

export interface AutoUpdateHistoryResponse {
  success: boolean;
  serverName: string;
  events: UpdateEvent[];
  message?: string;
}

export interface TestNotificationResponse {
  success: boolean;
  channel: NotificationChannel;
  message?: string;
}

// Socket event types for real-time updates
export interface AutoUpdateSocketEvent {
  type: 'status' | 'progress' | 'warning' | 'completed' | 'failed';
  serverName: string;
  data: UpdateProgress;
}

// Props interfaces for components
export interface AutoUpdateToggleProps {
  serverName: string;
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
  showLastCheck?: boolean;
  compact?: boolean;
  lastCheck?: string;
}

export interface AutoUpdateSettingsProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export interface UpdateTimelineProps {
  serverName: string;
  onUpdateNow?: () => void;
  onCancel?: () => void;
  showManualControls?: boolean;
}

// Default configuration values
export const DEFAULT_AUTO_UPDATE_CONFIG: AutoUpdateConfig = {
  enabled: false,
  checkIntervalMinutes: 60,
  updateIfEmpty: true,
  forceUpdate: false,
  notifications: {
    rcon: true,
    discord: true,
    socket: true
  },
  warningMinutes: [30, 10, 5, 1],
  messageTemplates: {
    rcon: {
      warning: 'Server will restart for update in {time} minutes',
      updating: 'Server is now updating. Please wait...',
      completed: 'Server update completed successfully!',
      failed: 'Server update failed. Please contact an administrator.'
    },
    discord: {
      warning: '⚠️ **{serverName}** will restart for update in **{time} minutes**',
      updating: '🔄 **{serverName}** is now updating...',
      completed: '✅ **{serverName}** update completed successfully!',
      failed: '❌ **{serverName}** update failed: {error}'
    }
  },
  servers: {}
};

export const DEFAULT_SERVER_CONFIG: AutoUpdateServerConfig = {
  enabled: false,
  serverName: '',
  checkInterval: 60,
  updateIfEmpty: true,
  forceUpdate: false
};
