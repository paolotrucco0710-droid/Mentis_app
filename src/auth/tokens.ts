import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import type { UserId } from "@/domain/ids";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants";

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env.authJwtSecret);
}

export interface AccessTokenPayload {
  sub: UserId;
  sid: string;
}

export async function createAccessToken(input: {
  userId: UserId;
  sessionId: string;
  expiresAt: Date;
}): Promise<string> {
  return new SignJWT({
    sid: input.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(input.expiresAt.getTime() / 1000))
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload.sub;
  const sessionId = payload.sid;

  if (!userId || typeof userId !== "string" || typeof sessionId !== "string") {
    throw new Error("Invalid token payload.");
  }

  return {
    sub: userId as UserId,
    sid: sessionId,
  };
}

export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function getAccessTokenMaxAgeSeconds(): number {
  return env.authAccessTokenTtlMinutes * 60;
}

export function getRefreshTokenMaxAgeSeconds(): number {
  return env.authRefreshTokenTtlDays * 24 * 60 * 60;
}

export function getAccessTokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + env.authAccessTokenTtlMinutes * 60_000);
}

export function getRefreshTokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + env.authRefreshTokenTtlDays * 24 * 60 * 60_000);
}
