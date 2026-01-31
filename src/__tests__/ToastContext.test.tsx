import { useEffect } from 'react';
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
    // Individual toast has role="status" and aria-atomic, aria-live is on container
    expect(toast).toHaveAttribute('aria-atomic', 'true');
    expect(toast).toHaveTextContent('Hello ARIA toast');
  });
});
