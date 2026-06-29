/**
 * Demo Handler
 *
 * This file is a re-export from the demo-handler/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { handleDemoRequest } from './demo-handler/handler';

  for (const route of MOCK_ROUTES) {
    if (route.pattern.test(url)) {
      const mockData = route.handler(url, method, body);
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
      return {
        data: mockData,
        status: 200,
        statusText: "OK (Demo)",
        headers: { "content-type": "application/json" },
        config,
        __demoHandled: true,
      } as any;
    }
  }

  // No match — passthrough to real request
  return originalRequest(config);
}
