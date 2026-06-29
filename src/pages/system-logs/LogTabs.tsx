import React from "react";
import { LogTab } from "./types";

interface LogTabsProps {
  tabs: LogTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const LogTabs: React.FC<LogTabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="tabs tabs-boxed bg-base-200 p-2 m-4">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        className={`tab ${activeTab === tab.key ? "tab-active" : ""}`}
        onClick={() => onTabChange(tab.key)}
      >
        <span className="mr-2">{tab.icon}</span>
        {tab.label}
      </button>
    ))}
  </div>
);

export default LogTabs;
