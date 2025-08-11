import { api, FRONTEND_ONLY_MODE } from './api-core';
import type { LockStatus } from './api-core';

const MOCK_LOCK_STATUS: LockStatus = {
  locked: false,
  lockedBy: undefined,
  lockedAt: undefined,
  reason: undefined
};

// Lock Status API
export const lockApi = {
  /**
   * Get current update lock status
   */
  getLockStatus: async (): Promise<LockStatus> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock lock status for frontend-only mode
      return MOCK_LOCK_STATUS;
    } else {
      const response = await api.get<LockStatus>('/api/lock-status');
      return response.data;
    }
  },
};
