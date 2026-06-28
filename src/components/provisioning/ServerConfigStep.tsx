import React from "react";
import PasswordInput from "../PasswordInput";
import type { StepProps, WizardStep } from "../../types/provisioning";

const ServerConfigStep: React.FC<
  StepProps & { setCurrentStep?: (step: WizardStep) => void }
> = ({ wizardData, setWizardData, setCurrentStep }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Server Configuration</h2>
        <p className="text-base-content/70">Configure your server settings</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label"><span className="label-text">Max Players</span></label>
          <input type="number" value={wizardData.maxPlayers}
            onChange={(e) => setWizardData((prev) => ({ ...prev, maxPlayers: parseInt(e.target.value) || 70 }))}
            className="input input-bordered" min="1" max="100" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Admin Password</span></label>
          <PasswordInput value={wizardData.adminPassword}
            onChange={(value) => setWizardData((prev) => ({ ...prev, adminPassword: value }))}
            placeholder="Enter admin password" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Server Password (Optional)</span></label>
          <input type="text" value={wizardData.serverPassword}
            onChange={(e) => setWizardData((prev) => ({ ...prev, serverPassword: e.target.value }))}
            className="input input-bordered" placeholder="Leave empty for no password" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Cluster Password</span></label>
          <PasswordInput value={wizardData.clusterPassword}
            onChange={(value) => setWizardData((prev) => ({ ...prev, clusterPassword: value }))}
            placeholder="Enter cluster password" />
        </div>
      </div>
      {setCurrentStep && (
        <button className="btn btn-outline mt-6" onClick={() => setCurrentStep("review")}>Back to Review</button>
      )}
    </div>
  );
};

export default ServerConfigStep;
