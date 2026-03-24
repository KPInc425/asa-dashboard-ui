import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagement from '../components/UserManagement';

const { apiGetMock, apiPostMock, showConfirmMock, MockApiError } = vi.hoisted(() => {
  class HoistedMockApiError extends Error {
    status: number;
    data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  return {
    apiGetMock: vi.fn(),
    apiPostMock: vi.fn(),
    showConfirmMock: vi.fn(),
    MockApiError: HoistedMockApiError,
  };
});

vi.mock('../services/api', () => ({
  api: {
    get: apiGetMock,
    post: apiPostMock,
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: MockApiError,
}));

vi.mock('../contexts/ConfirmContext2', () => ({
  useConfirm: () => ({
    showConfirm: showConfirmMock,
  }),
}));

describe('UserManagement', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    showConfirmMock.mockReset();

    apiGetMock.mockResolvedValue({
      data: {
        success: true,
        users: [],
      },
    });
  });

  it('shows clear client-side password requirement feedback before submitting', async () => {
    const user = userEvent.setup();

    render(<UserManagement />);

    await screen.findByText('User Management');
    await user.click(screen.getByRole('button', { name: /add user/i }));

    const passwordInput = screen.getByLabelText('Password *');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password *');

    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');

    await user.type(screen.getByLabelText('Username *'), 'testuser');
    await user.type(screen.getByLabelText('Email *'), 'test@example.com');
    await user.type(passwordInput, 'CottonCandy13');
    await user.type(confirmPasswordInput, 'CottonCandy13');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText('Password does not meet the required rules.')).toBeInTheDocument();
    expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it('renders backend password validation details from ApiError responses', async () => {
    const user = userEvent.setup();

    apiPostMock.mockRejectedValue(
      new MockApiError('Password does not meet requirements', 400, {
        message: 'Password does not meet requirements',
        errors: [
          'Password must contain at least one special character',
          'Password cannot contain common patterns',
        ],
      })
    );

    render(<UserManagement />);

    await screen.findByText('User Management');
    await user.click(screen.getByRole('button', { name: /add user/i }));

    await user.type(screen.getByLabelText('Username *'), 'testuser');
    await user.type(screen.getByLabelText('Email *'), 'test@example.com');
    await user.type(screen.getByLabelText('Password *'), 'Stronger!92');
    await user.type(screen.getByLabelText('Confirm Password *'), 'Stronger!92');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => expect(apiPostMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Password does not meet requirements')).toBeInTheDocument();
    expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
    expect(screen.getByText('Password cannot contain common patterns')).toBeInTheDocument();
  });
});