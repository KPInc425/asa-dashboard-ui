import React, { useMemo } from 'react';
import type { WizardData } from '../../types/provisioning';

interface PortAllocationPreviewProps {
  wizardData: WizardData;
}

const getServerPorts = (wizardData: WizardData, index: number) => {
  const basePort = wizardData.basePort || 7777;
  const baseQueryPort = wizardData.portConfiguration?.queryPortBase || 27015;
  const baseRconPort = wizardData.portConfiguration?.rconPortBase || 32330;
  if (wizardData.portAllocationMode === 'even') {
    return {
      gamePort: basePort + (index * 6),
      queryPort: basePort + (index * 6) + 2,
      rconPort: basePort + (index * 6) + 4,
    };
  } else {
    return {
      gamePort: basePort + index,
      queryPort: baseQueryPort + index,
      rconPort: baseRconPort + index,
    };
  }
};

const PortAllocationPreview: React.FC<PortAllocationPreviewProps> = ({ wizardData }) => {
  const previewPorts = useMemo(() => {
    const ports = [];
    for (let i = 0; i < Math.min(wizardData.serverCount, 5); i++) {
      ports.push(getServerPorts(wizardData, i));
    }
    return ports;
  }, [wizardData.basePort, wizardData.serverCount, wizardData.portAllocationMode, wizardData.portConfiguration]);

  return (
    <div className="bg-base-300 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Port Allocation Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {previewPorts.map((ports, index) => (
          <div key={index} className="bg-base-200 rounded p-3 text-sm">
            <div className="font-semibold">Server {index + 1}</div>
            <div>Game: {ports.gamePort}</div>
            <div>Query: {ports.queryPort}</div>
            <div>RCON: {ports.rconPort}</div>
          </div>
        ))}
        {wizardData.serverCount > 5 && (
          <div className="bg-base-200 rounded p-3 text-sm">
            <div className="font-semibold">...</div>
            <div>+{wizardData.serverCount - 5} more servers</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortAllocationPreview; 