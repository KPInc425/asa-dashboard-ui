import React from "react";
import type { StepProps, WizardStep, ServerConfig } from "../../types/provisioning";

const ReviewStep: React.FC<
  StepProps & { setCurrentStep?: (step: WizardStep) => void }
> = ({ wizardData, generateServers, setCurrentStep }) => {
  const servers: ServerConfig[] = generateServers();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Review Configuration</h2>
        <p className="text-base-content/70">Review your cluster configuration before creating</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-base-300 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Cluster Information</h3>
            {setCurrentStep && (
              <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("cluster-basic")}>Edit</button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {wizardData.clusterName}</div>
            <div><span className="font-medium">Description:</span> {wizardData.description}</div>
            <div><span className="font-medium">Servers:</span> {wizardData.serverCount}</div>
            <div><span className="font-medium">Base Port:</span> {wizardData.basePort}</div>
          </div>
        </div>
        <div className="bg-base-300 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Server Settings</h3>
            {setCurrentStep && (
              <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("server-config")}>Edit</button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Max Players:</span> {wizardData.maxPlayers}</div>
            <div><span className="font-medium">Admin Password:</span> {wizardData.adminPassword ? "***" : "Not set"}</div>
            <div><span className="font-medium">Server Password:</span> {wizardData.serverPassword ? "***" : "Not set"}</div>
            <div><span className="font-medium">Cluster Password:</span> {wizardData.clusterSettings?.clusterPassword ? "***" : "Not set"}</div>
          </div>
        </div>
        <div className="bg-base-300 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Cluster Settings</h3>
            {setCurrentStep && (
              <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("cluster-basic")}>Edit</button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Cluster ID:</span> {wizardData.clusterSettings?.clusterId || "Not set"}</div>
            <div><span className="font-medium">Cluster Name:</span> {wizardData.clusterSettings?.clusterName || "Not set"}</div>
            <div><span className="font-medium">Cluster Description:</span> {wizardData.clusterSettings?.clusterDescription || "Not set"}</div>
            <div><span className="font-medium">Cluster Owner:</span> {wizardData.clusterSettings?.clusterOwner || "Not set"}</div>
          </div>
        </div>
        <div className="bg-base-300 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Port Configuration</h3>
            {setCurrentStep && (
              <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("cluster-basic")}>Edit</button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {(() => {
              const ports = servers.map((s) => s.gamePort);
              const base = wizardData.portConfiguration?.basePort || wizardData.basePort;
              const inc = wizardData.portConfiguration?.portIncrement || 1;
              const isSequential = ports.every((p, i) => p === base + i * inc);
              return <div><span className="font-medium">Allocation Mode:</span> {isSequential ? "Sequential" : "Custom"}</div>;
            })()}
            <div><span className="font-medium">Base Port:</span> {wizardData.portConfiguration?.basePort || wizardData.basePort}</div>
            <div><span className="font-medium">Port Increment:</span> {wizardData.portConfiguration?.portIncrement || 1}</div>
          </div>
        </div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Maps</h3>
          {setCurrentStep && (
            <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("map-selection")}>Edit</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {wizardData.selectedMaps.map((m, i) => (
            <span key={i} className="badge badge-primary">{m.displayName || m.map} x{m.count}</span>
          ))}
        </div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Game Settings</h3>
          {setCurrentStep && (
            <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("game-settings")}>Edit</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {Object.entries(wizardData.gameSettings).map(([k, v]) => (
            <div key={k}><span className="font-medium">{k}:</span> {String(v)}</div>
          ))}
        </div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Mods</h3>
          {setCurrentStep && (
            <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("mods")}>Edit</button>
          )}
        </div>
        <div className="mb-2 text-sm"><span className="font-medium">Global Mods:</span> {wizardData.globalMods.join(", ") || "None"}</div>
        <div className="mb-2 text-sm">
          <span className="font-medium">Server Mods:</span>
          <ul className="ml-4">
            {servers.map((server) => {
              const modsConfig = (wizardData.serverMods[server.name] as { additionalMods: string[]; excludeSharedMods: boolean; customDynamicConfigUrl?: string }) || { additionalMods: [], excludeSharedMods: false, customDynamicConfigUrl: "" };
              const globalMods = wizardData.globalMods || [];
              const additionalMods = modsConfig.additionalMods || [];
              const excludeShared = modsConfig.excludeSharedMods;
              let serverMods: string[] = [];
              if (excludeShared) {
                const s = server as { mods?: string[] };
                serverMods = Array.isArray(s.mods) ? s.mods : [];
              } else {
                serverMods = additionalMods;
              }
              const effectiveMods = excludeShared ? serverMods : globalMods.concat(serverMods);
              return (
                <li key={server.name} className="mb-1">
                  <span className="font-medium">{server.name}:</span>
                  {excludeShared && <span className="badge badge-warning ml-2">Excludes Global Mods</span>}
                  <br />
                  <span className="text-xs">{excludeShared ? `Server Mods: ${serverMods.length > 0 ? serverMods.join(", ") : "None"}` : `Additional Mods: ${serverMods.length > 0 ? serverMods.join(", ") : "None"}`}</span>
                  <br />
                  <span className="text-xs">Effective Mods: {effectiveMods.length > 0 ? effectiveMods.join(", ") : "None"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">INI Values</h3>
        </div>
        <div className="mb-2 text-xs">
          <span className="font-medium">Game.ini:</span>
          <pre className="bg-base-200 rounded p-2 overflow-x-auto max-h-32">{wizardData.gameIni || "Not set"}</pre>
        </div>
        <div className="mb-2 text-xs">
          <span className="font-medium">GameUserSettings.ini:</span>
          <pre className="bg-base-200 rounded p-2 overflow-x-auto max-h-32">{wizardData.gameUserSettingsIni || "Not set"}</pre>
        </div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Custom Dynamic Config URL</h3>
          {setCurrentStep && (
            <button className="btn btn-xs btn-outline" onClick={() => setCurrentStep("game-settings")}>Edit</button>
          )}
        </div>
        <div className="text-sm">{wizardData.customDynamicConfigUrl || "Not set"}</div>
      </div>
      <div className="bg-base-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Server List</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((server, index) => (
            <div key={index} className="bg-base-200 rounded p-3 text-sm">
              <div className="font-semibold">{server.name}</div>
              <div>Map: {server.map}</div>
              <div>Game Port: {server.gamePort}</div>
              <div>Query Port: {server.queryPort}</div>
              <div>RCON Port: {server.rconPort}</div>
              <div>Max Players: {server.maxPlayers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
