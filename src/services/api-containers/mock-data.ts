import type { Container } from "../api-core";

export const MOCK_CONTAINERS: Container[] = [
  {
    name: "asa-server-theisland",
    status: "running",
    image: "ark:latest",
    ports: ["7777:7777", "32330:32330"],
    created: "2024-01-15T10:30:00Z",
  },
  {
    name: "asa-server-scorched",
    status: "stopped",
    image: "ark:latest",
    ports: ["7778:7777", "32331:32330"],
    created: "2024-01-16T14:20:00Z",
  },
  {
    name: "asa-server-aberration",
    status: "running",
    image: "ark:latest",
    ports: ["7779:7777", "32332:32330"],
    created: "2024-01-17T09:15:00Z",
  },
  {
    name: "asa-server-extinction",
    status: "restarting",
    image: "ark:latest",
    ports: ["7780:7777", "32333:32330"],
    created: "2024-01-18T16:45:00Z",
  },
];
