import { describe, expect, it } from "vitest";
import { AuthError } from "@/auth";
import { toDomainHttpError } from "@/lib/api/domain-errors";

describe("lib/api/domain-errors", () => {
  it("maps known domain errors to HTTP payloads", () => {
    const error = new AuthError("Credenziali non valide.", "INVALID_CREDENTIALS", 401);
    expect(toDomainHttpError(error)).toEqual({
      message: "Credenziali non valide.",
      code: "INVALID_CREDENTIALS",
      statusCode: 401,
    });
  });

  it("returns null for unknown errors", () => {
    expect(toDomainHttpError(new Error("boom"))).toBeNull();
  });
});
