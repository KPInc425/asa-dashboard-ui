import React from 'react';
import type { CommandHistory } from './types';

interface ConsoleViewProps {
  history: CommandHistory[];
  consoleRef: React.RefObject<HTMLDivElement | null>;
}

const ConsoleView: React.FC<ConsoleViewProps> = ({ history, consoleRef }) => {
  return (
    <div
      ref={consoleRef}
      className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 bg-black/90 text-green-400"
      style={{ minHeight: '300px' }}
    >
      {history.length === 0 ? (
        <div className="text-center py-12 text-green-400/60">
          <div className="text-4xl mb-4">💻</div>
          <p className="text-lg">Console Ready</p>
          <p className="text-sm">Type a command below to get started</p>
          <div className="mt-4 text-xs text-green-400/40">
            <p>• Use ↑↓ arrow keys to navigate command history</p>
            <p>• Press Tab to use command suggestions</p>
            <p>• Type to see auto-complete suggestions</p>
          </div>
        </div>
      ) : (
        <div className="bg-base-200 rounded-lg p-2 mb-2 max-h-80 overflow-y-auto">
          {history.map((entry, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center space-x-2 bg-blue-900/30 p-2 rounded border-l-4 border-blue-500">
                <span className="text-blue-400 font-bold">$</span>
                <span className="text-yellow-400 font-medium">{entry.command}</span>
                <span className="text-blue-400/50 text-xs">[{entry.timestamp.toLocaleTimeString()}]</span>
              </div>
              <div className={`ml-4 p-2 rounded border-l-4 ${
                entry.success
                  ? 'bg-green-900/30 border-green-500 text-green-400'
                  : 'bg-red-900/30 border-red-500 text-red-400'
              }`}>
                {entry.response.split('\n').map((line, lineIndex) => (
                  <div key={lineIndex} className="text-sm">{line || '\u00A0'}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsoleView;
