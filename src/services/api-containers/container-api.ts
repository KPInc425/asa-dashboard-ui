import { api, FRONTEND_ONLY_MODE } from "../api-core";
import type { Container, RconResponse } from "../api-core";
import { isDemoMode } from "../../demo/demo-core";
import { MOCK_CONTAINERS } from "./mock-data";

function useMockData(): boolean {
  return FRONTEND_ONLY_MODE || isDemoMode();
}

export const containerApi = {
  getContainers: async (): Promise<Container[]> => {
    if (useMockData()) {
      if (isDemoMode()) {
        const { getDemoServers } = await import("../../demo/demo-data");
        return getDemoServers().containers;
      }
      return MOCK_CONTAINERS;
    } else {
      const response = await api.get<{ success: boolean; containers: Container[] }>("/api/containers");
      return response.data.containers;
    }
  },

  getNativeServers: async (): Promise<Container[]> => {
    if (useMockData()) {
      if (isDemoMode()) {
        const { getDemoServers } = await import("../../demo/demo-data");
        return getDemoServers().nativeServers;
      }
      return MOCK_CONTAINERS;
    } else {
      const response = await api.get<{ success: boolean; servers: Container[] }>("/api/native-servers");
      return response.data.servers;
    }
  },

  startNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (useMockData()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: `Native server ${name} started successfully` };
    } else {
      try {
        if (!api) throw new Error("API instance not available");
        const response = await api.post<{ success: boolean; message: string }>(`/api/native-servers/${encodeURIComponent(name)}/start`);
        return response.data;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("timeout")) throw new Error(`Server start request timed out. The server may still be starting in the background.`);
          if (error.message.includes("Network Error")) throw new Error(`Network error. Please check your connection to the server.`);
          if (error.message.includes("404")) throw new Error(`Server not found. Please check the server name.`);
          throw new Error(`Failed to start server: ${error.message}`);
        }
        throw new Error("Failed to start server: Unknown error");
      }
    }
  },

  isNativeServerRunning: async (name: string): Promise<boolean> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return Math.random() > 0.5;
    } else {
      try {
        if (!api) throw new Error("API instance not available");
        const response = await api.get<{ success: boolean; running: boolean }>(`/api/native-servers/${encodeURIComponent(name)}/running`);
        return response.data.success && response.data.running;
      } catch (error) {
        console.error("Failed to check native server running status:", error);
        return false;
      }
    }
  },

  stopNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: `Native server ${name} stopped successfully` };
    } else {
      console.log(`🛑 Making stop request for native server: ${name}`);
      try {
        const response = await api.post<{ success: boolean; message: string }>(`/api/native-servers/${encodeURIComponent(name)}/stop`);
        console.log(`✅ Stop response:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Stop request failed:`, error);
        throw error;
      }
    }
  },

  restartNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, message: `Native server ${name} restarted successfully` };
    } else {
      console.log(`🔄 Making restart request for native server: ${name}`);
      try {
        const response = await api.post<{ success: boolean; message: string }>(`/api/native-servers/${encodeURIComponent(name)}/restart`);
        console.log(`✅ Restart response:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Restart request failed:`, error);
        throw error;
      }
    }
  },

  startContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: `Container ${name} started successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(`/api/containers/${encodeURIComponent(name)}/start`);
      return response.data;
    }
  },

  stopContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: `Container ${name} stopped successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(`/api/containers/${encodeURIComponent(name)}/stop`);
      return response.data;
    }
  },

  restartContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { success: true, message: `Container ${name} restarted successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(`/api/containers/${encodeURIComponent(name)}/restart`);
      return response.data;
    }
  },

  sendRconCommand: async (name: string, command: string): Promise<RconResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockResponses: Record<string, string> = {
        listplayers: "Players online: 3\n1. Player1 (SteamID: 123456789)\n2. Player2 (SteamID: 987654321)\n3. Player3 (SteamID: 456789123)",
        saveworld: "World saved successfully",
        broadcast: "Message broadcasted to all players",
        kickplayer: "Player kicked successfully",
        banplayer: "Player banned successfully",
        destroywilddinos: "All wild dinosaurs destroyed",
        shutdown: "Server shutdown initiated",
      };
      const response = mockResponses[command.toLowerCase()] || `Command executed: ${command}`;
      return { success: true, message: "Command sent successfully", response };
    } else {
      const response = await api.post<RconResponse>(`/api/containers/${encodeURIComponent(name)}/rcon`, { command });
      return response.data;
    }
  },

  sendNativeRconCommand: async (name: string, command: string): Promise<RconResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockResponses: Record<string, string> = {
        listplayers: "Players online: 3\n1. Player1 (SteamID: 123456789)\n2. Player2 (SteamID: 987654321)\n3. Player3 (SteamID: 456789123)",
        saveworld: "World saved successfully",
        broadcast: "Message broadcasted to all players",
        kickplayer: "Player kicked successfully",
        banplayer: "Player banned successfully",
        destroywilddinos: "All wild dinosaurs destroyed",
        shutdown: "Server shutdown initiated",
      };
      const response = mockResponses[command.toLowerCase()] || `Command executed: ${command}`;
      return { success: true, message: "Command sent successfully", response };
    } else {
      const response = await api.post<RconResponse>(`/api/native-servers/${encodeURIComponent(name)}/rcon`, { command });
      return response.data;
    }
  },

  getServerMods: async (serverName: string): Promise<{ success: boolean; serverConfig: { additionalMods: number[]; excludeSharedMods: boolean } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, serverConfig: { additionalMods: [1609138312, 215527665], excludeSharedMods: false } }), 500);
      });
    }
    const response = await api.get(`/api/provisioning/server-mods/${serverName}`);
    return response.data;
  },

  getNativeServerStartBat: async (serverName: string): Promise<{ success: boolean; content: string; path: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, content: `@echo off\necho Starting ${serverName}...\n"ArkAscendedServer.exe" "TheIsland?listen?SessionName=${serverName}?Port=7777?QueryPort=27015?RCONPort=32330?RCONEnabled=True?MaxPlayers=70?ServerPassword=?ServerAdminPassword=admin123" -mods=928102085,1404697612 -servergamelog -NotifyAdminCommandsInChat -UseDynamicConfig -ClusterDirOverride=C:\\ARK\\clusters\\MyCluster\\clusterdata -NoTransferFromFiltering -clusterid=MyCluster -NoBattleEye\necho Server ${serverName} has stopped.\npause`, path: `C:\\ARK\\clusters\\MyCluster\\${serverName}\\start.bat` }), 500);
      });
    }
    const response = await api.get(`/api/native-servers/${serverName}/start-bat`);
    return response.data;
  },

  regenerateNativeServerStartBat: async (serverName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Start.bat regenerated for server ${serverName} with latest mods and configuration (mock)` }), 1000);
      });
    }
    const response = await api.post(`/api/native-servers/${serverName}/regenerate-start-bat`);
    return response.data;
  },

  getConfigFile: async (serverName: string, fileName: string): Promise<{ content: string; fileName: string; serverName: string; configPath: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ content: `# Mock config content for ${fileName}\n# This is a placeholder for frontend-only mode`, fileName, serverName, configPath: `/mock/path/${fileName}` }), 500);
      });
    }
    try {
      const response = await api.get(`/api/native-servers/${serverName}/config/${fileName}`);
      return response.data;
    } catch {
      return { content: "", fileName, serverName, configPath: "" };
    }
  },

  updateConfigFile: async (serverName: string, content: string, fileName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Config file ${fileName} updated successfully (mock)` }), 500);
      });
    }
    try {
      const response = await api.put(`/api/native-servers/${serverName}/config/${fileName}`, { content });
      return response.data;
    } catch (error: unknown) {
      return { success: false, message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update config file" };
    }
  },

  getServerLogs: async (serverName: string, options: { follow?: boolean; lines?: number } = {}): Promise<{ success: boolean; content: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, content: `Mock server logs for ${serverName}...\n[INFO] Server started\n[INFO] Players connected: 5\n[INFO] World saved` }), 500);
      });
    }
    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/logs`, { params: options });
      return response.data;
    } catch (error: unknown) {
      return { success: false, content: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to get server logs" };
    }
  },

  getAutoShutdownConfig: async (): Promise<{ success: boolean; config: Record<string, unknown> }> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, config: { enabled: false, emptyTimeoutMinutes: 30, warningIntervals: [15, 10, 5, 2], warningMessage: "Server will shut down in {time} minutes due to inactivity", excludeServers: [] } };
    } else {
      const response = await api.get<{ success: boolean; config: Record<string, unknown> }>("/api/auto-shutdown/config");
      return response.data;
    }
  },

  updateAutoShutdownConfig: async (config: Record<string, unknown>): Promise<{ success: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true };
    } else {
      const response = await api.post<{ success: boolean }>("/api/auto-shutdown/config", config);
      return response.data;
    }
  },

  async getSaveFiles(serverName: string): Promise<{ success: boolean; files: Array<{ name: string; path: string; size: number; modified: string }>; message?: string }> {
    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files`);
      return response.data;
    } catch (error) {
      console.error("Error getting save files:", error);
      return { success: false, files: [], message: "Failed to get save files" };
    }
  },

  async uploadSaveFile(serverName: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      return response.data;
    } catch (error) {
      console.error("Error uploading save file:", error);
      return { success: false, message: "Failed to upload save file" };
    }
  },

  async downloadSaveFile(serverName: string, fileName: string): Promise<{ success: boolean; data?: ArrayBuffer; message?: string }> {
    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/download/${encodeURIComponent(fileName)}`, { responseType: "arraybuffer" });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error downloading save file:", error);
      return { success: false, message: "Failed to download save file" };
    }
  },

  async backupSaveFiles(serverName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/backup`);
      return response.data;
    } catch (error) {
      console.error("Error backing up save files:", error);
      return { success: false, message: "Failed to backup save files" };
    }
  },

  async deleteSaveFile(serverName: string, fileName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/${encodeURIComponent(fileName)}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting save file:", error);
      return { success: false, message: "Failed to delete save file" };
    }
  },
};
