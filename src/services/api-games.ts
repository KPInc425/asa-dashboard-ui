/**
 * Games API Service
 * Handles all API calls for game definitions CRUD
 */

import { api, FRONTEND_ONLY_MODE } from './api-core';
import type {
  GameDefinition,
  GameDefinitionsResponse,
  GameDefinitionResponse,
  GameDefinitionFormData,
} from '../types/games';

// Mock data for frontend-only mode
const MOCK_GAMES: GameDefinition[] = [
  {
    id: 'ark-sa',
    name: 'ARK: Survival Ascended',
    binaryName: 'ArkAscendedServer.exe',
    processNames: ['ArkAscendedServer', 'ArkAscendedServer.exe'],
    steamAppId: '2430930',
    configFiles: ['GameUserSettings.ini', 'Game.ini'],
    configSubPath: 'Config/WindowsServer',
    defaultPorts: {
      game: 7777,
      query: 27015,
      rcon: 27020,
    },
    capabilities: {
      canCluster: true,
      supportsSteamWorkshop: true,
      supportsRcon: true,
      supportsQuery: true,
    },
    dynamic: false,
  },
  {
    id: 'vrising',
    name: 'V Rising',
    binaryName: 'VRisingServer.exe',
    processNames: ['VRisingServer', 'VRisingServer.exe'],
    steamAppId: '1829350',
    configFiles: ['ServerGameSettings.json', 'ServerHostSettings.json'],
    configSubPath: '',
    defaultPorts: {
      game: 27015,
      query: 27016,
      rcon: 25575,
    },
    capabilities: {
      canCluster: false,
      supportsSteamWorkshop: false,
      supportsRcon: true,
      supportsQuery: true,
    },
    dynamic: false,
  },
];

// Helper to convert form data to snake_case keys the backend expects
function formToBackend(form: GameDefinitionFormData) {
  return {
    game_type: form.gameType,
    display_name: form.displayName,
    binary_name: form.binaryName,
    process_names: JSON.stringify(
      form.processNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    steam_app_id: form.steamAppId || null,
    config_files: JSON.stringify(
      form.configFiles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    config_sub_path: form.configSubPath,
    default_game_port: form.defaultGamePort,
    default_query_port: form.defaultQueryPort,
    default_rcon_port: form.defaultRconPort,
    can_cluster: form.canCluster,
    supports_steam_workshop: form.supportsSteamWorkshop,
    supports_rcon: form.supportsRcon,
    supports_query: form.supportsQuery,
    binary_exe_relative_path: form.binaryExeRelativePath || null,
    install_script_template: form.installScriptTemplate || null,
    start_script_template: form.startScriptTemplate || null,
    stop_script_template: form.stopScriptTemplate || null,
  };
}

export const gamesApi = {
  /**
   * List all registered game definitions
   */
  listGames: async (): Promise<GameDefinition[]> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_GAMES;
    }

    try {
      const response = await api.get<GameDefinitionsResponse>('/api/games');
      return response.data.games;
    } catch (error) {
      console.error('Failed to list game definitions:', error);
      throw error;
    }
  },

  /**
   * Get a single game definition by game type
   */
  getGame: async (gameType: string): Promise<GameDefinition> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const game = MOCK_GAMES.find((g) => g.id === gameType);
      if (!game) throw new Error(`Game '${gameType}' not found`);
      return game;
    }

    try {
      const response = await api.get<GameDefinitionResponse>(
        `/api/games/${encodeURIComponent(gameType)}`,
      );
      return response.data.game;
    } catch (error) {
      console.error(`Failed to get game definition for '${gameType}':`, error);
      throw error;
    }
  },

  /**
   * Create a new game definition
   */
  createGame: async (
    form: GameDefinitionFormData,
  ): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, message: 'Game definition created (mock)' };
    }

    try {
      const response = await api.post<{ success: boolean; message: string }>(
        '/api/games',
        formToBackend(form),
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create game definition:', error);
      throw error;
    }
  },

  /**
   * Update an existing game definition
   */
  updateGame: async (
    gameType: string,
    form: Partial<GameDefinitionFormData>,
  ): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, message: 'Game definition updated (mock)' };
    }

    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/api/games/${encodeURIComponent(gameType)}`,
        formToBackend(form as GameDefinitionFormData),
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update game definition '${gameType}':`, error);
      throw error;
    }
  },

  /**
   * Delete a game definition
   */
  deleteGame: async (
    gameType: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, message: 'Game definition deleted (mock)' };
    }

    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/api/games/${encodeURIComponent(gameType)}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete game definition '${gameType}':`, error);
      throw error;
    }
  },
};

export default gamesApi;
