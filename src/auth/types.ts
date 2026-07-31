import type { UserId } from "@/domain/ids";

export interface PublicUser {
  id: UserId;
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  timezone: string;
  registeredAt: Date;
  lastAccessAt: Date | null;
}

export interface AuthSessionView {
  id: string;
  deviceLabel: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  current: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  sessionId: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthRequestMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceId?: string | null;
  deviceLabel?: string | null;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}
