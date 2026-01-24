import { useEffect } from 'react';
import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  // define globals in a way that works across environments
  // @ts-expect-error - provide jsdom globals for environments without jsdom
  Object.defineProperty(global, 'window', { value: dom.window, configurable: true });
  // @ts-expect-error - provide jsdom globals for environments without jsdom
  Object.defineProperty(global, 'document', { value: dom.window.document, configurable: true });
  // @ts-expect-error - provide jsdom globals for environments without jsdom
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
}
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToastProvider, useToast } from '../contexts/ToastContext';

function TestComponent() {
  const { showToast } = useToast();
  useEffect(() => {
    showToast('Hello ARIA toast', 'success', 0);
  }, [showToast]);
  return null;
}

describe('ToastContext', () => {
  it('adds a toast with ARIA attributes', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const toast = await screen.findByRole('status');
    expect(toast).toHaveAttribute('aria-live');
    expect(toast).toHaveTextContent('Hello ARIA toast');
  });
});
