import React, { useState, useEffect } from 'react';
import type { CreatingStepProps } from '../../types/provisioning';

const CreatingStep: React.FC<CreatingStepProps> = ({ jobId, jobProgress }) => {
  const [currentStep, setCurrentStep] = useState<string>('Validating configuration');
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('Installing ASA server files and configuring your cluster...');

  // Update progress from job progress
  useEffect(() => {
    console.log('CreatingStep: jobProgress updated:', jobProgress);
    if (jobProgress) {
      console.log('CreatingStep: Setting progress to:', jobProgress.progress);
      console.log('CreatingStep: Setting message to:', jobProgress.message);
      setProgress(jobProgress.progress);
      setMessage(jobProgress.message);
      
      if (jobProgress.step) {
        setCurrentStep(jobProgress.step);
      }
    }
  }, [jobProgress]);

  const getStepIcon = (stepName: string) => {
    const completedSteps = [
      'Validating configuration',
      'Installing ASA server files',
      'Creating server configurations',
      'Setting up cluster settings',
      'Finalizing cluster creation'
    ];
    
    const currentStepIndex = completedSteps.indexOf(currentStep);
    const stepIndex = completedSteps.indexOf(stepName);
    
    if (stepIndex < currentStepIndex) {
      return <span className="text-success">✅</span>;
    } else if (stepIndex === currentStepIndex) {
      return <span className="text-warning">⏳</span>;
    } else {
      return <span className="text-base-content/50">⏸️</span>;
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="text-3xl font-bold text-primary">Creating Your Cluster</h2>
      <p className="text-base-content/70 text-lg">{message}</p>
      <p className="text-xs text-base-content/50">Debug: Progress={progress}%, Message="{message}"</p>
      
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-base-300 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 text-sm text-base-content/70">
          {progress}% Complete
        </div>
      </div>
      
      <div className="bg-base-300 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold mb-4">Progress:</h3>
        <div className="space-y-2 text-sm text-left">
          <div className="flex items-center gap-2">
            {getStepIcon('Validating configuration')}
            <span>Validating configuration</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Installing ASA server files')}
            <span>Installing ASA server files</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Creating server configurations')}
            <span>Creating server configurations</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Setting up cluster settings')}
            <span>Setting up cluster settings</span>
          </div>
          <div className="flex items-center gap-2">
            {getStepIcon('Finalizing cluster creation')}
            <span>Finalizing cluster creation</span>
          </div>
        </div>
      </div>
      
      {jobId && (
        <div className="text-xs text-base-content/50">
          Job ID: {jobId}
        </div>
      )}
      
      <p className="text-base-content/50 text-sm">
        This process may take 10-30 minutes depending on your internet speed and the number of servers.
      </p>
    </div>
  );
};

export default CreatingStep; 