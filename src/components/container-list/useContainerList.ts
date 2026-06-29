import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { containerApi, environmentApi, type Container } from '../../services';
import { API_SUITE_NAMES } from './constants';
import { getHiddenContainers, setHiddenContainers } from './utils';

export function useContainerList() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [systemContainers, setSystemContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [hidden, setHidden] = useState<string[]>(getHiddenContainers());

  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [serverConfigs, setServerConfigs] = useState<any[]>([]);

  const [showModManager, setShowModManager] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchContainers();
    fetchServerConfigs();
    // eslint-disable-next-line
  }, []);

  const fetchServerConfigs = async () => {
    try {
      const data = await environmentApi.getArkServerConfigs();
      setServerConfigs(data.servers);
    } catch (err) {
      console.error('Failed to load server configs:', err);
    }
  };

  const fetchContainers = async () => {
    try {
      const data = await containerApi.getNativeServers();
      const hiddenByLabel = data.filter(c => c.labels && c.labels['ark.dashboard.exclude'] === 'true').map(c => c.name);
      const allHidden = Array.from(new Set([...hidden, ...hiddenByLabel]));
      setHidden(allHidden);
      setHiddenContainers(allHidden);
      setSystemContainers(data.filter(c => API_SUITE_NAMES.includes(c.name)));
      setContainers(
        data.filter(c =>
          !API_SUITE_NAMES.includes(c.name) &&
          (showHidden ? true : !allHidden.includes(c.name))
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHide = (name: string) => {
    const newHidden = Array.from(new Set([...hidden, name]));
    setHidden(newHidden);
    setHiddenContainers(newHidden);
    setContainers(containers.filter(c => c.name !== name));
  };

  const handleUnhide = (name: string) => {
    const newHidden = hidden.filter(n => n !== name);
    setHidden(newHidden);
    setHiddenContainers(newHidden);
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart', containerName: string) => {
    setActionLoading(containerName);
    try {
      const server = containers.find(c => c.name === containerName);
      const isNativeServer = server?.type === 'cluster-server';

      switch (action) {
        case 'start':
          if (isNativeServer) {
            await containerApi.startNativeServer(containerName);
          } else {
            await containerApi.startContainer(containerName);
          }
          break;
        case 'stop':
          try {
            const srv = containers.find(c => c.name === containerName);
            const isNs = srv?.type === 'cluster-server';
            if (srv?.status === 'running') {
              if (isNs) {
                await containerApi.sendNativeRconCommand(containerName, 'saveworld');
              } else {
                await containerApi.sendRconCommand(containerName, 'saveworld');
              }
            }
          } catch (e) {
            console.warn('Failed to save world before stopping:', e);
          }
          if (isNativeServer) {
            await containerApi.stopNativeServer(containerName);
          } else {
            await containerApi.stopContainer(containerName);
          }
          break;
        case 'restart':
          if (isNativeServer) {
            await containerApi.restartNativeServer(containerName);
          } else {
            await containerApi.restartContainer(containerName);
          }
          break;
      }
      await fetchContainers();
    } catch (err) {
      console.error(`Failed to ${action} server:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const getServerConfig = (containerName: string) => {
    return serverConfigs.find(config => config.name === containerName);
  };

  return {
    containers,
    systemContainers,
    isLoading,
    error,
    actionLoading,
    showHidden,
    hidden,
    isAddingServer,
    isEditingServer,
    selectedServer,
    serverConfigs,
    showModManager,
    navigate,
    setShowHidden,
    setIsAddingServer,
    setIsEditingServer,
    setSelectedServer,
    setShowModManager,
    fetchContainers,
    fetchServerConfigs,
    handleHide,
    handleUnhide,
    handleAction,
    getServerConfig,
  };
}
