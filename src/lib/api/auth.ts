import type { AuthSessionView, PublicUser } from "@/auth/types";
import { apiFetch } from "./client";

export async function login(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const data = await apiFetch<{ user: PublicUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function register(input: {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const data = await apiFetch<{ user: PublicUser }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" });
}

export async function fetchCurrentUser(): Promise<{
  user: PublicUser;
  sessionId: string | null;
}> {
  return apiFetch<{ user: PublicUser; sessionId: string | null }>(
    "/api/v1/auth/me"
  );
}

export async function requestPasswordReset(email: string): Promise<{
  message: string;
  resetUrl?: string;
}> {
  return apiFetch("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<void> {
  await apiFetch("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAuthSessions(): Promise<AuthSessionView[]> {
  const data = await apiFetch<{ sessions: AuthSessionView[] }>(
    "/api/v1/auth/sessions"
  );
  return data.sessions;
}

export async function revokeAuthSession(sessionId: string): Promise<void> {
  await apiFetch(`/api/v1/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
