/**
 * Kit bridge API.
 *
 * These calls do not grant items. They write the files the KPTweaks mod polls, and read
 * back what it reports, so nothing here should ever claim a delivery on its own.
 */
import apiClient from "./apiClient";

export interface KitItem {
  class: string;
  quantity: number;
  quality?: number;
}

export interface KitCreature {
  class: string | null;
  saddle: string | null;
  level: number;
}

export type KitTrigger = "firstJoin" | "cooldown" | "manual";

export interface Kit {
  name: string;
  enabled: boolean;
  trigger: KitTrigger;
  cooldownSeconds: number;
  items: KitItem[];
  creature: KitCreature | null;
}

export interface KitStatus {
  dir: string;
  kits: number;
  kitsUpdatedAt: string | null;
  queued: number;
  processed: number;
}

export interface KitGrantResult {
  id: string;
  success?: boolean;
  player?: string;
  kit?: string;
  granted?: number;
  at?: string;
  error?: string;
}

export async function fetchKits(): Promise<{ kits: Kit[]; status: KitStatus }> {
  const res = await apiClient.get("/api/kits");
  return { kits: res.data.kits || [], status: res.data.status };
}

export async function saveKits(kits: Kit[]): Promise<Kit[]> {
  const res = await apiClient.put("/api/kits", { kits });
  return res.data.kits || [];
}

export async function grantKit(playerId: string, kitName: string) {
  const res = await apiClient.post("/api/kits/grant", { playerId, kitName });
  return res.data;
}

export async function fetchKitResults(): Promise<KitGrantResult[]> {
  const res = await apiClient.get("/api/kits/results");
  return res.data.results || [];
}

export function emptyKit(): Kit {
  return {
    name: "",
    enabled: true,
    trigger: "firstJoin",
    cooldownSeconds: 0,
    items: [],
    creature: null,
  };
}
