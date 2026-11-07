import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { useEnvironmentRouter } from "../utils/environmentRoutes";
import EnvironmentSwitcher from "./EnvironmentSwitcher";

// Demo mode detection

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  useEnvironment();
  const envRouter = useEnvironmentRouter();

  // Determine if we're currently in env-aware routing mode
  const isEnvAware = useMemo(() => {
    return location.pathname.startsWith("/env/");
  }, [location.pathname]);

  // Determine if we're in demo mode
  const isDemo = useMemo(() => {
    return location.pathname.startsWith("/demo");
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (isEnvAware) {
      return (
        location.pathname ===
        `/env/${envRouter.envId}${path === "/" ? "" : path}`
      );
    }
    if (isDemo) {
      return location.pathname === `/demo${path === "/" ? "" : path}`;
    }
    return location.pathname === path;
  };

  const getNavPath = (path: string): string => {
    if (isEnvAware) {
      return `/env/${envRouter.envId}${path === "/" ? "" : path}`;
    }
    if (isDemo) {
      return `/demo${path === "/" ? "" : path}`;
    }
    return path;
  };

  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: "📊",
      description: "Overview and statistics",
    },
    {
      path: "/servers",
      label: "Servers",
      icon: "🦖",
      description: "Manage ARK servers (containers & native)",
    },
    {
      path: "/configs",
      label: "Configs",
      icon: "📝",
      description: "Edit server configurations",
    },
    {
      path: "/rcon",
      label: "RCON",
      icon: "⌨️",
      description: "RCON console and chat for all servers",
    },
    {
      path: "/system-logs",
      label: "System Logs",
      icon: "🔧",
      description: "API and system logs",
    },
    {
      path: "/provisioning",
      label: "Provisioning",
      icon: "🏗️",
      description: "Create servers and clusters",
    },
    {
      path: "/discord",
      label: "Discord",
      icon: "💬",
      description: "Discord webhooks and bot setup",
    },
    {
      path: "/auto-update",
      label: "Auto-Update",
      icon: "🔄",
      description: "Scheduler, warnings, and update controls",
    },
    {
      path: "/kits",
      label: "Kits",
      icon: "🎁",
      description: "Player kits and what the mod reported back",
    },
  ];

  // Add admin-only menu items
  const adminMenuItems = user?.permissions?.includes("user_management")
    ? [
        {
          path: "/games",
          label: "Game Types",
          icon: "🎮",
          description: "Manage supported game types",
        },
        {
          path: "/users",
          label: "User Management",
          icon: "👥",
          description: "Manage users and permissions",
        },
      ]
    : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-base-100/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 border border-primary/40 shadow-[0_0_18px_-4px_var(--color-primary)]">
                <span className="text-lg leading-none">🦖</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[0.8rem] font-bold uppercase tracking-[0.14em] text-base-content/90 leading-tight">
                  ASA Suite
                </h1>
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.12em] text-primary/70 leading-tight">
                  control deck
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden btn btn-ghost btn-sm"
              aria-label="Close sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={getNavPath(item.path)}
                onClick={onClose}
                className={`nav-item ${isActive(item.path) ? "nav-item-active" : ""}`}
              >
                <span className="nav-ico">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8rem] font-semibold leading-tight">{item.label}</div>
                  <div className="text-[0.66rem] text-base-content/65 truncate leading-tight mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}

            {/* Admin-only section */}
            {adminMenuItems.length > 0 && (
              <>
                <div className="section-label pt-5">Administration</div>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={getNavPath(item.path)}
                    onClick={onClose}
                    className={`nav-item ${isActive(item.path) ? "nav-item-active" : ""}`}
                  >
                    <span className="nav-ico">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8rem] font-semibold leading-tight">{item.label}</div>
                      <div className="text-[0.66rem] text-base-content/65 truncate leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-center">
                <EnvironmentSwitcher />
              </div>
              <div className="text-[0.62rem] font-mono uppercase tracking-[0.12em] text-base-content/35 text-center">
                Game Estate Dashboard v2.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
