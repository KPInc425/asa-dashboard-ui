import React from 'react';
import type { Container } from '../../services';

interface BulkActionsProps {
  containers: Container[];
  onAction: (action: 'start' | 'stop' | 'restart', name: string) => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({ containers, onAction }) => {
  return (
    <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.4s' }}>
      <h3 className="text-lg font-semibold text-primary mb-4">Bulk Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <button
          onClick={() => { containers.forEach(c => { if (c.status === 'stopped') onAction('start', c.name); }); }}
          className="btn btn-success btn-sm bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/25"
        >
          🚀 Start All Stopped
        </button>
        <button
          onClick={() => { containers.forEach(c => { if (c.status === 'running') onAction('stop', c.name); }); }}
          className="btn btn-error btn-sm bg-gradient-to-br from-secondary to-error hover:shadow-lg hover:shadow-error/25"
        >
          🛑 Stop All Running
        </button>
        <button
          onClick={() => { containers.forEach(c => { if (c.status === 'running') onAction('restart', c.name); }); }}
          className="btn btn-warning btn-sm hover:shadow-lg hover:shadow-warning/25 sm:col-span-2 lg:col-span-1"
        >
          🔄 Restart All Running
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
