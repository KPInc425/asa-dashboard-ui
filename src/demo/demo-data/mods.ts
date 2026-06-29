import { getDemoServers } from "./servers-clusters";

export const DEMO_MODS = [
  { id: "893531541", name: "Structures Plus (S+)", description: "Expanded building system with additional structures and automation", author: "Orionsun", version: "3.10.5" },
  { id: "895711211", name: "Classic Flyers", description: "Restores the classic flyer movement and speed leveling", author: "Cryo", version: "2.2.1" },
  { id: "891432179", name: "Awesome Teleporters!", description: "Teleportation system with configurable pads and networks", author: "St1ko", version: "2.9.0" },
  { id: "887020303", name: "Dino Storage v2", description: "Advanced creature storage, management, and soul terminal", author: "Cyrus", version: "3.8.2" },
  { id: "889745254", name: "ARK Additions: The Collection!", description: "Adds new creatures like the Deinonychus, Xiphactinus, and more", author: "Garuga123", version: "2.4.0" },
  { id: "892697614", name: "Super Structures", description: "Quality-of-life structures, tools, and QoL improvements", author: "Kishark", version: "1.8.1" },
  { id: "896748157", name: "HG Building Improvements", description: "Stackable foundations, improved snapping, and building QoL", author: "HomoGamer", version: "1.5.3" },
  { id: "890870996", name: "Better Spoiling", description: "Adjustable spoil times for all perishable items", author: "Kittens", version: "1.2.0" },
];

export function getDemoModsOverview() {
  const { containers } = getDemoServers();
  const serverMods: Record<string, { additionalMods: string[]; excludeSharedMods: boolean }> = {};
  containers.forEach((c, i) => {
    serverMods[c.name] = { additionalMods: DEMO_MODS.slice(0, 3 + (i % 4)).map((m) => m.id), excludeSharedMods: i % 3 === 0 };
  });
  return { success: true, overview: { sharedMods: DEMO_MODS.slice(0, 6).map((m) => m.id), serverMods, totalServers: containers.length } };
}
