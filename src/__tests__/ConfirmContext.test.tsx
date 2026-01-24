import React, { useState } from 'react';
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
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ConfirmProvider, useConfirm } from '../contexts/ConfirmContext';

function TestComponent() {
  const { showConfirm } = useConfirm();
  const [res, setRes] = useState<string>('');

  return (
    <>
      <button onClick={async () => { const r = await showConfirm('Are you sure?'); setRes(String(r)); }}>
        Open
      </button>
      <div data-testid="result">{res}</div>
    </>
  );
}

describe('ConfirmContext', () => {
  it('resolves the promise when user confirms', async () => {
    render(
      <ConfirmProvider>
        <TestComponent />
      </ConfirmProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Open'));

    // modal should appear with OK button
    const ok = await screen.findByText('OK');
    await user.click(ok);

    expect(await screen.findByTestId('result')).toHaveTextContent('true');
  });
});
