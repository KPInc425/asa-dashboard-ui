/**
 * Auth Context
 *
 * Provides authentication state and methods to the component tree.
 * Maintains backward compatibility with existing pages while adding
 * environment-aware per-backend auth state via the adapter layer.
 *
 * Environment awareness:
 * - On environment switch (detected via useScopedAdapter), checks the new
 *   backend adapter's auth state via adapter.isAuthenticated()
 * - Tracks per-backend authentication states for all known backends
 * - Exports `useAuthState()` for components that need the adapter-level view
 * - Exports `useAuth()` (existing), `AuthProvider` (existing) unchanged
 *
 * Context hierarchy (per Phase 10):
 *   <EnvironmentProvider>
 *     <AuthProvider>
 *       <App />
 *     </AuthProvider>
 *   </EnvironmentProvider>
 *
 * @see /home/steam/automation/docs/plans/phase7-auth-commands-design.md
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { authApi } from "../services/api";
import type { User } from "../services/api";
import { useScopedAdapter } from "../hooks/useScopedAdapter";
import type { AuthCredentials } from "../adapters/types";

// ---------------------------------------------------------------------------
// Existing types (backward compat)
// ---------------------------------------------------------------------------

/**
 * Shape of the original AuthContext value.
 * Kept unchanged for backward compatibility with existing pages.
 */
export interface AuthContextType {
  /** The currently authenticated user, or null if not authenticated */
  user: User | null;
  /** Whether the user has a valid auth session */
  isAuthenticated: boolean;
  /** Whether the initial auth check is still in progress */
  isLoading: boolean;
  /** Whether the backend requires first-time setup (default admin) */
  needsFirstTimeSetup: boolean;
  /**
   * Authenticate with the backend.
   * @param username  - Admin username
   * @param password  - Admin password
   * @param rememberMe - Whether to persist the session
   */
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  /** Clear the current auth session */
  logout: () => void;
  /** Mark first-time setup as complete and refresh user data */
  completeFirstTimeSetup: () => void;
}

// ---------------------------------------------------------------------------
// New types (environment-aware auth)
// ---------------------------------------------------------------------------

/**
 * Authentication state for a single backend within an environment.
 */
export interface BackendAuthEntry {
  /** Whether the adapter holds a valid token for this backend */
  isAuthenticated: boolean;
  /** User info returned by the adapter's authentication flow */
  user?: { id: string; username: string; roles: string[] };
  /** Auth token held by the adapter */
  token?: string;
  /** Timestamp (epoch ms) when the token expires */
  expiresAt?: number;
}

/**
 * Per-backend authentication states keyed by backend ID.
 */
export type BackendAuthStates = Record<string, BackendAuthEntry>;

/**
 * Auth state scoped to the current environment's primary backend.
 *
 * Returned by the `useAuthState()` hook.
 */
export interface AuthState {
  /** Auth states for all known backends across all environments */
  backendAuthStates: BackendAuthStates;
  /** Auth helpers for the current environment's primary backend */
  currentAuth: {
    /** Whether the current backend adapter is authenticated */
    isAuthenticated: boolean;
    /** User info from the current backend adapter */
    user?: { id: string; username: string; roles: string[] };
    /** Authenticate with the current backend via the adapter */
    login: (credentials: AuthCredentials) => Promise<void>;
    /** Log out from the current backend */
    logout: () => Promise<void>;
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Demo mode auto-authentication
// ---------------------------------------------------------------------------

import { isDemoMode } from "../demo/demo-core";
import { DEMO_USER } from "../demo/demo-data";

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

/**
 * Provides authentication state and methods to the component tree.
 *
 * Wraps inside EnvironmentProvider so it can react to environment
 * switches and check the new backend's adapter auth state.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ---- Existing auth state (backward compat) ----
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsFirstTimeSetup, setNeedsFirstTimeSetup] = useState(false);

  // ---- Environment-aware auth state ----
  const [backendAuthStates, setBackendAuthStates] = useState<BackendAuthStates>(
    {},
  );
  const { adapter, backendId } = useScopedAdapter();

  // Keep a ref of the previous backend ID to detect environment switches.
  const prevBackendIdRef = useRef<string | null>(null);

  // -----------------------------------------------------------------------
  // Legacy auth check (on mount only, unchanged behaviour)
  // -----------------------------------------------------------------------

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Demo mode: auto-authenticate without any backend check.
        if (isDemoMode()) {
          setUser(DEMO_USER);
          setNeedsFirstTimeSetup(false);
          setIsLoading(false);
          // Set a fake token so isAuthenticated() checks pass
          localStorage.setItem("auth_token", "demo-mode-token");
          return;
        }

        if (authApi.isAuthenticated()) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);

          // Check if this is the default admin user that needs first-time setup
          const isDefaultAdmin =
            currentUser?.username === "admin" &&
            (currentUser?.profile?.firstName === "Admin" ||
              !currentUser?.profile?.firstName);
          setNeedsFirstTimeSetup(isDefaultAdmin);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        authApi.logout();
        setUser(null);
        setNeedsFirstTimeSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // -----------------------------------------------------------------------
  // Adapter auth check on environment switch
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!adapter) {
      // No adapter available for the current environment →
      // the environment likely has no backends (deep-link-only mode).
      prevBackendIdRef.current = backendId;
      return;
    }

    const checkAdapterAuth = async () => {
      const adapterIsAuth = adapter.isAuthenticated();
      const adapterToken = adapter.getAuthToken();

      let adapterUser:
        | { id: string; username: string; roles: string[] }
        | undefined;
      if (adapterIsAuth && adapterToken) {
        // Try to extract user info from the adapter's auth result.
        // The adapter stores user info internally after authenticate().
        // We deliberately avoid calling authenticate() here — that is the
        // user's action via the login flow.
      }

      setBackendAuthStates((prev) => ({
        ...prev,
        [backendId]: {
          isAuthenticated: adapterIsAuth,
          token: adapterToken ?? undefined,
          user: adapterUser,
        },
      }));
    };

    // Detect environment switch: if the backend ID changed, the user
    // switched environments (or loaded a different backend's page).
    if (
      prevBackendIdRef.current !== null &&
      prevBackendIdRef.current !== backendId
    ) {
      // Environment switch detected — check the new backend's auth state.
      checkAdapterAuth();
    }

    prevBackendIdRef.current = backendId;

    // Also run once on mount if not already run by the legacy check.
    if (
      prevBackendIdRef.current === backendId &&
      Object.keys(backendAuthStates).length === 0
    ) {
      checkAdapterAuth();
    }
  }, [adapter, backendId]);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------

  const login = useCallback(
    async (username: string, password: string, rememberMe: boolean = false) => {
      // 1. Legacy authApi login (backward compat)
      const response = await authApi.login(username, password, rememberMe);
      setUser(response.user);

      // Check if this is the default admin user that needs first-time setup
      const isDefaultAdmin =
        response.user?.username === "admin" &&
        (response.user?.profile?.firstName === "Admin" ||
          !response.user?.profile?.firstName);
      setNeedsFirstTimeSetup(isDefaultAdmin);

      // 2. Also authenticate via the adapter (if available) so that the
      //    per-backend auth state is consistent.
      if (adapter) {
        try {
          const credentials: AuthCredentials = { username, password };
          const authResult = await adapter.authenticate(credentials);

          if (authResult.success) {
            setBackendAuthStates((prev) => ({
              ...prev,
              [backendId]: {
                isAuthenticated: true,
                token: authResult.token,
                expiresAt: authResult.expiresAt,
                user: authResult.user,
              },
            }));
          }
        } catch (err) {
          // Adapter auth is supplementary — don't fail the whole login
          // if the adapter's authenticate() isn't wired up yet.
          console.warn("Adapter auth during login failed:", err);
        }
      }
    },
    [adapter, backendId],
  );

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------

  const logout = useCallback(() => {
    // 1. Legacy authApi logout (backward compat)
    authApi.logout();
    setUser(null);
    setNeedsFirstTimeSetup(false);

    // 2. Clear the adapter auth state for the current backend
    if (adapter) {
      // Adapters store auth state internally; calling authenticate()
      // with no credentials or an explicit clear would be ideal.
      // For now we just clear our local tracking.
      setBackendAuthStates((prev) => ({
        ...prev,
        [backendId]: {
          isAuthenticated: false,
        },
      }));
    }
  }, [adapter, backendId]);

  // -----------------------------------------------------------------------
  // First-time setup
  // -----------------------------------------------------------------------

  const completeFirstTimeSetup = useCallback(() => {
    setNeedsFirstTimeSetup(false);
    // Refresh user data to get updated profile
    if (user) {
      authApi
        .getCurrentUser()
        .then((updatedUser) => {
          setUser(updatedUser);
        })
        .catch(console.error);
    }
  }, [user]);

  // -----------------------------------------------------------------------
  // Context value (backward compat)
  // -----------------------------------------------------------------------

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      needsFirstTimeSetup,
      login,
      logout,
      completeFirstTimeSetup,
    }),
    [
      user,
      isLoading,
      needsFirstTimeSetup,
      login,
      logout,
      completeFirstTimeSetup,
    ],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Use the existing auth context.
 *
 * Returns the current user, authentication status, and auth methods.
 * Must be used within an AuthProvider.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Use the environment-aware auth state.
 *
 * Returns per-backend authentication states and helpers scoped to the
 * current environment's primary backend adapter. Useful for components
 * that need to check auth against the adapter layer rather than the
 * legacy authApi.
 *
 * @example
 * ```tsx
 * const { backendAuthStates, currentAuth } = useAuthState();
 * const isAuthenticated = currentAuth.isAuthenticated;
 * await currentAuth.login({ username: 'admin', password: '...' });
 * ```
 */
export function useAuthState(): AuthState {
  const { adapter, backendId } = useScopedAdapter();

  // We re-use the same underlying state by reading from the context.
  // Since this hook is meant to be used inside AuthProvider, and the
  // provider tracks backendAuthStates internally, we need to derive
  // the value from the same source.
  //
  // Because backendAuthStates is local to the provider, we read the
  // current adapter's auth state directly.
  const [state, setState] = useState<AuthState>(() => {
    const isAdapterAuth = adapter?.isAuthenticated() ?? false;
    return {
      backendAuthStates: {},
      currentAuth: {
        isAuthenticated: isAdapterAuth,
        login: async (_credentials: AuthCredentials) => {
          // Will be set by the provider — this is a placeholder
          // that gets replaced when the provider updates state.
        },
        logout: async () => {
          // Placeholder.
        },
      },
    };
  });

  // Sync with the current adapter on backend changes.
  useEffect(() => {
    const isAdapterAuth = adapter?.isAuthenticated() ?? false;
    const adapterToken = adapter?.getAuthToken() ?? null;

    setState((prev) => ({
      ...prev,
      backendAuthStates: {
        ...prev.backendAuthStates,
        [backendId]: {
          isAuthenticated: isAdapterAuth,
          token: adapterToken ?? undefined,
        },
      },
      currentAuth: {
        isAuthenticated: isAdapterAuth,
        login: async (credentials: AuthCredentials) => {
          if (!adapter) {
            console.warn("No adapter available for environment:", backendId);
            return;
          }
          const result = await adapter.authenticate(credentials);
          if (result.success) {
            setState((s) => ({
              ...s,
              backendAuthStates: {
                ...s.backendAuthStates,
                [backendId]: {
                  isAuthenticated: true,
                  token: result.token,
                  expiresAt: result.expiresAt,
                  user: result.user,
                },
              },
              currentAuth: {
                ...s.currentAuth,
                isAuthenticated: true,
                user: result.user,
              },
            }));
          } else {
            throw new Error(result.error ?? "Authentication failed");
          }
        },
        logout: async () => {
          // Adapter-level logout clears adapter auth state.
          // We simply update local tracking — the adapter's own
          // auth state management is internal.
          setState((s) => {
            const updated = { ...s.backendAuthStates };
            delete updated[backendId];
            return {
              ...s,
              backendAuthStates: updated,
              currentAuth: {
                ...s.currentAuth,
                isAuthenticated: false,
                user: undefined,
              },
            };
          });
        },
      },
    }));
  }, [adapter, backendId]);

  return state;
}
