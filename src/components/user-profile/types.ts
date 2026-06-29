export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string | null;
  timezone: string;
  language: string;
}

export interface UserSecurity {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  profile: UserProfile;
  security: UserSecurity;
  metadata: {
    createdAt: string;
    lastActivity: string;
  };
}

export interface Message {
  type: 'success' | 'error';
  text: string;
}
