import {
  getStatusStyle,
  getStatusIcon as getStatusIconFromStyles,
} from './statusStyles';

export interface Server {
  name: string;
  status: string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  image?: string;
  ports?: any[];
  created?: string;
  serverCount?: number;
  maps?: string;
  config?: any;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  players?: number;
  isClusterServer?: boolean;
  autoUpdateStatus?: {
    status: string;
    updateAvailable: boolean;
    currentVersion?: string;
    latestVersion?: string;
    lastCheck?: string;
    message?: string;
  };
}

/**
 * Get status text color class
 * @deprecated Use getStatusStyle from statusStyles.ts instead
 */
export const getStatusColor = (status: string) => {
  return getStatusStyle(status).textClass;
};

/**
 * Get status icon emoji
 * @deprecated Use getStatusIcon from statusStyles.ts instead
 */
export const getStatusIcon = (status: string) => {
  return getStatusIconFromStyles(status);
};

export const getTypeColor = (type: string | undefined) => {
  if (!type) return 'badge-outline';
  
  switch (type) {
    case 'container': return 'badge-primary';
    case 'native': return 'badge-secondary';
    case 'cluster': return 'badge-accent';
    default: return 'badge-outline';
  }
};

export const getTypeLabel = (type: string | undefined) => {
  if (!type) return 'Unknown';
  
  switch (type) {
    case 'container': return 'Container';
    case 'native': return 'Native';
    case 'cluster': return 'Cluster';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export const getMapDisplayName = (mapCode: string): string => {
  const mapNames: Record<string, string> = {
    'TheIsland': 'The Island',
    'TheIsland_WP': 'The Island',
    'ScorchedEarth': 'Scorched Earth',
    'Aberration': 'Aberration',
    'Extinction': 'Extinction',
    'Genesis': 'Genesis',
    'Genesis2': 'Genesis Part 2',
    'CrystalIsles': 'Crystal Isles',
    'Valguero': 'Valguero',
    'LostIsland': 'Lost Island',
    'Fjordur': 'Fjordur',
    'BobsMissions_WP': 'Club ARK'
  };
  
  return mapNames[mapCode] || mapCode;
};

export const getServerType = (server: Server): string => {
  // Debug logging
  console.log(`getServerType called for ${server.name}:`, {
    serverType: server.type,
    clusterName: server.clusterName,
    serverCount: server.serverCount
  });
  
  // Respect the type that's already set by the backend
  if (server.type) {
    console.log(`Returning server.type: ${server.type}`);
    return server.type;
  }
  
  // Fallback logic only if type is not set
  if (server.clusterName) {
    console.log(`Returning cluster-server based on clusterName`);
    return 'cluster-server';
  }
  if (server.serverCount && server.serverCount > 1) {
    console.log(`Returning cluster based on serverCount`);
    return 'cluster';
  }
  console.log(`Returning native as fallback`);
  return 'native';
};

export const renderPort = (portObj: any) => {
  if (typeof portObj === 'string') return portObj;
  if (portObj.IP && portObj.PublicPort && portObj.PrivatePort) {
    return `${portObj.PublicPort}:${portObj.PrivatePort}`;
  }
  return JSON.stringify(portObj);
}; 