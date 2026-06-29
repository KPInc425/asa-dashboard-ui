import { HIDDEN_KEY, MAP_DISPLAY_NAMES } from './constants';
import type { Port } from './types';

export const getHiddenContainers = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
  } catch {
    return [];
  }
};

export const setHiddenContainers = (arr: string[]) => {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'badge-success';
    case 'stopped': return 'badge-error';
    case 'restarting': return 'badge-warning';
    default: return 'badge-neutral';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return '🟢';
    case 'stopped': return '🔴';
    case 'restarting': return '🟡';
    default: return '⚪';
  }
};

export const renderPort = (portObj: Port | string) => {
  if (!portObj) return '-';
  if (typeof portObj === 'string') return portObj;
  const { IP, PrivatePort, PublicPort, Type } = portObj;
  if (PublicPort) {
    return `${IP ? IP + ':' : ''}${PublicPort} → ${PrivatePort}/${Type}`;
  }
  return `${PrivatePort}/${Type}`;
};

export const isAsaServer = (containerName: string) => {
  return containerName.startsWith('asa-server-');
};

export const getMapDisplayName = (mapCode: string) => {
  return MAP_DISPLAY_NAMES[mapCode] || mapCode;
};
