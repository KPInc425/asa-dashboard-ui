import React from 'react';
import type { DiscordBotConfigForm } from './types';

interface BotConfigModalProps {
  form: DiscordBotConfigForm;
  onChange: (updates: Partial<DiscordBotConfigForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const BotConfigModal: React.FC<BotConfigModalProps> = ({ form, onChange, onSubmit, onClose }) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Configure Discord Bot</h3>
        <form onSubmit={onSubmit}>
          <div className="form-control">
            <label className="label"><span className="label-text">Bot Token</span></label>
            <input
              type="password"
              placeholder="Enter your Discord bot token"
              className="input input-bordered"
              value={form.token}
              onChange={(e) => onChange({ token: e.target.value })}
              required
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Application ID</span></label>
            <input
              type="text"
              placeholder="Enter your Discord application ID"
              className="input input-bordered"
              value={form.applicationId}
              onChange={(e) => onChange({ applicationId: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt">Found in Discord Developer Portal → General Information</span>
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Enable Bot</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={form.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
              />
            </label>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Configuration</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BotConfigModal;
