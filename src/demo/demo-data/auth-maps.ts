import type { User } from "../../services/api-core";

export const DEMO_USER: User = {
  username: "Demo Viewer",
  role: "admin",
  permissions: ["read", "write", "admin", "user_management"],
  profile: {
    firstName: "Demo",
    lastName: "Viewer",
    displayName: "Demo Viewer",
    email: "demo@ark-server-dashboard.io",
    timezone: "UTC",
    language: "en",
  },
};

export const ARK_MAPS = [
  "TheIsland", "ScorchedEarth", "Aberration", "Extinction",
  "Genesis1", "Genesis2", "CrystalIsles", "LostIsland",
  "Fjordur", "Ragnarok", "Valguero", "TheCenter",
];
