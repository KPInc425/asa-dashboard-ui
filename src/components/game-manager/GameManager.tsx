import React, { useState, useEffect } from "react";
import { gamesApi } from "../../services/api-games";
import type { GameDefinition, GameDefinitionFormData } from "../../types/games";
import type { GameManagerProps } from "./types";
import { EMPTY_FORM } from "./types";
import GameForm from "./GameForm";
import GameList from "./GameList";

const GameManager: React.FC<GameManagerProps> = ({ onClose }) => {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [form, setForm] = useState<GameDefinitionFormData>({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await gamesApi.listGames();
      setGames(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleEdit = (game: GameDefinition) => {
    setForm({
      gameType: game.id,
      displayName: game.name,
      binaryName: game.binaryName,
      processNames: game.processNames.join(", "),
      steamAppId: game.steamAppId || "",
      configFiles: game.configFiles.join(", "),
      configSubPath: game.configSubPath || "",
      defaultGamePort: game.defaultPorts.game,
      defaultQueryPort: game.defaultPorts.query,
      defaultRconPort: game.defaultPorts.rcon,
      canCluster: game.capabilities.canCluster,
      supportsSteamWorkshop: game.capabilities.supportsSteamWorkshop,
      supportsRcon: game.capabilities.supportsRcon,
      supportsQuery: game.capabilities.supportsQuery,
      binaryExeRelativePath: game.binaryExeRelativePath || "",
      installScriptTemplate: "",
      startScriptTemplate: "",
      stopScriptTemplate: "",
    });
    setEditingType(game.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingType(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!form.gameType.trim()) { setError("Game type is required"); return; }
    if (!form.displayName.trim()) { setError("Display name is required"); return; }
    if (!form.binaryName.trim()) { setError("Binary name is required"); return; }
    if (!form.processNames.trim()) { setError("Process names are required"); return; }
    if (!form.configFiles.trim()) { setError("Config files are required"); return; }

    try {
      if (editingType) {
        await gamesApi.updateGame(editingType, form);
        setSuccess(`Game "${form.displayName}" updated successfully`);
      } else {
        await gamesApi.createGame(form);
        setSuccess(`Game "${form.displayName}" created successfully`);
      }
      setShowForm(false);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save game");
    }
  };

  const handleDelete = async (game: GameDefinition) => {
    if (game.dynamic === false) {
      setError(`Cannot delete built-in game "${game.name}"`);
      return;
    }
    if (!window.confirm(`Delete game "${game.name}"? This cannot be undone. Existing servers using this game type will still work.`)) return;

    try {
      await gamesApi.deleteGame(game.id);
      setSuccess(`Game "${game.name}" deleted`);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete game");
    }
  };

  const officialCount = games.filter((g) => !g.dynamic).length;
  const customCount = games.filter((g) => g.dynamic).length;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-4">🎮 Game Manager</h3>
        <p className="text-xs text-base-content/60 mb-4">
          Manage supported game types. Built-in games (ARK) are pre-configured.
          Add custom games to provision and manage servers for any Steam-based game.
          Each game type needs its binary name, config files, and startup settings defined.
        </p>

        {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
        {success && <div className="alert alert-success mb-4"><span>{success}</span></div>}

        {showForm ? (
          <GameForm
            form={form}
            editingType={editingType}
            onChange={setForm}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <GameList
            games={games}
            loading={loading}
            officialCount={officialCount}
            customCount={customCount}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleNew}
          />
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn">Close</button>
        </div>
      </div>
    </div>
  );
};

export default GameManager;
