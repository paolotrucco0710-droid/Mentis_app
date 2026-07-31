import {
  createAuthSession,
  findAuthSessionById,
  findAuthSessionByRefreshTokenHash,
  findActiveAuthSessionsByUserId,
  revokeAuthSession,
  revokeAllAuthSessionsForUser,
  rotateAuthSessionRefreshToken,
  touchAuthSession,
} from "@/db/repositories/auth-sessions";
import {
  createPasswordResetToken,
  findPasswordResetTokenByHash,
  invalidatePasswordResetTokensForUser,
  markPasswordResetTokenUsed,
} from "@/db/repositories/password-reset-tokens";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserLastAccess,
  updateUserPasswordHash,
} from "@/db/repositories/users";
import { AccountStatus } from "@/domain/enums";
import type { UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { AuthError } from "./errors";
import { toPublicUser } from "./mappers";
import {
  createAccessToken,
  createRefreshToken,
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
} from "./tokens";
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./password";
import type {
  AuthRequestMeta,
  AuthResult,
  AuthSessionView,
  LoginInput,
  PublicUser,
  RegisterInput,
} from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertPasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new AuthError(
      "La password deve avere almeno 8 caratteri.",
      "WEAK_PASSWORD",
      400
    );
  }
}

async function assertActiveSession(sessionId: string): Promise<void> {
  const session = await findAuthSessionById(sessionId);
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AuthError("Sessione non valida.", "SESSION_INVALID", 401);
  }
}

async function issueTokens(
  userId: UserId,
  meta: AuthRequestMeta
): Promise<AuthResult["tokens"]> {
  const refreshToken = createRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiry();
  const accessTokenExpiresAt = getAccessTokenExpiry();

  const session = await createAuthSession({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiresAt,
    deviceId: meta.deviceId ?? null,
    deviceLabel: meta.deviceLabel ?? null,
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  const accessToken = await createAccessToken({
    userId,
    sessionId: session.id,
    expiresAt: accessTokenExpiresAt,
  });

  await updateUserLastAccess(userId);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    sessionId: session.id,
  };
}

export async function registerUser(
  input: RegisterInput,
  meta: AuthRequestMeta
): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError("Email non valida.", "INVALID_EMAIL", 400);
  }

  assertPasswordStrength(input.password);

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AuthError(
      "Esiste già un account con questa email.",
      "EMAIL_ALREADY_EXISTS",
      409
    );
  }

  const user = await createUser({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    accountStatus: AccountStatus.Active,
  });

  const tokens = await issueTokens(user.id, meta);

  return {
    user: toPublicUser(user),
    tokens,
  };
}

export async function loginUser(
  input: LoginInput,
  meta: AuthRequestMeta
): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);

  if (!user || user.accountStatus !== AccountStatus.Active) {
    throw new AuthError(
      "Email o password non corretti.",
      "INVALID_CREDENTIALS",
      401
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError(
      "Email o password non corretti.",
      "INVALID_CREDENTIALS",
      401
    );
  }

  const tokens = await issueTokens(user.id, meta);

  return {
    user: toPublicUser(user),
    tokens,
  };
}

export async function refreshAuthTokens(
  refreshToken: string
): Promise<AuthResult> {
  const session = await findAuthSessionByRefreshTokenHash(hashToken(refreshToken));
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AuthError("Sessione scaduta.", "SESSION_EXPIRED", 401);
  }

  const user = await findUserById(session.userId);
  if (!user || user.accountStatus !== AccountStatus.Active) {
    throw new AuthError("Account non disponibile.", "ACCOUNT_INACTIVE", 403);
  }

  const nextRefreshToken = createRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiry();
  const accessTokenExpiresAt = getAccessTokenExpiry();

  await rotateAuthSessionRefreshToken({
    id: session.id,
    refreshTokenHash: hashToken(nextRefreshToken),
    expiresAt: refreshTokenExpiresAt,
  });

  const accessToken = await createAccessToken({
    userId: user.id,
    sessionId: session.id,
    expiresAt: accessTokenExpiresAt,
  });

  await updateUserLastAccess(user.id);

  return {
    user: toPublicUser(user),
    tokens: {
      accessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      sessionId: session.id,
    },
  };
}

export async function logoutSession(sessionId: string): Promise<void> {
  await revokeAuthSession(sessionId);
}

export async function logoutAllSessions(userId: UserId): Promise<void> {
  await revokeAllAuthSessionsForUser(userId);
}

export async function getCurrentUser(userId: UserId): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AuthError("Utente non trovato.", "USER_NOT_FOUND", 404);
  }

  return toPublicUser(user);
}

export async function listUserSessions(
  userId: UserId,
  currentSessionId?: string | null
): Promise<AuthSessionView[]> {
  const sessions = await findActiveAuthSessionsByUserId(userId);

  return sessions.map((session) => ({
    id: session.id,
    deviceLabel: session.deviceLabel,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
    current: session.id === currentSessionId,
  }));
}

export async function revokeUserSession(
  userId: UserId,
  sessionId: string
): Promise<void> {
  const session = await findAuthSessionById(sessionId);
  if (!session || session.userId !== userId) {
    throw new AuthError("Sessione non trovata.", "SESSION_NOT_FOUND", 404);
  }

  await revokeAuthSession(sessionId);
}

export async function requestPasswordReset(email: string): Promise<{
  message: string;
  resetUrl?: string;
}> {
  const normalized = normalizeEmail(email);
  const user = await findUserByEmail(normalized);

  if (!user) {
    return {
      message:
        "Se l'email è registrata, riceverai le istruzioni per reimpostare la password.",
    };
  }

  await invalidatePasswordResetTokensForUser(user.id);

  const rawToken = generateToken(32);
  const expiresAt = new Date(
    Date.now() + env.authPasswordResetTtlMinutes * 60_000
  );

  await createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  if (env.isDevelopment) {
    console.info(`[auth] Password reset link for ${normalized}: ${resetUrl}`);
  }

  return {
    message:
      "Se l'email è registrata, riceverai le istruzioni per reimpostare la password.",
    resetUrl: env.isDevelopment ? resetUrl : undefined,
  };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<void> {
  assertPasswordStrength(input.password);

  const record = await findPasswordResetTokenByHash(hashToken(input.token));
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new AuthError(
      "Link di reset non valido o scaduto.",
      "RESET_TOKEN_INVALID",
      400
    );
  }

  await updateUserPasswordHash(record.userId, await hashPassword(input.password));
  await markPasswordResetTokenUsed(record.id);
  await revokeAllAuthSessionsForUser(record.userId);
}

export async function validateAccessSession(sessionId: string): Promise<void> {
  await assertActiveSession(sessionId);
  await touchAuthSession(sessionId);
}
