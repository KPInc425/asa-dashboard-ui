export interface CommandHistory {
  command: string;
  response: string;
  timestamp: Date;
  success: boolean;
}

export interface RconCommand {
  name: string;
  syntax: string;
  description: string;
  category: string;
}

export interface RconCommandsData {
  rcon_commands: RconCommand[];
}

export interface ChatMessage {
  timestamp: Date;
  message: string;
  sender?: string;
  optimistic?: boolean;
}

export interface ServerDetailsRconConsoleProps {
  serverName: string;
}
