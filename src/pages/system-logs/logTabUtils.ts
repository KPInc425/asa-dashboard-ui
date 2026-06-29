import { LogTab } from "./types";

export const getLogTabMeta = (key: string): LogTab => {
  if (key.includes("combined")) {
    return {
      key: "combined",
      sourceKey: key,
      label: "Combined Logs",
      icon: "📋",
    };
  }
  if (key.includes("error")) {
    return { key: "error", sourceKey: key, label: "Error Logs", icon: "❌" };
  }
  if (key.includes("asa-api-service")) {
    return {
      key: "asaApiService",
      sourceKey: key,
      label: "API Service",
      icon: "🔧",
    };
  }
  if (key.includes("node-out")) {
    return { key: "nodeOut", sourceKey: key, label: "Node Stdout", icon: "📤" };
  }
  if (key.includes("node-err")) {
    return { key: "nodeErr", sourceKey: key, label: "Node Stderr", icon: "📥" };
  }
  if (key.includes("nssm-out")) {
    return {
      key: "serviceOut",
      sourceKey: key,
      label: "Service Stdout",
      icon: "⚙️",
    };
  }
  if (key.includes("nssm-err")) {
    return {
      key: "serviceErr",
      sourceKey: key,
      label: "Service Stderr",
      icon: "⚠️",
    };
  }

  return {
    key,
    sourceKey: key,
    label: key
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    icon: "📄",
  };
};
