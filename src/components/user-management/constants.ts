export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (password: string) => password.length >= 8, error: 'Password must be at least 8 characters long' },
  { id: 'uppercase', label: 'At least one uppercase letter', test: (password: string) => /[A-Z]/.test(password), error: 'Password must contain at least one uppercase letter' },
  { id: 'lowercase', label: 'At least one lowercase letter', test: (password: string) => /[a-z]/.test(password), error: 'Password must contain at least one lowercase letter' },
  { id: 'number', label: 'At least one number', test: (password: string) => /\d/.test(password), error: 'Password must contain at least one number' },
  { id: 'special', label: 'At least one special character', test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password), error: 'Password must contain at least one special character' },
  { id: 'common-patterns', label: 'Must not contain common patterns like 123, abc, password, admin, or qwerty', test: (password: string) => !/(123|abc|password|admin|qwerty)/i.test(password), error: 'Password cannot contain common patterns' },
] as const;
