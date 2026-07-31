import { AuthError } from "./errors";
import { verifyAccessToken, ACCESS_TOKEN_COOKIE } from "./tokens";
import { validateAccessSession } from "./service";
import type { UserId } from "@/domain/ids";
import { env } from "@/lib/env";
import { resolveDevUserId } from "@/lib/dev-auth";

function parseCookies(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) {
          return [part, ""];
        }
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export function getRequestMeta(request: Request) {
  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip"),
    deviceId: request.headers.get("x-device-id"),
    deviceLabel: request.headers.get("x-device-label"),
  };
}

export async function resolveAuthenticatedUserId(
  request: Request
): Promise<UserId> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const accessToken = cookies[ACCESS_TOKEN_COOKIE];

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      await validateAccessSession(payload.sid);
      return payload.sub;
    } catch {
      throw new AuthError(
        "Sessione scaduta. Effettua di nuovo l'accesso.",
        "UNAUTHORIZED",
        401
      );
    }
  }

  if (env.authDevFallback) {
    return resolveDevUserId();
  }

  throw new AuthError(
    "Autenticazione richiesta.",
    "UNAUTHORIZED",
    401
  );
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies.mentis_refresh ?? null;
}

export function getAccessSessionIdFromRequest(
  request: Request
): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const accessToken = cookies[ACCESS_TOKEN_COOKIE];
  if (!accessToken) {
    return null;
  }

  return null;
}
