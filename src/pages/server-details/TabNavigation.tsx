import React from "react";

interface TabNavigationProps {
  activeTab: string;
  supportsCapability: (cap: string) => boolean;
  onTabChange: (tab: "details" | "rcon" | "config" | "logs" | "mods" | "saves") => void;
}

const TABS = [
  { key: "details" as const, label: "📊 Details", capability: null },
  { key: "rcon" as const, label: "🖥️ RCON Console", capability: "canRcon" },
  { key: "mods" as const, label: "🎮 Mods", capability: "canUpdateMods" },
  { key: "config" as const, label: "⚙️ Configuration", capability: "canEditConfig" },
  { key: "logs" as const, label: "📋 Logs", capability: null },
  { key: "saves" as const, label: "💾 Save Files", capability: "canBackup" },
];

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  supportsCapability,
  onTabChange,
}) => {
  return (
    <div className="tabs tabs-boxed bg-base-200">
      {TABS.map((tab) => {
        if (tab.capability && !supportsCapability(tab.capability)) {
          return null;
        }
        return (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "tab-active" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
