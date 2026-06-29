import { useState } from 'react';
import type { ClusterForm, MapSelection, ServerConfig } from './types';
import { AVAILABLE_MAPS, DEFAULT_FORM_STATE } from './constants';

export function useClusterForm() {
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<ClusterForm>(() => ({
    ...DEFAULT_FORM_STATE,
    selectedMaps: AVAILABLE_MAPS.map(map => ({
      map,
      count: 1,
      enabled: false
    })),
  }));

  const updateForm = (updates: Partial<ClusterForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateGlobalSetting = (
    section: keyof typeof form.globalSettings,
    subsection: string,
    key: string,
    value: any
  ) => {
    setForm(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        [section]: {
          ...prev.globalSettings[section],
          [subsection]: {
            ...prev.globalSettings[section][subsection as keyof typeof prev.globalSettings[typeof section]],
            [key]: value
          }
        }
      }
    }));
  };

  const updateMapSelection = (mapName: string, updates: Partial<MapSelection>) => {
    setForm(prev => ({
      ...prev,
      selectedMaps: prev.selectedMaps.map(map =>
        map.map === mapName ? { ...map, ...updates } : map
      )
    }));
  };

  const addGlobalMod = (modId: string) => {
    if (!form.globalMods.includes(modId)) {
      setForm(prev => ({
        ...prev,
        globalMods: [...prev.globalMods, modId]
      }));
    }
  };

  const removeGlobalMod = (modId: string) => {
    setForm(prev => ({
      ...prev,
      globalMods: prev.globalMods.filter(id => id !== modId)
    }));
  };

  const addServerMod = (serverIndex: number, modId: string) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) =>
        i === serverIndex
          ? { ...server, mods: [...server.mods, modId] }
          : server
      )
    }));
  };

  const removeServerMod = (serverIndex: number, modId: string) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) =>
        i === serverIndex
          ? { ...server, mods: server.mods.filter((id: string) => id !== modId) }
          : server
      )
    }));
  };

  const generateServers = () => {
    const servers: ServerConfig[] = [];
    let portIndex = 0;

    form.selectedMaps.forEach(mapSelection => {
      if (mapSelection.enabled) {
        for (let i = 0; i < mapSelection.count; i++) {
          const serverName = `${form.name}-${mapSelection.map}${mapSelection.count > 1 ? `-${i + 1}` : ''}`;
          const serverPort = form.portConfiguration.basePort + (portIndex * form.portConfiguration.portIncrement);
          const queryPort = form.portConfiguration.queryPortBase + (portIndex * form.portConfiguration.queryPortIncrement);
          const rconPort = form.portConfiguration.rconPortBase + (portIndex * form.portConfiguration.rconPortIncrement);

          servers.push({
            name: serverName,
            map: mapSelection.map,
            gamePort: serverPort,
            queryPort: queryPort,
            rconPort: rconPort,
            maxPlayers: form.globalSettings.gameUserSettings.ServerSettings.MaxPlayers,
            password: form.globalSettings.gameUserSettings.SessionSettings.ServerPassword,
            adminPassword: form.globalSettings.gameUserSettings.SessionSettings.ServerAdminPassword,
            mods: [...form.globalMods]
          });

          portIndex++;
        }
      }
    });

    updateForm({ servers });
  };

  const updateServer = (index: number, updates: Partial<ServerConfig>) => {
    setForm(prev => ({
      ...prev,
      servers: prev.servers.map((server, i) =>
        i === index ? { ...server, ...updates } : server
      )
    }));
  };

  const getTotalServerCount = () => {
    return form.selectedMaps.reduce((total, map) =>
      total + (map.enabled ? map.count : 0), 0
    );
  };

  const handleSubmit = (e: React.FormEvent, onSubmit: (config: ClusterForm) => void) => {
    e.preventDefault();
    if (form.servers.length === 0) {
      generateServers();
    }
    onSubmit(form);
  };

  return {
    activeTab,
    setActiveTab,
    form,
    updateForm,
    updateGlobalSetting,
    updateMapSelection,
    addGlobalMod,
    removeGlobalMod,
    addServerMod,
    removeServerMod,
    generateServers,
    updateServer,
    getTotalServerCount,
    handleSubmit,
  };
}
