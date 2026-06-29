export interface DiscordWebhookForm {
  name: string;
  url: string;
  channel: string;
  enabled: boolean;
}

export interface DiscordBotConfigForm {
  enabled: boolean;
  token: string;
  applicationId: string;
  allowedChannels: string[];
  allowedRoles: string[];
}
