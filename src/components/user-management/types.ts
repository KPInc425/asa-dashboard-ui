export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatar: string | null;
    timezone: string;
    language: string;
  };
  security: {
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: string;
  };
  metadata: {
    createdAt: string;
    lastActivity: string;
  };
}

export interface Message {
  type: 'success' | 'error';
  text: string;
  details?: string[];
}

export interface ApiErrorPayload {
  message?: string;
  errors?: string[];
}
