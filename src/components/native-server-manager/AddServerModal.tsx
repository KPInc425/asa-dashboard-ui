import React from 'react';
import type { NativeServer, NativeServerConfig } from './types';

interface AddServerModalProps {
  editingServer: NativeServer | null;
  formData: Partial<NativeServerConfig>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<NativeServerConfig>>>;
  setShowAddModal: (show: boolean) => void;
  setEditingServer: (server: NativeServer | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({
  editingServer, formData, setFormData, setShowAddModal, setEditingServer, handleSubmit,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{editingServer ? 'Edit Server' : 'Add New Server'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text">Server Path</span></label>
              <input type="text" placeholder="C:\ARK\servers" className="input input-bordered w-full"
                value={formData.serverPath} onChange={(e) => setFormData(prev => ({ ...prev, serverPath: e.target.value }))} required />
            </div>
            <div>
              <label className="label"><span className="label-text">Server Name</span></label>
              <input type="text" placeholder="ASA Server" className="input input-bordered w-full"
                value={formData.serverName} onChange={(e) => setFormData(prev => ({ ...prev, serverName: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label"><span className="label-text">Map</span></label>
              <select className="select select-bordered w-full" value={formData.mapName}
                onChange={(e) => setFormData(prev => ({ ...prev, mapName: e.target.value }))}>
                <option value="TheIsland">The Island</option>
                <option value="TheCenter">The Center</option>
                <option value="ScorchedEarth">Scorched Earth</option>
                <option value="Ragnarok">Ragnarok</option>
                <option value="Aberration">Aberration</option>
                <option value="Extinction">Extinction</option>
                <option value="Valguero">Valguero</option>
                <option value="Genesis">Genesis</option>
                <option value="CrystalIsles">Crystal Isles</option>
                <option value="Genesis2">Genesis Part 2</option>
                <option value="LostIsland">Lost Island</option>
                <option value="Fjordur">Fjordur</option>
              </select>
            </div>
            <div>
              <label className="label"><span className="label-text">Game Port</span></label>
              <input type="number" min="1024" max="65535" className="input input-bordered w-full"
                value={formData.gamePort} onChange={(e) => setFormData(prev => ({ ...prev, gamePort: parseInt(e.target.value) }))} required />
            </div>
            <div>
              <label className="label"><span className="label-text">Max Players</span></label>
              <input type="number" min="1" max="255" className="input input-bordered w-full"
                value={formData.maxPlayers} onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text">Query Port</span></label>
              <input type="number" min="1024" max="65535" className="input input-bordered w-full"
                value={formData.queryPort} onChange={(e) => setFormData(prev => ({ ...prev, queryPort: parseInt(e.target.value) }))} required />
            </div>
            <div>
              <label className="label"><span className="label-text">RCON Port</span></label>
              <input type="number" min="1024" max="65535" className="input input-bordered w-full"
                value={formData.rconPort} onChange={(e) => setFormData(prev => ({ ...prev, rconPort: parseInt(e.target.value) }))} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text">Server Password (optional)</span></label>
              <input type="text" placeholder="Leave empty for no password" className="input input-bordered w-full"
                value={formData.serverPassword} onChange={(e) => setFormData(prev => ({ ...prev, serverPassword: e.target.value }))} />
            </div>
            <div>
              <label className="label"><span className="label-text">Admin Password</span></label>
              <input type="text" placeholder="admin123" className="input input-bordered w-full"
                value={formData.adminPassword} onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label"><span className="label-text">Additional Arguments (optional)</span></label>
            <textarea placeholder="-log -nosteam -servergamelog" className="textarea textarea-bordered w-full"
              value={formData.additionalArgs} onChange={(e) => setFormData(prev => ({ ...prev, additionalArgs: e.target.value }))} rows={3} />
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Disable BattleEye</span>
              <input type="checkbox" className="toggle toggle-primary" checked={formData.disableBattleEye}
                onChange={(e) => setFormData(prev => ({ ...prev, disableBattleEye: e.target.checked }))} />
            </label>
          </div>
        </form>
        <div className="modal-action">
          <button onClick={() => { setShowAddModal(false); setEditingServer(null); }} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary">{editingServer ? 'Update Server' : 'Add Server'}</button>
        </div>
      </div>
    </div>
  );
};

export default AddServerModal;
