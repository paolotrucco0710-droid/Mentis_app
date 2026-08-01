import { describe, expect, it } from "vitest";
import { toUserFacingAIError } from "@/ai/errors";

describe("toUserFacingAIError", () => {
  it("maps insufficient credits to a clear message", () => {
    const error = toUserFacingAIError(
      new Error("402 Insufficient credits. Add more on openrouter.ai")
    );

    expect(error.code).toBe("INSUFFICIENT_CREDITS");
    expect(error.message).toContain("Credito OpenRouter insufficiente");
  });

  it("maps missing model endpoints to model not found", () => {
    const error = toUserFacingAIError(
      new Error("404 No endpoints found for google/gemini-2.0-flash-exp:free.")
    );

    expect(error.code).toBe("MODEL_NOT_FOUND");
    expect(error.statusCode).toBe(400);
  });
});
