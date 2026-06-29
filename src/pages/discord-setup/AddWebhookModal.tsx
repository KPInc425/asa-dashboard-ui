import React from 'react';
import type { DiscordWebhookForm } from './types';

interface AddWebhookModalProps {
  form: DiscordWebhookForm;
  onChange: (updates: Partial<DiscordWebhookForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const AddWebhookModal: React.FC<AddWebhookModalProps> = ({ form, onChange, onSubmit, onClose }) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Add Discord Webhook</h3>
        <form onSubmit={onSubmit}>
          <div className="form-control">
            <label className="label"><span className="label-text">Webhook Name</span></label>
            <input
              type="text"
              placeholder="e.g., Server Notifications"
              className="input input-bordered"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              required
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Webhook URL</span></label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              className="input input-bordered"
              value={form.url}
              onChange={(e) => onChange({ url: e.target.value })}
              required
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Channel Name</span></label>
            <input
              type="text"
              placeholder="e.g., #server-status"
              className="input input-bordered"
              value={form.channel}
              onChange={(e) => onChange({ channel: e.target.value })}
              required
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Webhook</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebhookModal;
