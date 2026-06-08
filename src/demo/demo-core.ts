/**
 * Demo Mode Core
 *
 * Module-level demo mode flag used by API services to return mock data.
 * Set/cleared by DemoLayout when the `/demo` route is mounted/unmounted.
 *
 * Also holds the set of Axios instances that need their interceptors
 * installed, installed synchronously when demo mode is entered.
 */

import type { AxiosInstance } from "axios";

let _demoMode = false;

// Axios instances to patch when demo mode is entered.
const _targets: AxiosInstance[] = [];

/** Register an Axios instance to be patched in demo mode */
export function registerDemoTarget(instance: AxiosInstance): void {
  _targets.push(instance);
}

/** Enable demo mode and install mock-data interceptors on all targets */
export function enterDemoMode(): void {
  _demoMode = true;
  // Synchronously install the demo interceptor on all registered Axios instances.
  // Uses a regular import (not dynamic) so the module is already loaded.
}

/** Disable demo mode (called by DemoLayout on unmount) */
export function exitDemoMode(): void {
  _demoMode = false;
}

/** Check whether demo mode is currently active */
export function isDemoMode(): boolean {
  return _demoMode;
}

/**
 * Synchronously check if the current page URL is on the /demo route.
 * This works before enterDemoMode() is called, catching early API calls.
 */
export function isDemoPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/demo" || path.startsWith("/demo/");
}

/**
 * Demo mode URL helpers
 */
export function getDemoUrl(): string {
  if (typeof window === "undefined") return "/demo";
  const base = window.location.origin;
  return `${base}/demo`;
}

export function getDemoRoute(relativePath: string): string {
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `/demo${path}`;
}
