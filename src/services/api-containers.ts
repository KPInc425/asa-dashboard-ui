/**
 * API Containers
 *
 * This file is a re-export from the api-containers/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { containerApi } from './api-containers/container-api';
export { MOCK_CONTAINERS } from './api-containers/mock-data';
          responseType: "blob",
        },
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error downloading save file:", error);
      return { success: false, message: "Failed to download save file" };
    }
  },

  async backupSaveFiles(
    serverName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(
        `/api/native-servers/${encodeURIComponent(serverName)}/save-files/backup`,
      );
      return response.data;
    } catch (error) {
      console.error("Error backing up save files:", error);
      return { success: false, message: "Failed to backup save files" };
    }
  },

  async deleteSaveFile(
    serverName: string,
    fileName: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(
        `/api/native-servers/${encodeURIComponent(serverName)}/save-files/${encodeURIComponent(fileName)}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting save file:", error);
      return { success: false, message: "Failed to delete save file" };
    }
  },
};
