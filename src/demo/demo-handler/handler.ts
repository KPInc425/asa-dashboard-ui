import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { MOCK_ROUTES } from "./routes";

export async function handleDemoRequest(
  config: AxiosRequestConfig,
  originalRequest: (config: AxiosRequestConfig) => Promise<AxiosResponse>,
): Promise<AxiosResponse> {
  const url = typeof config.url === "string" ? config.url : "";
  const method = (config.method || "get").toLowerCase();
  let body: unknown;
  try {
    body = config.data ? JSON.parse(config.data as string) : undefined;
  } catch {
    body = config.data;
  }

  for (const { pattern, handler } of MOCK_ROUTES) {
    if (pattern.test(url)) {
      const data = handler(url, method, body);
      return {
        data,
        status: 200,
        statusText: "OK (Demo)",
        headers: {},
        config,
      } as AxiosResponse;
    }
  }

  return originalRequest(config);
}
