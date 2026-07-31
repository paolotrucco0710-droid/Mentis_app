export type RateLimitPolicyName = "auth" | "upload" | "api" | "health";

export interface RateLimitPolicy {
  name: RateLimitPolicyName;
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_POLICIES: Record<RateLimitPolicyName, RateLimitPolicy> = {
  auth: {
    name: "auth",
    limit: 10,
    windowMs: 60_000,
  },
  upload: {
    name: "upload",
    limit: 5,
    windowMs: 60_000,
  },
  api: {
    name: "api",
    limit: 120,
    windowMs: 60_000,
  },
  health: {
    name: "health",
    limit: 1_000,
    windowMs: 60_000,
  },
};

export function resolveRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  if (pathname === "/api/health" || pathname === "/api/ready") {
    return RATE_LIMIT_POLICIES.health;
  }

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  if (pathname.startsWith("/api/v1/auth/")) {
    return RATE_LIMIT_POLICIES.auth;
  }

  if (pathname.startsWith("/api/v1/upload")) {
    return RATE_LIMIT_POLICIES.upload;
  }

  return RATE_LIMIT_POLICIES.api;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
