/**
 * ARK Map Registry
 *
 * Centralized configuration of all known ARK: Survival Ascended maps.
 * Admins can add custom maps via the MapManager UI (stored in localStorage),
 * so new maps don't require a code deployment.
 *
 * Usage:
 * ```tsx
 * import { getMaps, getMapDisplayName } from '../config/maps';
 * const allMaps = getMaps(); // official + admin-added custom maps
 * ```
 */

// ---------------------------------------------------------------------------
// Storage key for admin-added custom maps
// ---------------------------------------------------------------------------
const STORAGE_KEY_CUSTOM_MAPS = "asa_dashboard_custom_maps";
const STORAGE_KEY_DISABLED_MAPS = "asa_dashboard_disabled_maps";

// ---------------------------------------------------------------------------
// Map entry shape
// ---------------------------------------------------------------------------
export interface MapEntry {
  /** ARK-internal map name (e.g. "TheIsland", "LostColony") */
  name: string;
  /** Human-readable label (e.g. "The Island", "Lost Colony") */
  displayName: string;
  /** Whether this map is available for provisioning (admin can toggle) */
  available: boolean;
  /** Whether this is a built-in official map */
  official: boolean;
}

// ---------------------------------------------------------------------------
// Official ARK maps (as of Lost Colony release)
// ---------------------------------------------------------------------------

/**
 * Complete list of known ARK: Survival Ascended official maps.
 * Update this when new official maps release (it's a small maintenance cost
 * and keeps the registry accurate out of the box).
 */
export const OFFICIAL_MAPS: MapEntry[] = [
  // Story maps
  { name: "TheIsland",      displayName: "The Island",         available: true,  official: true },
  { name: "TheCenter",      displayName: "The Center",         available: true,  official: true },
  { name: "ScorchedEarth",  displayName: "Scorched Earth",     available: true,  official: true },
  { name: "Aberration",     displayName: "Aberration",         available: true,  official: true },
  { name: "Extinction",     displayName: "Extinction",         available: true,  official: true },
  { name: "Genesis",        displayName: "Genesis",            available: true,  official: true },
  { name: "Genesis2",       displayName: "Genesis Part 2",     available: true,  official: true },

  // Free DLC / community maps
  { name: "Ragnarok",       displayName: "Ragnarok",           available: true,  official: true },
  { name: "CrystalIsles",   displayName: "Crystal Isles",      available: true,  official: true },
  { name: "Valguero",       displayName: "Valguero",           available: true,  official: true },
  { name: "LostIsland",     displayName: "Lost Island",        available: true,  official: true },
  { name: "Fjordur",        displayName: "Fjordur",            available: true,  official: true },
  { name: "BobsMissions",   displayName: "Club ARK",           available: true,  official: true },

  // Lost Colony — latest ASA expansion
  { name: "LostColony",     displayName: "Lost Colony",        available: true,  official: true },
];

// ---------------------------------------------------------------------------
// Lookup helpers: internal name ↔ display name
// ---------------------------------------------------------------------------

/**
 * Hardcoded name-to-display map for old save files that use the `_WP`
 * suffix convention (e.g. "TheIsland_WP").
 */
const LEGACY_WP_NAMES: Record<string, string> = {
  "TheIsland_WP":     "The Island",
  "TheCenter_WP":     "The Center",
  "Ragnarok_WP":      "Ragnarok",
  "ScorchedEarth_WP": "Scorched Earth",
  "Aberration_WP":    "Aberration",
  "Extinction_WP":    "Extinction",
  "BobsMissions_WP":  "Club ARK",
  "CrystalIsles_WP":  "Crystal Isles",
  "Valguero_WP":      "Valguero",
  "LostIsland_WP":    "Lost Island",
  "Fjordur_WP":       "Fjordur",
  "Genesis_WP":       "Genesis",
  "Genesis2_WP":      "Genesis Part 2",
  "LostColony_WP":    "Lost Colony",
};

// ---------------------------------------------------------------------------
// Custom (admin-added) maps stored in localStorage
// ---------------------------------------------------------------------------

/**
 * Load custom maps from localStorage.
 */
function loadCustomMaps(): MapEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_MAPS);
    if (!raw) return [];
    return JSON.parse(raw) as MapEntry[];
  } catch {
    return [];
  }
}

/**
 * Save custom maps to localStorage.
 */
function saveCustomMaps(maps: MapEntry[]): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_MAPS, JSON.stringify(maps));
}

/**
 * Load disabled map names from localStorage.
 */
function loadDisabledNames(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISABLED_MAPS);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDisabledNames(names: Set<string>): void {
  localStorage.setItem(STORAGE_KEY_DISABLED_MAPS, JSON.stringify([...names]));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the full map list — official maps merged with admin-added custom maps,
 * respecting admin toggles (available/disabled).
 */
export function getMaps(): MapEntry[] {
  const official = OFFICIAL_MAPS;
  const custom = loadCustomMaps();
  const disabledNames = loadDisabledNames();

  // Official maps: disabled if in the disabled set
  const officialWithToggles = official.map((m) => ({
    ...m,
    available: !disabledNames.has(m.name) && m.available,
  }));

  // Custom maps: only those that have no name collision with official
  const officialNames = new Set(official.map((m) => m.name));
  const filteredCustom = custom.filter((m) => !officialNames.has(m.name));

  return [...officialWithToggles, ...filteredCustom];
}

/**
 * Get only available (enabled) maps — for provisioning UI.
 */
export function getAvailableMaps(): MapEntry[] {
  return getMaps().filter((m) => m.available);
}

/**
 * Resolve a map code / internal name to its human-readable display name.
 * Handles both `"TheIsland"` and `"TheIsland_WP"` formats.
 */
export function getMapDisplayName(mapCode: string): string {
  if (!mapCode) return mapCode;

  // Check legacy WP names first
  if (LEGACY_WP_NAMES[mapCode]) return LEGACY_WP_NAMES[mapCode];

  // Check the full map list
  const allMaps = getMaps();
  const found = allMaps.find((m) => m.name === mapCode);
  if (found) return found.displayName;

  // Also check official maps directly (in case custom maps aren't loaded yet)
  const official = OFFICIAL_MAPS.find((m) => m.name === mapCode);
  if (official) return official.displayName;

  // Unknown map — return as-is
  return mapCode;
}

/**
 * Resolve a display name back to an internal map name (provisioning).
 */
export function getMapName(displayName: string): string | undefined {
  const allMaps = getMaps();
  const found = allMaps.find((m) => m.displayName === displayName);
  return found?.name;
}

/**
 * Add a custom map (admin function).
 */
export function addCustomMap(name: string, displayName: string): boolean {
  if (!name.trim() || !displayName.trim()) return false;

  const officialNames = new Set(OFFICIAL_MAPS.map((m) => m.name));
  if (officialNames.has(name.trim())) return false; // can't shadow official

  const custom = loadCustomMaps();
  if (custom.some((m) => m.name === name.trim())) return false; // already added

  custom.push({
    name: name.trim(),
    displayName: displayName.trim(),
    available: true,
    official: false,
  });
  saveCustomMaps(custom);
  return true;
}

/**
 * Remove a custom map (admin function).
 */
export function removeCustomMap(name: string): boolean {
  const officialNames = new Set(OFFICIAL_MAPS.map((m) => m.name));
  if (officialNames.has(name)) return false; // can't remove official

  const custom = loadCustomMaps().filter((m) => m.name !== name);
  saveCustomMaps(custom);
  return true;
}

/**
 * Toggle whether a map is available (disabled maps are hidden from provisioning).
 */
export function toggleMapAvailable(name: string): void {
  const disabled = loadDisabledNames();
  if (disabled.has(name)) {
    disabled.delete(name);
  } else {
    disabled.add(name);
  }
  saveDisabledNames(disabled);
}
