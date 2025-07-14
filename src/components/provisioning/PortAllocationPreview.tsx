import React, { useMemo } from 'react';
import type { WizardData } from '../../types/provisioning';

interface PortAllocationPreviewProps {
  wizardData: WizardData;
}

const PortAllocationPreview: React.FC<PortAllocationPreviewProps> = ({ wizardData }) => {
  const previewPorts = useMemo(() => {
    const ports = [];
    const basePort = wizardData.basePort;
    const mode = wizardData.portAllocationMode;
    
    console.log('PortAllocationPreview - basePort:', basePort, 'mode:', mode);
    
    for (let i = 0; i < Math.min(wizardData.serverCount, 5); i++) {
      if (mode === 'sequential') {
        // Sequential mode: Game ports increment by 1, Query/RCON use standard ARK offsets
        const gamePort = basePort + i;
        const queryPort = 27015 + i;
        const rconPort = basePort + i + 24553;
        console.log(`Sequential Server ${i+1}: Game=${gamePort}, Query=${queryPort}, RCON=${rconPort}`);
        ports.push({
          gamePort,
          queryPort,
          rconPort
        });
      } else {
        // Even mode: Everything increments by 2
        const gamePort = basePort + (i * 6);
        const queryPort = basePort + (i * 6) + 2;
        const rconPort = basePort + (i * 6) + 4;
        console.log(`Even Server ${i+1}: Game=${gamePort}, Query=${queryPort}, RCON=${rconPort}`);
        ports.push({
          gamePort,
          queryPort,
          rconPort
        });
      }
    }
    return ports;
  }, [wizardData.basePort, wizardData.serverCount, wizardData.portAllocationMode]);

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