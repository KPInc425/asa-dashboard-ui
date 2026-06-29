import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useParams } from 'react-router-dom';
import { socketService, type LogMessage } from '../../services';
import { logsApi } from '../../services/api-logs';
import type { LogFile } from '../../services/api-core';

export function useServerLogViewer(propServerName?: string) {
  const params = useParams<{ serverName: string }>();
  const serverName = propServerName || params.serverName;
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [availableLogFiles, setAvailableLogFiles] = useState<LogFile[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [lineCount, setLineCount] = useState<number>(500);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverName) {
      loadAvailableLogFiles();
      connectToServerLogs();
    }
    (window as { debugLogFiles?: () => void }).debugLogFiles = debugLogFiles;
    return () => {
      socketService.offServerLog();
      socketService.disconnect().catch(console.error);
      delete (window as { debugLogFiles?: () => void }).debugLogFiles;
    };
  }, [serverName]);

  useEffect(() => {
    if (selectedLogFile && serverName) {
      setLogs([]);
      loadStaticLogs();
      if (isConnected) {
        if (selectedLogFile === 'server') socketService.switchToServerLogs(serverName);
        else socketService.switchLogFile(selectedLogFile);
      }
    }
  }, [selectedLogFile, serverName, lineCount]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadAvailableLogFiles = async () => {
    if (!serverName) return;
    setIsLoadingFiles(true);
    try {
      const response = await logsApi.getLogFiles(serverName);
      setAvailableLogFiles(response.logFiles);
      if (!selectedLogFile && response.logFiles.length > 0) {
        const shooterGameLog = response.logFiles.find(file => file.name.toLowerCase() === 'shootergame.log');
        if (shooterGameLog) {
          setSelectedLogFile(shooterGameLog.name);
        } else {
          const mostRecentLog = response.logFiles.find(file =>
            file.name.toLowerCase().includes('shootergame') ||
            file.name.toLowerCase().includes('servergame') ||
            file.name.toLowerCase().includes('windowsserver.log') ||
            (file.name.toLowerCase().endsWith('.log') && !file.name.toLowerCase().includes('manifest'))
          );
          if (mostRecentLog) setSelectedLogFile(mostRecentLog.name);
          else setSelectedLogFile('server');
        }
      }
    } catch (err) {
      console.error('Failed to load log files:', err);
      setError('Failed to load available log files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const connectToServerLogs = async () => {
    if (!serverName) return;
    setIsLoading(true);
    setError('');
    try {
      await loadStaticLogs();
      try {
        await socketService.connect(serverName, selectedLogFile);
        setIsConnected(true);
        socketService.onServerLog((logMessage: LogMessage) => {
          setLogs(prev => [...prev, logMessage]);
        });
        socketService.onConnect(() => { setIsConnected(true); setError(''); });
        socketService.onDisconnect((reason: string) => { setIsConnected(false); });
        socketService.onError((error: Error) => { setIsConnected(false); });
      } catch (socketErr) {
        console.warn('Socket.IO connection failed, using static logs only:', socketErr);
        setIsConnected(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service logs');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaticLogs = async (forceRefresh = false) => {
    if (!serverName) return;
    if (forceRefresh) setLogs([]);
    const logFileName = selectedLogFile === 'server' ? 'ShooterGame.log' : selectedLogFile;
    if (!logFileName) {
      const filesResponse = await logsApi.getLogFiles(serverName);
      if (filesResponse?.logFiles) setAvailableLogFiles(filesResponse.logFiles);
      if (filesResponse.success && filesResponse.logFiles.length > 0) {
        const logFile = filesResponse.logFiles.find(file =>
          file.name.toLowerCase().includes('shootergame.log') ||
          file.name.toLowerCase().includes('servergame') ||
          file.name.toLowerCase().includes('windowsserver.log') ||
          (file.name.toLowerCase().endsWith('.log') && !file.name.toLowerCase().includes('manifest'))
        ) || filesResponse.logFiles[0];
        const response = await logsApi.getLogContent(serverName, logFile.name, lineCount, forceRefresh);
        if (response.success && response.content) {
          const logLines = response.content.split('\n').filter(line => line.trim());
          const staticLogs: LogMessage[] = logLines.map((line, index) => {
            try {
              const logEntry = JSON.parse(line);
              return { timestamp: new Date(logEntry.time || Date.now() - (logLines.length - index) * 1000).toISOString(), level: logEntry.level?.toString() || 'info', message: logEntry.msg || line, container: serverName || 'unknown' };
            } catch {
              return { timestamp: new Date(Date.now() - (logLines.length - index) * 1000).toISOString(), level: 'info', message: line, container: serverName || 'unknown' };
            }
          });
          setLogs(staticLogs);
          return;
        }
      }
      setError('No log content available');
      return;
    }
    const response = await logsApi.getLogContent(serverName, logFileName, lineCount, forceRefresh);
    if (response.success && response.content) {
      const logLines = response.content.split('\n').filter(line => line.trim());
      const staticLogs: LogMessage[] = logLines.map((line, index) => {
        try {
          const logEntry = JSON.parse(line);
          return { timestamp: new Date(logEntry.time || Date.now() - (logLines.length - index) * 1000).toISOString(), level: logEntry.level?.toString() || 'info', message: logEntry.msg || line, container: serverName || 'unknown' };
        } catch {
          return { timestamp: new Date(Date.now() - (logLines.length - index) * 1000).toISOString(), level: 'info', message: line, container: serverName || 'unknown' };
        }
      });
      setLogs(staticLogs);
      return;
    }
    setError('No log content available');
  };

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const debugLogFiles = async () => {
    if (!serverName) return;
    try {
      try {
        const response = await logsApi.debugLogFiles(serverName);
        if (response.success) {
          const debugText = `Debug Info for ${serverName}:\n\n${response.logFiles.map((file: any) => `${file.name}:\n  Path: ${file.path}\n  Size: ${file.size} bytes`).join('\n\n')}`;
          try { await navigator.clipboard.writeText(debugText); showToast('Debug info copied to clipboard', 'success'); }
          catch { console.log(debugText); showToast('Debug info logged to console', 'info'); }
          return;
        }
      } catch (debugError) { console.log('Debug endpoint failed, trying fallback:', debugError); }
      const fallbackResponse = await logsApi.getLogFiles(serverName);
      if (fallbackResponse.success) {
        const debugText = `Fallback Debug Info for ${serverName}:\n\n${fallbackResponse.logFiles.map((file: any) => `${file.name}:\n  Path: ${file.path}\n  Size: ${file.size} bytes`).join('\n\n')}`;
        try { await navigator.clipboard.writeText(debugText); showToast('Debug info copied to clipboard (fallback)', 'success'); }
        catch { console.log(debugText); showToast('Fallback debug info logged to console', 'info'); }
      } else showToast('Failed to get debug info from both endpoints', 'error');
    } catch (error) {
      showToast('Error getting debug info: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesFilter && matchesLevel;
  });

  return {
    serverName, logs, isConnected, isLoading, error, autoScroll, filter, logLevel,
    availableLogFiles, selectedLogFile, isLoadingFiles, lineCount, logsEndRef,
    setFilter, setLogLevel, setSelectedLogFile, setLineCount, setAutoScroll,
    connectToServerLogs, loadStaticLogs, loadAvailableLogFiles, clearLogs, exportLogs, debugLogFiles,
    filteredLogs, setError,
  };
}
