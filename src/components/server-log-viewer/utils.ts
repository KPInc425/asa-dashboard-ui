export const getLogLevelColor = (level: string) => {
  const numericLevel = parseInt(level);
  if (!isNaN(numericLevel)) {
    if (numericLevel >= 40) return 'text-error';
    if (numericLevel >= 30) return 'text-warning';
    if (numericLevel >= 20) return 'text-info';
    return 'text-base-content/50';
  }
  switch (level.toLowerCase()) {
    case 'error': return 'text-error';
    case 'warn': case 'warning': return 'text-warning';
    case 'info': return 'text-info';
    case 'debug': return 'text-base-content/50';
    default: return 'text-base-content';
  }
};

export const getLogLevelIcon = (level: string) => {
  const numericLevel = parseInt(level);
  if (!isNaN(numericLevel)) {
    if (numericLevel >= 40) return '🔴';
    if (numericLevel >= 30) return '🟡';
    if (numericLevel >= 20) return '🔵';
    return '⚪';
  }
  switch (level.toLowerCase()) {
    case 'error': return '🔴';
    case 'warn': case 'warning': return '🟡';
    case 'info': return '🔵';
    case 'debug': return '⚪';
    default: return '⚪';
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
