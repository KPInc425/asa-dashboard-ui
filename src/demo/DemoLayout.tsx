/**
 * DemoLayout — Renders the full app UI for the `/demo` public route.
 *
 * Uses <Outlet /> for child routes so React Router properly matches
 * paths like /demo/servers, /demo/rcon, etc.
 */

import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDemoRoute } from "./demo-core";
import DemoBanner from "./DemoBanner";
import Sidebar from "../components/Sidebar";

// ---------------------------------------------------------------------------
// Demo Header — uses useAuth() from the real AuthContext
// ---------------------------------------------------------------------------

const DemoHeader: React.FC<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-base-100 shadow-sm border-b border-base-300">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-ghost btn-sm"
            aria-label="Open sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {user && user.username ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-base-content/70">Welcome,</span>
              <span className="text-sm font-medium text-base-content">
                {user.username}
              </span>
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li className="menu-title">
                    <span className="text-sm text-base-content/70">
                      Signed in as
                    </span>
                  </li>
                  <li>
                    <span className="text-sm font-medium text-base-content">
                      {user.username}
                    </span>
                  </li>
                  <li className="divider"></li>
                  <li>
                    <Link
                      to={getDemoRoute("/profile")}
                      className="flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li className="divider"></li>
                  <li>
                    <Link
                      to="/"
                      className="text-info flex items-center space-x-2"
                      onClick={() => {
                        logout();
                        localStorage.removeItem("auth_token");
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Exit Demo</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/70">Not signed in</div>
          )}
        </div>
      </div>
    </header>
  );
};

// ---------------------------------------------------------------------------
// DemoLayout — uses Outlet for child route pages
// ---------------------------------------------------------------------------

const DemoLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DemoBanner />
      <div className="flex h-screen bg-base-200">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DemoHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default DemoLayout;
