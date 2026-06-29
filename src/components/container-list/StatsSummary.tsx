import React from 'react';
import type { Container } from '../../services';

interface StatsSummaryProps {
  containers: Container[];
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ containers }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
        <div className="text-xl md:text-2xl font-bold text-primary">{containers.length}</div>
        <div className="text-xs md:text-sm text-base-content/70">Total Servers</div>
      </div>
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
        <div className="text-xl md:text-2xl font-bold text-success">
          {containers.filter(c => c.status === 'running').length}
        </div>
        <div className="text-xs md:text-sm text-base-content/70">Running</div>
      </div>
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
        <div className="text-xl md:text-2xl font-bold text-error">
          {containers.filter(c => c.status === 'stopped').length}
        </div>
        <div className="text-xs md:text-sm text-base-content/70">Stopped</div>
      </div>
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-lg p-4 text-center">
        <div className="text-xl md:text-2xl font-bold text-warning">
          {containers.filter(c => c.status === 'restarting').length}
        </div>
        <div className="text-xs md:text-sm text-base-content/70">Restarting</div>
      </div>
    </div>
  );
};

export default StatsSummary;
