/**
 * Demo Interceptor
 *
 * This file is a re-export from the demo-interceptor/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { installDemoInterceptor } from './demo-interceptor/interceptor';
];

function getMockData(path: string, method: string, body?: unknown): unknown {
  const np = path.startsWith("/") ? path : "/" + path;
  for (const r of ROUTES) {
    if (r.pattern.test(np)) return r.handler(np, method, body);
  }
  return undefined;
}
