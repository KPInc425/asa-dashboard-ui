import React, { useState, useEffect } from "react";
import { gamesApi } from "../services/api-games";
import type { GameDefinition, GameDefinitionFormData } from "../types/games";

interface GameManagerProps {
  onClose: () => void;
}

const EMPTY_FORM: GameDefinitionFormData = {
  gameType: "",
  displayName: "",
  binaryName: "",
  processNames: "",
  steamAppId: "",
  configFiles: "",
  configSubPath: "",
  defaultGamePort: 7777,
  defaultQueryPort: 27015,
  defaultRconPort: 25575,
  canCluster: false,
  supportsSteamWorkshop: false,
  supportsRcon: true,
  supportsQuery: false,
  binaryExeRelativePath: "",
  installScriptTemplate: "",
  startScriptTemplate: "",
  stopScriptTemplate: "",
};

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

    if (!form.gameType.trim()) {
      setError("Game type is required");
      return;
    }
    if (!form.displayName.trim()) {
      setError("Display name is required");
      return;
    }
    if (!form.binaryName.trim()) {
      setError("Binary name is required");
      return;
    }
    if (!form.processNames.trim()) {
      setError("Process names are required");
      return;
    }
    if (!form.configFiles.trim()) {
      setError("Config files are required");
      return;
    }

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
    if (
      !window.confirm(
        `Delete game "${game.name}"? This cannot be undone. Existing servers using this game type will still work.`,
      )
    )
      return;

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
          Add custom games to provision and manage servers for any Steam-based
          game. Each game type needs its binary name, config files, and startup
          settings defined.
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        {showForm ? (
          /* Game definition form */
          <div className="bg-base-200 rounded-lg p-4 mb-4 space-y-3">
            <h4 className="font-semibold">
              {editingType ? `Edit "${editingType}"` : "Add New Game"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Identity */}
              <div className="form-control">
                <label className="label label-text">Game Type ID *</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. vrising"
                  value={form.gameType}
                  onChange={(e) =>
                    setForm({ ...form, gameType: e.target.value })
                  }
                  disabled={!!editingType}
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Display Name *</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. V Rising"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                />
              </div>

              {/* Binary */}
              <div className="form-control">
                <label className="label label-text">Binary/Executable Name *</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. VRisingServer.exe"
                  value={form.binaryName}
                  onChange={(e) =>
                    setForm({ ...form, binaryName: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Process Names * (comma-sep)</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. VRisingServer, VRisingServer.exe"
                  value={form.processNames}
                  onChange={(e) =>
                    setForm({ ...form, processNames: e.target.value })
                  }
                />
              </div>

              {/* Steam */}
              <div className="form-control">
                <label className="label label-text">Steam App ID</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. 1829350"
                  value={form.steamAppId}
                  onChange={(e) =>
                    setForm({ ...form, steamAppId: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Config Files * (comma-sep)</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. ServerGameSettings.json"
                  value={form.configFiles}
                  onChange={(e) =>
                    setForm({ ...form, configFiles: e.target.value })
                  }
                />
              </div>

              {/* Default ports */}
              <div className="form-control">
                <label className="label label-text">Default Game Port</label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={form.defaultGamePort}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultGamePort: parseInt(e.target.value) || 7777,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Default Query Port</label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={form.defaultQueryPort}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultQueryPort: parseInt(e.target.value) || 27015,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Default RCON Port</label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={form.defaultRconPort}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultRconPort: parseInt(e.target.value) || 25575,
                    })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label label-text">Config Sub-path</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. Config/WindowsServer"
                  value={form.configSubPath}
                  onChange={(e) =>
                    setForm({ ...form, configSubPath: e.target.value })
                  }
                />
              </div>

              {/* Binary relative path */}
              <div className="form-control md:col-span-2">
                <label className="label label-text">
                  Binary Relative Path (within install dir)
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="e.g. ShooterGame/Binaries/Win64/ArkAscendedServer.exe"
                  value={form.binaryExeRelativePath}
                  onChange={(e) =>
                    setForm({ ...form, binaryExeRelativePath: e.target.value })
                  }
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    Leave empty if the binary is in the install root
                  </span>
                </label>
              </div>
            </div>

            {/* Capabilities checkboxes */}
            <div>
              <label className="label label-text">Capabilities</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={form.canCluster}
                    onChange={(e) =>
                      setForm({ ...form, canCluster: e.target.checked })
                    }
                  />
                  Clustering
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={form.supportsSteamWorkshop}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        supportsSteamWorkshop: e.target.checked,
                      })
                    }
                  />
                  Steam Workshop
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={form.supportsRcon}
                    onChange={(e) =>
                      setForm({ ...form, supportsRcon: e.target.checked })
                    }
                  />
                  RCON
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={form.supportsQuery}
                    onChange={(e) =>
                      setForm({ ...form, supportsQuery: e.target.checked })
                    }
                  />
                  Server Query
                </label>
              </div>
            </div>

            {/* Script templates (collapsible) */}
            <details className="bg-base-300 rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Script Templates (advanced)
              </summary>
              <div className="mt-3 space-y-3">
                <div className="form-control">
                  <label className="label label-text">
                    Install Script Template
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-xs font-mono h-20"
                    placeholder={`@ShutdownOnFailedCommand 1\n@NoPromptForPassword 1\nforce_install_dir "{{install_dir}}"\nlogin anonymous\napp_update {{app_id}}\nquit`}
                    value={form.installScriptTemplate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        installScriptTemplate: e.target.value,
                      })
                    }
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      Use {"{{install_dir}}"} and {"{{app_id}}"} as placeholders
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label label-text">
                    Start Script Template
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-xs font-mono h-20"
                    placeholder={`@echo off\ntitle {{server_name}}\ncd /d "{{binaries_path}"\n:start\n{{binary_path}} {{startup_args}}\necho Restarting...\ntimeout /t 5\ngoto start`}
                    value={form.startScriptTemplate}
                    onChange={(e) =>
                      setForm({ ...form, startScriptTemplate: e.target.value })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label label-text">
                    Stop Script Template
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-xs font-mono h-20"
                    placeholder={`@echo off\ntaskkill /F /IM "{{process_name}}" 2>nul`}
                    value={form.stopScriptTemplate}
                    onChange={(e) =>
                      setForm({ ...form, stopScriptTemplate: e.target.value })
                    }
                  />
                </div>
              </div>
            </details>

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary btn-sm">
                {editingType ? "Update Game" : "Add Game"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Add button */}
            <button onClick={handleNew} className="btn btn-primary btn-sm mb-4">
              ➕ Add New Game
            </button>

            {/* Game list */}
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner"></span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-1">
                <div className="text-sm text-base-content/70 mb-2">
                  {games.length} games ({officialCount} built-in, {customCount}{" "}
                  custom)
                </div>
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {game.name}
                        </span>
                        <span className="text-xs text-base-content/50 font-mono">
                          {game.id}
                        </span>
                        {!game.dynamic && (
                          <span className="badge badge-xs badge-ghost">
                            built-in
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-base-content/50 mt-0.5">
                        {game.binaryName} ·{" "}
                        {game.configFiles.join(", ").substring(0, 60)}
                        {game.configFiles.join(", ").length > 60 ? "..." : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {game.dynamic && (
                        <button
                          onClick={() => handleDelete(game)}
                          className="btn btn-ghost btn-xs text-error"
                          title="Delete game"
                        >
                          🗑️
                        </button>
                      )}
                      {game.dynamic ? (
                        <button
                          onClick={() => handleEdit(game)}
                          className="btn btn-ghost btn-xs"
                          title="Edit game"
                        >
                          ✏️
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(game)}
                          className="btn btn-ghost btn-xs text-base-content/50"
                          title="View configuration (built-in)"
                        >
                          👁️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameManager;
