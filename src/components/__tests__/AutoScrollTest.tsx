import React, { useRef, useEffect, useState } from 'react';

/**
 * Test component to verify auto-scroll functionality
 * This can be used to test the scroll behavior in isolation
 */
const AutoScrollTest: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enhanced auto-scroll functionality (same as implemented in RCON console)
  useEffect(() => {
    const scrollToBottom = (element: HTMLElement) => {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    };

    if (scrollRef.current) {
      scrollToBottom(scrollRef.current);
    }
  }, [messages]);

  const addMessage = () => {
    const newMessage = `Test message ${messages.length + 1} - ${new Date().toLocaleTimeString()}`;
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Auto-Scroll Test</h2>
      
      <div className="flex gap-2">
        <button 
          onClick={addMessage}
          className="btn btn-primary"
        >
          Add Message
        </button>
        <button 
          onClick={clearMessages}
          className="btn btn-secondary"
        >
          Clear Messages
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="bg-base-200 border rounded-lg p-4 h-64 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="text-center text-base-content/50">
            No messages yet. Click "Add Message" to test auto-scroll.
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="mb-2 p-2 bg-base-100 rounded">
              {message}
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-base-content/70">
        <p>• Messages should automatically scroll to bottom when added</p>
        <p>• Scroll should be smooth using requestAnimationFrame</p>
        <p>• Test by adding multiple messages quickly</p>
      </div>
    </div>
  );
};

export default AutoScrollTest;
