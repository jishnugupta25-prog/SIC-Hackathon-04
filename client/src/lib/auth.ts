import { User } from "@shared/schema";

const AUTH_KEY = "auth_user";
const SESSION_KEY = "session_id";

export function setAuthUser(user: User, sessionId: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function getAuthUser(): User | null {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null && getSessionId() !== null;
}
