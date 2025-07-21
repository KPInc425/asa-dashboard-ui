import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DeveloperContextType {
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
  setDeveloperMode: (enabled: boolean) => void;
}

const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined);

interface DeveloperProviderProps {
  children: ReactNode;
}

export const DeveloperProvider: React.FC<DeveloperProviderProps> = ({ children }) => {
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  useEffect(() => {
    // Load developer mode from localStorage on startup
    const stored = localStorage.getItem('developer_mode');
    if (stored === 'true') {
      setIsDeveloperMode(true);
    }
  }, []);

  const setDeveloperMode = (enabled: boolean) => {
    setIsDeveloperMode(enabled);
    localStorage.setItem('developer_mode', enabled.toString());
  };

  const toggleDeveloperMode = () => {
    setDeveloperMode(!isDeveloperMode);
  };

  return (
    <DeveloperContext.Provider
      value={{
        isDeveloperMode,
        toggleDeveloperMode,
        setDeveloperMode,
      }}
    >
      {children}
    </DeveloperContext.Provider>
  );
};

export const useDeveloper = (): DeveloperContextType => {
  const context = useContext(DeveloperContext);
  if (!context) {
    throw new Error('useDeveloper must be used within a DeveloperProvider');
  }
  return context;
}; 