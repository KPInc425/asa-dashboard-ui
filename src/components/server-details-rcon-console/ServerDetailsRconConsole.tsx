import React, { useState, useEffect, useRef } from 'react';
import { containerApi, type RconResponse } from '../../services';
import yaml from 'js-yaml';
import socketService from '../../services/socket';
import type { CommandHistory, RconCommand, RconCommandsData, ChatMessage } from './types';
import ConsoleView from './ConsoleView';
import ChatView from './ChatView';
import CommandInput from './CommandInput';

interface ServerDetailsRconConsoleProps {
  serverName: string;
}

const ServerDetailsRconConsole: React.FC<ServerDetailsRconConsoleProps> = ({ serverName }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filteredCommands, setFilteredCommands] = useState<RconCommand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [rconCommands, setRconCommands] = useState<RconCommand[]>([]);
  const [activeView, setActiveView] = useState<'console' | 'chat'>('console');
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Reset state when server changes
  useEffect(() => {
    console.log('[RCON] Switching to server:', serverName, 'clearing state');
    setHistory([]);
    setChatMessages([]);
    setCommand('');
    setError('');
    setHistoryIndex(-1);
    setFilteredCommands([]);
    setShowSuggestions(false);
    setSelectedSuggestion(0);
    setIsLoading(false);
  }, [serverName]);

  // Load RCON commands from YAML file
  useEffect(() => {
    const loadRconCommands = async () => {
      try {
        const response = await fetch('/rconCommands.yml');
        if (response.ok) {
          const yamlText = await response.text();
          const data = yaml.load(yamlText) as RconCommandsData;
          setRconCommands(data.rcon_commands || []);
        } else {
          console.warn('Could not load RCON commands YAML file');
          setRconCommands([
            { name: 'listplayers', syntax: 'listplayers', description: 'List all online players', category: 'Server & Player Management' },
            { name: 'saveworld', syntax: 'saveworld', description: 'Force a world save', category: 'Server & Player Management' },
            { name: 'broadcast', syntax: 'broadcast <message>', description: 'Send a message to all players', category: 'Chat & Messaging' },
            { name: 'GetChat', syntax: 'GetChat', description: 'Retrieve the latest chat buffer', category: 'Chat & Messaging' },
            { name: 'ServerChat', syntax: 'ServerChat <message>', description: 'Send a global chat message', category: 'Chat & Messaging' },
          ]);
        }
      } catch (error) {
        console.error('Error loading RCON commands:', error);
        setRconCommands([]);
      }
    };
    loadRconCommands();
  }, []);

  // Listen for chat:update events from Socket.IO for this server
  useEffect(() => {
    if (activeView !== 'chat') return;
    console.log('[ChatView] useEffect: subscribing to chat:update for', serverName);
    console.log('[ChatView] Socket connected:', socketService.isConnected());

    socketService.emit('subscribe-to-chat', serverName);

    const handleChatUpdate = (data: { serverName: string; messages: any[] }) => {
      console.log('[ChatView] Received chat:update event for', data.serverName, data);
      if (data.serverName === serverName) {
        setChatMessages(prev => {
          const canonical = data.messages.map(m => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            optimistic: false
          }));
          const optimistic = prev.filter(
            m => m.optimistic && !canonical.some(c => c.message === m.message && c.sender !== 'You')
          );
          return [...canonical, ...optimistic];
        });
      }
    };
    socketService.onCustomEvent('chat:update', handleChatUpdate);
    return () => {
      console.log('[ChatView] Unsubscribing from chat:update for', serverName);
      socketService.offCustomEvent('chat:update', handleChatUpdate);
      socketService.emit('unsubscribe-from-chat', serverName);
    };
  }, [activeView, serverName]);

  useEffect(() => {
    console.log('[ChatView] Mounted for server', serverName);
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`rcon_history_${serverName}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })));
      } catch (error) {
        console.error('Error loading command history:', error);
      }
    }
  }, [serverName]);

  // Save command history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(`rcon_history_${serverName}`, JSON.stringify(history.slice(-100)));
    }
  }, [history, serverName]);

  // Enhanced auto-scroll functionality
  useEffect(() => {
    const scrollToBottom = (element: HTMLElement) => {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    };
    if (consoleRef.current && activeView === 'console') {
      scrollToBottom(consoleRef.current);
    }
    if (chatRef.current && activeView === 'chat') {
      scrollToBottom(chatRef.current);
    }
  }, [history, chatMessages, activeView]);

  useEffect(() => {
    const scrollToBottom = (element: HTMLElement) => {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    };
    if (activeView === 'console' && consoleRef.current && history.length > 0) {
      scrollToBottom(consoleRef.current);
    }
    if (activeView === 'chat' && chatRef.current && chatMessages.length > 0) {
      scrollToBottom(chatRef.current);
    }
  }, [history.length, chatMessages.length, activeView]);

  const executeCommand = async (cmd: string): Promise<RconResponse> => {
    let response: RconResponse;
    try {
      response = await containerApi.sendNativeRconCommand(serverName, cmd);
    } catch (nativeError) {
      try {
        response = await containerApi.sendRconCommand(serverName, cmd);
      } catch (containerError) {
        throw new Error(`RCON connection failed. Server may not be running or RCON may not be configured.`);
      }
    }
    return response;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !serverName) return;

    setIsLoading(true);
    setError('');

    try {
      await executeCommand(`ServerChat ${command}`);
      const now = new Date();
      setChatMessages(prev => [
        ...prev,
        { timestamp: now, sender: 'You', message: command.trim(), optimistic: true }
      ]);
      setCommand('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send chat message';
      setError(errorMessage);
      setCommand('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !serverName) return;

    setIsLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const response = await executeCommand(command);
      const newEntry: CommandHistory = {
        command: command,
        response: response.response || response.message,
        timestamp: new Date(),
        success: response.success
      };
      setHistory(prev => [...prev, newEntry]);
      setCommand('');
      setHistoryIndex(-1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send command';
      setError(errorMessage);
      const newEntry: CommandHistory = {
        command: command,
        response: errorMessage,
        timestamp: new Date(),
        success: false
      };
      setHistory(prev => [...prev, newEntry]);
      setCommand('');
      setHistoryIndex(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredCommands.length > 0) {
        setSelectedSuggestion(prev => Math.max(0, prev - 1));
      } else if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredCommands.length > 0) {
        setSelectedSuggestion(prev => Math.min(filteredCommands.length - 1, prev + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Tab' || (e.key === 'Enter' && showSuggestions)) {
      if (showSuggestions && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCmd = filteredCommands[selectedSuggestion];
        setCommand(selectedCmd.syntax);
        setShowSuggestions(false);
        setSelectedSuggestion(0);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const spaceIndex = selectedCmd.syntax.indexOf(' ');
            if (spaceIndex !== -1) {
              inputRef.current.setSelectionRange(spaceIndex + 1, selectedCmd.syntax.length);
            }
          }
        }, 0);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(0);
    }
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setHistoryIndex(-1);
    if (value.trim()) {
      const filtered = rconCommands.filter(cmd =>
        cmd.name.toLowerCase().includes(value.toLowerCase()) ||
        cmd.description.toLowerCase().includes(value.toLowerCase()) ||
        cmd.syntax.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredCommands(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(0);
    } else {
      setFilteredCommands([]);
      setShowSuggestions(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`rcon_history_${serverName}`);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeView === 'console' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('console')}
          >
            🖥️ Console
          </button>
          <button
            className={`tab ${activeView === 'chat' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('chat')}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* Console/Chat Output */}
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl flex-1 flex flex-col" style={{ minHeight: '400px' }}>
        <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-300/50">
          <div className="flex items-center space-x-3">
            <h4 className="text-lg font-semibold text-primary">
              {activeView === 'console' ? '🖥️ Console Window' : '💬 Chat Messages'}
            </h4>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-base-content/70">
              {activeView === 'console' ? `${history.length} commands` : `${chatMessages.length} messages`}
            </span>
            <button
              onClick={activeView === 'console' ? clearHistory : clearChat}
              className="btn btn-sm btn-outline btn-error"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {activeView === 'console' ? (
          <ConsoleView history={history} consoleRef={consoleRef} />
        ) : (
          <ChatView chatMessages={chatMessages} chatRef={chatRef} />
        )}
      </div>

      {/* Command Input */}
      <CommandInput
        command={command}
        isLoading={isLoading}
        error={error}
        showSuggestions={showSuggestions}
        filteredCommands={filteredCommands}
        selectedSuggestion={selectedSuggestion}
        inputRef={inputRef}
        onCommandChange={handleCommandChange}
        onKeyDown={handleKeyDown}
        onSubmit={activeView === 'console' ? handleCommandSubmit : handleChatSubmit}
        onSuggestionClick={(suggestion) => {
          setCommand(suggestion.syntax);
          setShowSuggestions(false);
          inputRef.current?.focus();
        }}
        onQuickCommand={(cmd) => setCommand(cmd)}
      />
    </div>
  );
};

export default ServerDetailsRconConsole;
