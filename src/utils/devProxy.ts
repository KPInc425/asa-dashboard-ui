export const DEFAULT_DEV_API_PROXY_TARGET = 'http://127.0.0.1:4000'

export function getDevApiProxyTarget(envTarget?: string): string {
  const target = envTarget?.trim()
  return target || DEFAULT_DEV_API_PROXY_TARGET
}