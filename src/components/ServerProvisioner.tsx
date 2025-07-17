import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { socketService, type JobProgress } from '../services/socket';
import PasswordInput from './PasswordInput';
import GlobalConfigManager from './GlobalConfigManager';
import GlobalModManager from './GlobalModManager';
import type { SystemInfo, Cluster, WizardData, WizardStep, ServerConfig, StepProps } from '../types/provisioning';
import { WelcomeStep, ClusterBasicStep, MapSelectionStep, GameSettingsStep, CreatingStep } from './provisioning';

const ReviewStep: React.FC<StepProps> = ({ wizardData, generateServers }) => {
  const servers = generateServers();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Review Configuration</h2>
        <p className="text-base-content/70">Review your cluster configuration before creating</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-base-300 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Cluster Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {wizardData.clusterName}</div>
            <div><span className="font-medium">Description:</span> {wizardData.description}</div>
            <div><span className="font-medium">Servers:</span> {wizardData.serverCount}</div>
            <div><span className="font-medium">Base Port:</span> {wizardData.basePort}</div>
          </div>
        </div>
        
        <div className="bg-base-300 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Server Settings</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Max Players:</span> {wizardData.maxPlayers}</div>
            <div><span className="font-medium">Admin Password:</span> {wizardData.adminPassword ? '***' : 'Not set'}</div>
            <div><span className="font-medium">Server Password:</span> {wizardData.serverPassword ? '***' : 'Not set'}</div>
            <div><span className="font-medium">Cluster Password:</span> {wizardData.clusterPassword ? '***' : 'Not set'}</div>
          </div>
        </div>
      </div>
      
      <div className="bg-base-300 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Server List</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((server, index) => (
            <div key={index} className="bg-base-200 rounded p-3 text-sm">
              <div className="font-semibold">{server.name}</div>
              <div>Map: {server.map}</div>
              <div>Port: {server.gamePort}</div>
              <div>Players: {server.maxPlayers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ServerConfigStep: React.FC<StepProps & { setCurrentStep: (step: WizardStep) => void }> = ({ wizardData, setWizardData, setCurrentStep }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Server Configuration</h2>
        <p className="text-base-content/70">Configure your server settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Max Players</span>
          </label>
          <input
            type="number"
            value={wizardData.maxPlayers}
            onChange={(e) => setWizardData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) || 70 }))}
            className="input input-bordered"
            min="1"
            max="100"
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Admin Password</span>
          </label>
          <PasswordInput
            value={wizardData.adminPassword}
            onChange={(value) => setWizardData(prev => ({ ...prev, adminPassword: value }))}
            placeholder="Enter admin password"
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Server Password (Optional)</span>
          </label>
          <input
            type="text"
            value={wizardData.serverPassword}
            onChange={(e) => setWizardData(prev => ({ ...prev, serverPassword: e.target.value }))}
            className="input input-bordered"
            placeholder="Leave empty for no password"
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Cluster Password</span>
          </label>
          <PasswordInput
            value={wizardData.clusterPassword}
            onChange={(value) => setWizardData(prev => ({ ...prev, clusterPassword: value }))}
            placeholder="Enter cluster password"
          />
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('map-selection')}
          className="btn btn-outline"
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep('game-settings')}
          className="btn btn-primary"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const ServerProvisioner: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(true);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [showGlobalConfigManager, setShowGlobalConfigManager] = useState(false);
  const [showGlobalModManager, setShowGlobalModManager] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    clusterName: '',
    description: '',
    serverCount: 1,
    basePort: 7777,
    portAllocationMode: 'sequential',
    selectedMaps: [],
    customMapName: '',
    customMapDisplayName: '',
    customMapCount: 1,
    globalSessionName: '',
    maxPlayers: 70,
    adminPassword: 'admin123',
    serverPassword: '',
    clusterPassword: '',
    harvestMultiplier: 2.0,
    xpMultiplier: 2.0,
    tamingMultiplier: 3.0,
    servers: [],
    foreground: false,
    sessionNameMode: 'auto',
    customDynamicConfigUrl: '',
    disableBattleEye: false
  });
  const [availableMaps] = useState<{ name: string; displayName: string; available: boolean; }[]>([]);

  useEffect(() => {
    loadSystemInfo();
    loadClusters();
    
    // Set up Socket.IO job progress listener
    socketService.onJobProgress((progress) => {
      console.log('Job progress received via Socket.IO:', progress);
      setJobProgress(progress);
      
      // If job is completed or failed, update status
      if (progress.status === 'completed') {
        setStatusMessage('✅ Cluster created successfully!');
        setStatusType('success');
        setTimeout(() => {
          setStatusMessage(null);
          setShowWizard(false);
          setCurrentStep('welcome');
          setCurrentJobId(null);
          setJobProgress(null);
          loadClusters();
        }, 3000);
      } else if (progress.status === 'failed') {
        setStatusMessage(`❌ Cluster creation failed: ${progress.error || 'Unknown error'}`);
        setStatusType('error');
        setTimeout(() => {
          setStatusMessage(null);
          setCurrentStep('review');
          setCurrentJobId(null);
          setJobProgress(null);
        }, 10000);
      }
    });
    
    // Add Socket.IO connection status logging
    socketService.onConnect(() => {
      console.log('Socket.IO connected - job progress updates should work');
    });
    
    socketService.onDisconnect((reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
    
    socketService.onError((error) => {
      console.error('Socket.IO error:', error);
    });
    
    // Cleanup Socket.IO listeners on unmount
    return () => {
      socketService.offJobProgress();
    };
  }, []);

  // Poll for job status as fallback for Socket.IO
  useEffect(() => {
    if (currentJobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiService.provisioning.getJobStatus(currentJobId);
          if (response.success && response.job) {
            const job = response.job;
            console.log('Job status polled:', job);
            
            // Update job progress with the latest information
            if (job.progress && job.progress.length > 0) {
              const latestProgress = job.progress[job.progress.length - 1];
              
              // Calculate progress based on the number of progress entries and job status
              let progressPercent = 0;
              if (job.status === 'completed') {
                progressPercent = 100;
              } else if (job.status === 'failed') {
                progressPercent = 0;
              } else {
                // Estimate progress based on typical cluster creation steps
                const totalSteps = 5; // validation, directory creation, server installation, config creation, finalization
                const currentStep = Math.min(job.progress.length, totalSteps);
                progressPercent = Math.round((currentStep / totalSteps) * 100);
              }
              
              const progressData = {
                jobId: job.id,
                status: job.status,
                progress: progressPercent,
                message: latestProgress.message,
                error: job.error
              };
              console.log('Main component: Setting jobProgress to:', progressData);
              setJobProgress(progressData);
            }
            
            if (job.status === 'completed') {
              setStatusMessage('✅ Cluster created successfully!');
              setStatusType('success');
              setCurrentJobId(null);
              setJobProgress(null);
              loadClusters();
              setTimeout(() => {
                setStatusMessage(null);
                setShowWizard(false);
                setCurrentStep('welcome');
              }, 3000);
            } else if (job.status === 'failed') {
              setStatusMessage(`❌ Cluster creation failed: ${job.error || 'Unknown error'}`);
              setStatusType('error');
              setCurrentJobId(null);
              setJobProgress(null);
              setTimeout(() => {
                setStatusMessage(null);
                setCurrentStep('review');
              }, 10000);
            }
          }
        } catch (error) {
          console.error('Failed to poll job status:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [currentJobId]);

  const loadSystemInfo = async () => {
    try {
      console.log('Loading system info...');
      const response = await apiService.provisioning.getSystemInfo();
      console.log('System info response:', response);
      if (response.success) {
        setSystemInfo(response.status);
        setStatusMessage('✅ System status refreshed');
        setStatusType('success');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
      setStatusMessage(`❌ Failed to refresh system status: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadClusters = async () => {
    try {
      console.log('Loading clusters...');
      const response = await apiService.provisioning.listClusters();
      console.log('Clusters response:', response);
      if (response.success) {
        setClusters(response.clusters || []);
      } else {
        setClusters([]);
      }
    } catch (error) {
      console.error('Failed to load clusters:', error);
      setClusters([]);
    }
  };

  const initializeSystem = async () => {
    try {
      setInstalling(true);
      setStatusMessage('Initializing system...');
      setStatusType('info');
      const response = await apiService.provisioning.initialize();
      if (response.success) {
        // After initialization, refresh system info
        await loadSystemInfo();
        setStatusMessage('System initialized successfully!');
        setStatusType('success');
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (error) {
      console.error('Failed to initialize system:', error);
      setStatusMessage(`Failed to initialize system: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      setTimeout(() => { setStatusMessage(null); }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const installSteamCmd = async () => {
    try {
      setInstalling(true);
      setStatusMessage('Installing SteamCMD...');
      setStatusType('info');
      
      const response = await apiService.provisioning.installSteamCmd();
      if (response.success) {
        setStatusMessage('✅ SteamCMD installed successfully! You can now create clusters.');
        setStatusType('success');
        
        // Refresh system info to update SteamCMD status
        await loadSystemInfo();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to install SteamCMD:', error);
      setStatusMessage(`❌ Failed to install SteamCMD: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      
      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const deleteCluster = async (clusterName: string, force: boolean = false) => {
    const message = force 
      ? `Are you sure you want to FORCE DELETE cluster "${clusterName}"? This will remove the cluster directory completely, even if it's corrupted or incomplete.`
      : `Are you sure you want to delete cluster "${clusterName}"? This will remove all server data.`;
      
    if (!confirm(message)) {
      return;
    }

    try {
      const response = await apiService.provisioning.deleteCluster(clusterName, force);
      if (response.success) {
        setStatusMessage(`✅ Cluster "${clusterName}" ${force ? 'force ' : ''}deleted successfully!`);
        setStatusType('success');
        setTimeout(() => setStatusMessage(null), 5000);
        loadClusters();
      }
    } catch (error: any) {
      console.error('Failed to delete cluster:', error);
      
      // If normal delete fails, offer force delete
      if (!force) {
        const shouldForceDelete = confirm(
          `Failed to delete cluster "${clusterName}" normally. This might be due to a corrupted or incomplete cluster.\n\n` +
          `Would you like to try force deleting it? This will remove the cluster directory completely.`
        );
        
        if (shouldForceDelete) {
          await deleteCluster(clusterName, true);
        } else {
          setStatusMessage(`❌ Failed to delete cluster "${clusterName}"`);
          setStatusType('error');
          setTimeout(() => setStatusMessage(null), 10000);
        }
      } else {
        setStatusMessage(`❌ Failed to force delete cluster "${clusterName}": ${error instanceof Error ? error.message : String(error)}`);
        setStatusType('error');
        setTimeout(() => setStatusMessage(null), 10000);
      }
    }
  };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const formatGB = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  };

  const toggleMap = (mapName: string) => {
    setWizardData(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.map(map => 
        map.map === mapName ? { ...map, enabled: !map.enabled } : map
      )
    }));
  };

  const updateMapCount = (mapName: string, count: number) => {
    setWizardData(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.map(map => 
        map.map === mapName ? { ...map, count } : map
      )
    }));
  };

  const generateServers = (): ServerConfig[] => {
    const servers: ServerConfig[] = [];
    let portCounter = wizardData.basePort || 7777;
    
    wizardData.selectedMaps.forEach(mapConfig => {
      if (mapConfig.enabled) {
        for (let i = 0; i < mapConfig.count; i++) {
          const serverName = mapConfig.count === 1 
            ? `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}`
            : `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}-${i + 1}`;
          
          servers.push({
            name: serverName,
            map: mapConfig.map,
            gamePort: portCounter,
            queryPort: portCounter + 1,
            rconPort: portCounter + 2,
            maxPlayers: wizardData.maxPlayers,
            adminPassword: wizardData.adminPassword,
            serverPassword: wizardData.serverPassword,
            rconPassword: wizardData.clusterPassword || '',
            harvestMultiplier: wizardData.harvestMultiplier,
            xpMultiplier: wizardData.xpMultiplier,
            tamingMultiplier: wizardData.tamingMultiplier,
            nameSuffix: mapConfig.displayName,
            sessionName: serverName
          });
          
          portCounter += 3;
        }
      }
    });
    return servers;
  };

  const createCluster = async () => {
    try {
      setCurrentStep('creating');
      setCurrentJobId(null); // Clear previous job ID
      setJobProgress(null);
      setStatusMessage('Creating cluster...');
      setStatusType('info');

      const response = await apiService.provisioning.createCluster(wizardData);
      if (response.success) {
        setCurrentJobId(response.jobId || null);
        setStatusMessage('Cluster creation job started. Monitoring progress...');
        setStatusType('info');
      } else {
        setStatusMessage(`❌ Failed to start cluster creation: ${response.message || 'Unknown error'}`);
        setStatusType('error');
        setCurrentStep('review');
      }
    } catch (error) {
      console.error('Failed to create cluster:', error);
      setStatusMessage(`❌ Failed to create cluster: ${error instanceof Error ? error.message : String(error)}`);
      setStatusType('error');
      setCurrentStep('review');
    }
  };

  const getClusterStatus = (cluster: Cluster) => {
    if (cluster.servers && cluster.servers.length > 0) {
      const running = cluster.servers.filter(s => s.status === 'running').length;
      const stopped = cluster.servers.filter(s => s.status === 'stopped').length;
      const total = cluster.servers.length;
      if (running === total) return { status: 'running', runningServers: running, totalServers: total };
      if (stopped === total) return { status: 'stopped', runningServers: running, totalServers: total };
      if (running > 0 && running < total) return { status: 'partial', runningServers: running, totalServers: total };
      return { status: 'unknown', runningServers: running, totalServers: total };
    }
    return { status: 'unknown', runningServers: 0, totalServers: 0 };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="badge badge-success">Running</span>;
      case 'stopped':
        return <span className="badge badge-error">Stopped</span>;
      case 'partial':
        return <span className="badge badge-warning">Partial</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  // Wizard navigation
  const nextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('cluster-basic');
        break;
      case 'cluster-basic':
        if (wizardData.clusterName.trim()) {
          setCurrentStep('map-selection');
        } else {
          alert('Please enter a cluster name');
        }
        break;
      case 'map-selection':
        if (wizardData.selectedMaps.length > 0) {
          setCurrentStep('server-config');
        } else {
          alert('Please select at least one map');
        }
        break;
      case 'server-config':
        setCurrentStep('game-settings');
        break;
      case 'game-settings':
        setCurrentStep('review');
        break;
      case 'review':
        createCluster();
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'cluster-basic':
        setCurrentStep('welcome');
        break;
      case 'map-selection':
        setCurrentStep('cluster-basic');
        break;
      case 'server-config':
        setCurrentStep('map-selection');
        break;
      case 'game-settings':
        setCurrentStep('server-config');
        break;
      case 'review':
        setCurrentStep('game-settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🦖</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">ASA Server Provisioner</h1>
                <p className="text-base-content/70">
                  Create and manage ARK: Survival Ascended server clusters with ease
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGlobalConfigManager(true)}
                className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
              >
                ⚙️ Global Config
              </button>
              <button
                onClick={() => setShowGlobalModManager(true)}
                className="btn btn-outline btn-secondary hover:shadow-lg hover:shadow-secondary/25"
              >
                🎮 Global Mods
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-base-content/70">Loading system information and cluster data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Status Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-info to-primary rounded-lg flex items-center justify-center">
                      <span className="text-xl">💻</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">System Status</h3>
                      <p className="text-sm text-base-content/70">System requirements & setup</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">SteamCMD:</span>
                      <span className={`badge badge-sm ${systemInfo?.steamCmdInstalled ? 'badge-success' : 'badge-error'}`}>
                        {systemInfo?.steamCmdInstalled ? 'Installed' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Disk Space:</span>
                      <span className="font-mono text-xs">
                        {formatGB(systemInfo?.diskSpace?.free || 0)} GB free
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Memory:</span>
                      <span className="font-mono text-xs">
                        {formatGB(systemInfo?.memory?.free || 0)} GB free
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={initializeSystem} 
                      disabled={installing}
                    >
                      {installing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Initialize'
                      )}
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={installSteamCmd} 
                      disabled={installing}
                    >
                      {installing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Install SteamCMD'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cluster Management Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-success to-accent rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏗️</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Cluster Management</h3>
                      <p className="text-sm text-base-content/70">Create and manage clusters</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Total Clusters:</span>
                      <span className="badge badge-neutral badge-sm">{clusters.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Running:</span>
                      <span className="badge badge-success badge-sm">
                        {clusters.filter(c => getClusterStatus(c).status === 'running').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Stopped:</span>
                      <span className="badge badge-error badge-sm">
                        {clusters.filter(c => getClusterStatus(c).status === 'stopped').length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => setShowWizard(true)}
                    >
                      ➕ Create Cluster
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-warning to-error rounded-lg flex items-center justify-center">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Quick Actions</h3>
                      <p className="text-sm text-base-content/70">Common management tasks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => setShowGlobalConfigManager(true)}
                    >
                      ⚙️ Global Configuration
                    </button>
                    <button 
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => setShowGlobalModManager(true)}
                    >
                      🎮 Global Mod Management
                    </button>
                  </div>
                </div>
              </div>

              {/* System Info Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
                      <span className="text-xl">ℹ️</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">System Info</h3>
                      <p className="text-sm text-base-content/70">Technical details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Node:</span>
                      <span className="font-mono">{systemInfo?.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">CPU Cores:</span>
                      <span className="font-mono">{systemInfo?.cpuCores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Platform:</span>
                      <span className="font-mono">{systemInfo?.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clusters List */}
            {clusters.length > 0 && (
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">
                    <span className="text-2xl">🏗️</span>
                    Existing Clusters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clusters.map(cluster => {
                      const status = getClusterStatus(cluster);
                      return (
                        <div key={cluster.name} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                          <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-primary">{cluster.name}</h4>
                              {getStatusBadge(status.status)}
                            </div>
                            
                            <div className="space-y-1 text-sm text-base-content/70">
                              <div className="flex justify-between">
                                <span>Servers:</span>
                                <span>{status.runningServers}/{status.totalServers} running</span>
                              </div>
                              {cluster.config?.description && (
                                <div className="text-xs italic">{cluster.config.description}</div>
                              )}
                            </div>
                            
                            <div className="card-actions justify-end mt-3">
                              <button className="btn btn-xs btn-outline btn-primary">
                                Manage
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-primary">Cluster Creation Wizard</h2>
                <p className="text-base-content/70 mt-2">
                  Step {['welcome', 'cluster-basic', 'map-selection', 'server-config', 'game-settings', 'review'].indexOf(currentStep) + 1} of 6
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              {/* Progress Bar */}
              <div className="w-full bg-base-300 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((['welcome', 'cluster-basic', 'map-selection', 'server-config', 'game-settings', 'review'].indexOf(currentStep) + 1) / 6) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="min-h-[400px]">
              {currentStep === 'welcome' && <WelcomeStep />}
              {currentStep === 'cluster-basic' && <ClusterBasicStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} generateServers={generateServers} />}
              {currentStep === 'map-selection' && <MapSelectionStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} toggleMap={toggleMap} updateMapCount={updateMapCount} generateServers={generateServers} />}
              {currentStep === 'server-config' && <ServerConfigStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} generateServers={generateServers} setCurrentStep={setCurrentStep} />}
              {currentStep === 'game-settings' && <GameSettingsStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} generateServers={generateServers} />}
              {currentStep === 'review' && <ReviewStep wizardData={wizardData} setWizardData={setWizardData} availableMaps={availableMaps} generateServers={generateServers} />}
              {currentStep === 'creating' && <CreatingStep jobId={currentJobId} jobProgress={jobProgress} />}
            </div>

            <div className="flex justify-between mt-6 pt-6 border-t border-base-300">
              <button 
                className="btn btn-outline" 
                onClick={prevStep} 
                disabled={currentStep === 'welcome'}
              >
                ← Previous
              </button>
              <button 
                className="btn btn-primary" 
                onClick={nextStep}
                disabled={currentStep === 'creating'}
              >
                {currentStep === 'review' ? '🚀 Create Cluster' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Config Manager Modal */}
      {showGlobalConfigManager && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Global Configuration</h2>
              <button
                onClick={() => setShowGlobalConfigManager(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            <GlobalConfigManager clusterName="global" />
          </div>
        </div>
      )}

      {/* Global Mod Manager Modal */}
      {showGlobalModManager && (
        <GlobalModManager onClose={() => setShowGlobalModManager(false)} />
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 alert alert-${statusType} shadow-lg z-50 max-w-md`}>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ServerProvisioner;