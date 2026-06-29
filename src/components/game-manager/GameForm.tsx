import React from "react";
import type { GameDefinitionFormData } from "../../types/games";

interface GameFormProps {
  form: GameDefinitionFormData;
  editingType: string | null;
  onChange: (form: GameDefinitionFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

const GameForm: React.FC<GameFormProps> = ({ form, editingType, onChange, onSave, onCancel }) => {
  const setForm = (updates: Partial<GameDefinitionFormData>) => onChange({ ...form, ...updates });

  return (
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
            onChange={(e) => setForm({ gameType: e.target.value })}
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
            onChange={(e) => setForm({ displayName: e.target.value })}
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
            onChange={(e) => setForm({ binaryName: e.target.value })}
          />
        </div>
        <div className="form-control">
          <label className="label label-text">Process Names * (comma-sep)</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="e.g. VRisingServer, VRisingServer.exe"
            value={form.processNames}
            onChange={(e) => setForm({ processNames: e.target.value })}
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
            onChange={(e) => setForm({ steamAppId: e.target.value })}
          />
        </div>
        <div className="form-control">
          <label className="label label-text">Config Files * (comma-sep)</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="e.g. ServerGameSettings.json"
            value={form.configFiles}
            onChange={(e) => setForm({ configFiles: e.target.value })}
          />
        </div>

        {/* Default ports */}
        <div className="form-control">
          <label className="label label-text">Default Game Port</label>
          <input
            type="number"
            className="input input-bordered input-sm"
            value={form.defaultGamePort}
            onChange={(e) => setForm({ defaultGamePort: parseInt(e.target.value) || 7777 })}
          />
        </div>
        <div className="form-control">
          <label className="label label-text">Default Query Port</label>
          <input
            type="number"
            className="input input-bordered input-sm"
            value={form.defaultQueryPort}
            onChange={(e) => setForm({ defaultQueryPort: parseInt(e.target.value) || 27015 })}
          />
        </div>
        <div className="form-control">
          <label className="label label-text">Default RCON Port</label>
          <input
            type="number"
            className="input input-bordered input-sm"
            value={form.defaultRconPort}
            onChange={(e) => setForm({ defaultRconPort: parseInt(e.target.value) || 25575 })}
          />
        </div>
        <div className="form-control">
          <label className="label label-text">Config Sub-path</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="e.g. Config/WindowsServer"
            value={form.configSubPath}
            onChange={(e) => setForm({ configSubPath: e.target.value })}
          />
        </div>

        {/* Binary relative path */}
        <div className="form-control md:col-span-2">
          <label className="label label-text">Binary Relative Path (within install dir)</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="e.g. ShooterGame/Binaries/Win64/ArkAscendedServer.exe"
            value={form.binaryExeRelativePath}
            onChange={(e) => setForm({ binaryExeRelativePath: e.target.value })}
          />
          <label className="label">
            <span className="label-text-alt text-base-content/50">Leave empty if the binary is in the install root</span>
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
              onChange={(e) => setForm({ canCluster: e.target.checked })}
            />
            Clustering
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={form.supportsSteamWorkshop}
              onChange={(e) => setForm({ supportsSteamWorkshop: e.target.checked })}
            />
            Steam Workshop
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={form.supportsRcon}
              onChange={(e) => setForm({ supportsRcon: e.target.checked })}
            />
            RCON
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={form.supportsQuery}
              onChange={(e) => setForm({ supportsQuery: e.target.checked })}
            />
            Server Query
          </label>
        </div>
      </div>

      {/* Script templates (collapsible) */}
      <details className="bg-base-300 rounded-lg p-3">
        <summary className="cursor-pointer text-sm font-medium">Script Templates (advanced)</summary>
        <div className="mt-3 space-y-3">
          <div className="form-control">
            <label className="label label-text">Install Script Template</label>
            <textarea
              className="textarea textarea-bordered textarea-xs font-mono h-20"
              placeholder={`@ShutdownOnFailedCommand 1\n@NoPromptForPassword 1\nforce_install_dir "{{install_dir}}"\nlogin anonymous\napp_update {{app_id}}\nquit`}
              value={form.installScriptTemplate}
              onChange={(e) => setForm({ installScriptTemplate: e.target.value })}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">Use {"{{install_dir}}"} and {"{{app_id}}"} as placeholders</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label label-text">Start Script Template</label>
            <textarea
              className="textarea textarea-bordered textarea-xs font-mono h-20"
              placeholder={`@echo off\ntitle {{server_name}}\ncd /d "{{binaries_path}"\n:start\n{{binary_path}} {{startup_args}}\necho Restarting...\ntimeout /t 5\ngoto start`}
              value={form.startScriptTemplate}
              onChange={(e) => setForm({ startScriptTemplate: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label label-text">Stop Script Template</label>
            <textarea
              className="textarea textarea-bordered textarea-xs font-mono h-20"
              placeholder={`@echo off\ntaskkill /F /IM "{{process_name}}" 2>nul`}
              value={form.stopScriptTemplate}
              onChange={(e) => setForm({ stopScriptTemplate: e.target.value })}
            />
          </div>
        </div>
      </details>

      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={onSave} className="btn btn-primary btn-sm">
          {editingType ? "Update Game" : "Add Game"}
        </button>
      </div>
    </div>
  );
};

export default GameForm;
