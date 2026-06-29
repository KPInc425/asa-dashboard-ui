import React from 'react';
import type { ChatMessage } from './types';

interface ChatViewProps {
  chatMessages: ChatMessage[];
  chatRef: React.RefObject<HTMLDivElement | null>;
}

const ChatView: React.FC<ChatViewProps> = ({ chatMessages, chatRef }) => {
  return (
    <div
      ref={chatRef}
      className="flex-1 p-4 overflow-y-auto space-y-2 bg-base-100"
      style={{ minHeight: '300px' }}
    >
      {chatMessages.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg">No chat messages</p>
          <p className="text-sm">Chat will update automatically</p>
        </div>
      ) : (
        <div className="bg-base-200 rounded-lg p-2 mb-2 max-h-80 overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-2 rounded hover:bg-base-200">
              <span className="text-xs text-base-content/50 min-w-[60px]">
                {msg.timestamp.toLocaleTimeString()}
              </span>
              <span className="font-semibold text-primary min-w-[100px]">
                {msg.sender}:
              </span>
              <span className="text-base-content flex-1">{msg.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatView;
