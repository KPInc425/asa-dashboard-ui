/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEV_API_PROXY_TARGET,
  getDevApiProxyTarget,
} from '../utils/devProxy'

describe('getDevApiProxyTarget', () => {
  it('defaults to the loopback backend target used by local MCP runs', () => {
    expect(getDevApiProxyTarget()).toBe(DEFAULT_DEV_API_PROXY_TARGET)
  })

  it('preserves an explicit override', () => {
    expect(getDevApiProxyTarget('http://localhost:4000')).toBe('http://localhost:4000')
  })

  it('ignores blank overrides', () => {
    expect(getDevApiProxyTarget('   ')).toBe(DEFAULT_DEV_API_PROXY_TARGET)
  })
})