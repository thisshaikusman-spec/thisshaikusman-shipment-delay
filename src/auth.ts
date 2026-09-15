/**
 * Auth utilities for the demo localStorage-based auth flow.
 * No real backend is involved — this is strictly a UI/demo session.
 */

export const USERS_KEY = 'logipredict_users';
export const SESSION_KEY = 'logipredict_session';

export interface StoredUser {
  name: string;
  email: string;
  /** Plain-text password — demo only, never do this in production */
  password: string;
  createdAt: string;
}

export interface Session {
  email: string;
  name: string;
  loggedInAt: string;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

export function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export function saveUser(user: StoredUser): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUser(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function createSession(user: StoredUser): void {
  const session: Session = {
    email: user.email,
    name: user.name,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Validation helpers ───────────────────────────────────────────────────────

/** Standard email format check */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export interface PasswordStrength {
  valid: boolean;
  missing: string[];
}

/** Min 8 chars, 1 uppercase, 1 number, 1 special character */
export function checkPassword(password: string): PasswordStrength {
  const missing: string[] = [];
  if (password.length < 8)            missing.push('at least 8 characters');
  if (!/[A-Z]/.test(password))        missing.push('1 uppercase letter');
  if (!/[0-9]/.test(password))        missing.push('1 number');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('1 special character');
  return { valid: missing.length === 0, missing };
}
