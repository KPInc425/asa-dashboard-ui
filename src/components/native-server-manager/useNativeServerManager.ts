import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { containerApi } from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext2';
import { useToast } from '../../contexts/ToastContext';
import type { NativeServer, NativeServerConfig } from './types';

const DEFAULT_FORM: Partial<NativeServerConfig> = {
  serverPath: 'C:\\ARK\\servers',
  mapName: 'TheIsland',
  gamePort: 7777,
  queryPort: 27015,
  rconPort: 32330,
  serverName: 'ASA Server',
  maxPlayers: 70,
  serverPassword: '',
  adminPassword: 'admin123',
  mods: [],
  additionalArgs: '',
  disableBattleEye: false
};

export function useNativeServerManager() {
  const [servers, setServers] = useState<NativeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<NativeServer | null>(null);
  const [showStartBatModal, setShowStartBatModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<NativeServer | null>(null);
  const [startBatContent, setStartBatContent] = useState('');
  const [formData, setFormData] = useState<Partial<NativeServerConfig>>({ ...DEFAULT_FORM });
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/native-servers');
      if (response.data.success) {
        setServers(response.data.servers);
      }
    } catch (error) {
      console.error('Failed to load native servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serverPath) {
      showToast('Server path is required', 'error');
      return;
    }
    try {
      const serverName = editingServer?.name || `native-server-${Date.now()}`;
      const response = await api.post('/api/native-servers', { name: serverName, config: formData });
      if (response.data.success) {
        setShowAddModal(false);
        setEditingServer(null);
        setFormData({ ...DEFAULT_FORM });
        loadServers();
      }
    } catch (error) {
      console.error('Failed to save server configuration:', error);
      showToast('Failed to save server configuration', 'error');
    }
  };

  const handleStart = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/start`);
      if (response.data.success) loadServers();
    } catch (error) {
      console.error('Failed to start server:', error);
      showToast('Failed to start server', 'error');
    }
  };

  const handleStop = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/stop`);
      if (response.data.success) loadServers();
    } catch (error) {
      console.error('Failed to stop server:', error);
      showToast('Failed to stop server', 'error');
    }
  };

  const handleRestart = async (serverName: string) => {
    try {
      const response = await api.post(`/api/native-servers/${serverName}/restart`);
      if (response.data.success) loadServers();
    } catch (error) {
      console.error('Failed to restart server:', error);
      showToast('Failed to restart server', 'error');
    }
  };

  const handleDelete = async (serverName: string) => {
    const proceed = await showConfirm(`Are you sure you want to delete server "${serverName}"?`);
    if (!proceed) return;
    try {
      const response = await api.delete(`/api/native-servers/${serverName}`);
      if (response.data.success) loadServers();
    } catch (error) {
      console.error('Failed to delete server:', error);
      showToast('Failed to delete server', 'error');
    }
  };

  const handleEdit = (server: NativeServer) => {
    if (server.type === 'cluster') {
      showToast('Clusters cannot be edited through this interface. Use the Server Provisioner to manage clusters.', 'warning');
      return;
    }
    if (server.type === 'cluster-server') {
      showToast('Cluster servers cannot be edited through this interface. Use the Server Provisioner to manage cluster servers.', 'warning');
      return;
    }
    if (!server.config) {
      showToast('Server configuration not available for editing.', 'warning');
      return;
    }
    setEditingServer(server);
    setFormData(server.config);
    setShowAddModal(true);
  };

  const handleViewStartBat = async (server: NativeServer) => {
    if (server.type !== 'cluster-server') {
      showToast('Start.bat files are only available for cluster servers.', 'info');
      return;
    }
    try {
      const response = await api.get(`/api/native-servers/${server.name}/start-bat`);
      if (response.data.success) {
        setStartBatContent(response.data.content);
        setSelectedServer(server);
        setShowStartBatModal(true);
      }
    } catch (error) {
      console.error('Failed to get start.bat:', error);
      showToast('Failed to get start.bat file', 'error');
    }
  };

  const handleUpdateStartBat = async () => {
    if (!selectedServer) return;
    try {
      const response = await api.put(`/api/native-servers/${selectedServer.name}/start-bat`, { content: startBatContent });
      if (response.data.success) {
        showToast('Start.bat updated successfully!', 'success');
        setShowStartBatModal(false);
      }
    } catch (error) {
      console.error('Failed to update start.bat:', error);
      showToast('Failed to update start.bat file', 'error');
    }
  };

  const handleRegenerateStartBat = async (serverName: string) => {
    try {
      const response = await containerApi.regenerateNativeServerStartBat(serverName);
      if (response.success) {
        showToast(response.message, 'success');
        loadServers();
      } else {
        showToast('Failed to regenerate start.bat: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('Failed to regenerate start.bat:', error);
      showToast('Failed to regenerate start.bat file', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'restarting': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'text-success';
      case 'stopped': return 'text-error';
      case 'restarting': return 'text-warning';
      default: return 'text-base-content/50';
    }
  };

  return {
    servers, loading, showAddModal, editingServer, showStartBatModal, selectedServer, startBatContent, formData,
    setShowAddModal, setEditingServer, setShowStartBatModal, setSelectedServer, setStartBatContent, setFormData,
    loadServers, handleSubmit, handleStart, handleStop, handleRestart, handleDelete, handleEdit,
    handleViewStartBat, handleUpdateStartBat, handleRegenerateStartBat, getStatusIcon, getStatusColor,
    showToast,
  };
}
