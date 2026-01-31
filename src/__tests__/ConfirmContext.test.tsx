import { useState } from 'react';
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
