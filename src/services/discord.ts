import { api } from './api';

export interface DiscordWebhook {
  id: string;
  url: string;
  name: string;
  channel: string;
  enabled: boolean;
}

export interface DiscordBotConfig {
  enabled: boolean;
  token: string;
  prefix: string;
  applicationId?: string;
  allowedChannels: string[];
  allowedRoles: string[];
}

export interface ServerStatus {
  name: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  players: number;
  maxPlayers: number;
  map: string;
  uptime: string;
}

export interface DiscordNotification {
  type: 'server_status' | 'player_join' | 'player_leave' | 'server_start' | 'server_stop' | 'error';
  serverName: string;
  message: string;
  timestamp: Date;
  data?: any;
}

class DiscordService {
  private webhooks: DiscordWebhook[] = [];
  private botConfig: DiscordBotConfig | null = null;

  /**
   * Initialize Discord service
   */
  async initialize() {
    try {
      await this.loadWebhooks();
      await this.loadBotConfig();
    } catch (error) {
      console.error('Failed to initialize Discord service:', error);
    }
  }

  /**
   * Load webhooks from backend
   */
  async loadWebhooks(): Promise<DiscordWebhook[]> {
    try {
      const response = await api.get('/api/discord/webhooks');
      this.webhooks = response.data.webhooks || [];
      return this.webhooks;
    } catch (error) {
      console.error('Failed to load Discord webhooks:', error);
      return [];
    }
  }

  /**
   * Load bot configuration from backend
   */
  async loadBotConfig(): Promise<DiscordBotConfig | null> {
    try {
      const response = await api.get('/api/discord/bot/config');
      this.botConfig = response.data.config || null;
      return this.botConfig;
    } catch (error) {
      console.error('Failed to load Discord bot config:', error);
      return null;
    }
  }

  /**
   * Send notification to Discord webhook
   */
  async sendNotification(notification: DiscordNotification): Promise<boolean> {
    try {
      const response = await api.post('/api/discord/notify', notification);
      return response.data.success;
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return false;
    }
  }

  /**
   * Send server status update
   */
  async sendServerStatus(serverStatus: ServerStatus): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'server_status',
      serverName: serverStatus.name,
      message: `Server ${serverStatus.name} is now ${serverStatus.status}`,
      timestamp: new Date(),
      data: serverStatus
    };

    return this.sendNotification(notification);
  }

  /**
   * Send player join notification
   */
  async sendPlayerJoin(serverName: string, playerName: string): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'player_join',
      serverName,
      message: `🎮 ${playerName} joined ${serverName}`,
      timestamp: new Date(),
      data: { playerName }
    };

    return this.sendNotification(notification);
  }

  /**
   * Send player leave notification
   */
  async sendPlayerLeave(serverName: string, playerName: string): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'player_leave',
      serverName,
      message: `👋 ${playerName} left ${serverName}`,
      timestamp: new Date(),
      data: { playerName }
    };

    return this.sendNotification(notification);
  }

  /**
   * Send server start notification
   */
  async sendServerStart(serverName: string): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'server_start',
      serverName,
      message: `🚀 Server ${serverName} is starting up`,
      timestamp: new Date()
    };

    return this.sendNotification(notification);
  }

  /**
   * Send server stop notification
   */
  async sendServerStop(serverName: string): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'server_stop',
      serverName,
      message: `🛑 Server ${serverName} is shutting down`,
      timestamp: new Date()
    };

    return this.sendNotification(notification);
  }

  /**
   * Send error notification
   */
  async sendError(serverName: string, error: string): Promise<boolean> {
    const notification: DiscordNotification = {
      type: 'error',
      serverName,
      message: `❌ Error on ${serverName}: ${error}`,
      timestamp: new Date(),
      data: { error }
    };

    return this.sendNotification(notification);
  }

  /**
   * Add new webhook
   */
  async addWebhook(webhook: Omit<DiscordWebhook, 'id'>): Promise<DiscordWebhook | null> {
    try {
      const response = await api.post('/api/discord/webhooks', webhook);
      const newWebhook = response.data.webhook;
      this.webhooks.push(newWebhook);
      return newWebhook;
    } catch (error) {
      console.error('Failed to add Discord webhook:', error);
      return null;
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, updates: Partial<DiscordWebhook>): Promise<boolean> {
    try {
      const response = await api.put(`/api/discord/webhooks/${id}`, updates);
      if (response.data.success) {
        const index = this.webhooks.findIndex(w => w.id === id);
        if (index !== -1) {
          this.webhooks[index] = { ...this.webhooks[index], ...updates };
        }
      }
      return response.data.success;
    } catch (error) {
      console.error('Failed to update Discord webhook:', error);
      return false;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/api/discord/webhooks/${id}`);
      if (response.data.success) {
        this.webhooks = this.webhooks.filter(w => w.id !== id);
      }
      return response.data.success;
    } catch (error) {
      console.error('Failed to delete Discord webhook:', error);
      return false;
    }
  }

  /**
   * Update bot configuration
   */
  async updateBotConfig(config: Partial<DiscordBotConfig>): Promise<boolean> {
    try {
      const response = await api.put('/api/discord/bot/config', config);
      if (response.data.success) {
        this.botConfig = { ...this.botConfig, ...config } as DiscordBotConfig;
      }
      return response.data.success;
    } catch (error) {
      console.error('Failed to update Discord bot config:', error);
      return false;
    }
  }

  /**
   * Get webhooks
   */
  getWebhooks(): DiscordWebhook[] {
    return this.webhooks;
  }

  /**
   * Get bot config
   */
  getBotConfig(): DiscordBotConfig | null {
    return this.botConfig;
  }
}

export const discordService = new DiscordService(); 