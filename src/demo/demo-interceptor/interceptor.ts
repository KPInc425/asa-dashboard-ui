import { isDemoPath } from "../demo-core";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { getMockData } from "./mock-data";

function getPath(config: any): string {
  const base = (config.baseURL || "").replace(/\/+$/, "");
  let url = (config.url || "").replace(/^\/+/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.split("?")[0];
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try { return new URL(url).pathname; } catch { return "/" + url; }
  }
  if (base.startsWith("http://") || base.startsWith("https://")) {
    try { return new URL(url, base).pathname; } catch { return "/" + url; }
  }
  return "/" + url;
}

export function installDemoInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.response.use(async (response: AxiosResponse) => {
    if (!isDemoPath()) return response;
    const config = response.config;
    if (!config) return response;
    const path = getPath(config);
    const method = (config.method || "get").toLowerCase();
    let body: unknown;
    try { body = config.data ? JSON.parse(config.data as string) : undefined; } catch { body = config.data; }
    const mockData = getMockData(path, method, body);
    if (mockData === undefined) return response;
    response.data = mockData;
    response.status = 200;
    response.statusText = "OK (Demo)";
    return response;
  });

  axiosInstance.interceptors.response.use(
    undefined,
    async (error: AxiosError) => {
      if (!isDemoPath()) return Promise.reject(error);
      const config = error.config;
      if (!config) return Promise.reject(error);
      const path = getPath(config);
      const method = (config.method || "get").toLowerCase();
      let body: unknown;
      try { body = config.data ? JSON.parse(config.data as string) : undefined; } catch { body = config.data; }
      const mockData = getMockData(path, method, body);
      if (mockData === undefined) return Promise.reject(error);
      return { data: mockData, status: 200, statusText: "OK (Demo)", headers: {}, config } as AxiosResponse;
    },
  );
}
