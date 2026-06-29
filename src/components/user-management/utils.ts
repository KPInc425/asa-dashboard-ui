import { PASSWORD_REQUIREMENTS } from './constants';
import { api as apiClient, ApiError } from '../../services/api';
import type { Message, ApiErrorPayload } from './types';

export const getPasswordValidationErrors = (password: string) => {
  if (!password) return [];
  return PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.error);
};

export const extractApiMessage = (error: unknown, fallbackText: string): Message => {
  if (error instanceof ApiError) {
    const data = error.data as ApiErrorPayload | undefined;
    return { type: 'error', text: data?.message || error.message || fallbackText, details: Array.isArray(data?.errors) ? data.errors : undefined };
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: ApiErrorPayload } }).response;
    return { type: 'error', text: response?.data?.message || fallbackText, details: Array.isArray(response?.data?.errors) ? response?.data?.errors : undefined };
  }
  if (error instanceof Error) return { type: 'error', text: error.message || fallbackText };
  return { type: 'error', text: fallbackText };
};

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin': return 'badge-error';
    case 'operator': return 'badge-warning';
    case 'viewer': return 'badge-info';
    default: return 'badge-outline';
  }
};
