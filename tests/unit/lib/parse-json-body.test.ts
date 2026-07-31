import { describe, expect, it } from "vitest";
import { parseJsonBody } from "@/lib/api/parse-json-body";

describe("lib/api/parse-json-body", () => {
  it("returns 400 when the request body is empty", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseJsonBody(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(result.response.json()).resolves.toMatchObject({
        code: "INVALID_JSON",
      });
    }
  });

  it("parses valid JSON bodies", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "abc" }),
    });

    const result = await parseJsonBody<{ sessionId: string }>(request);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sessionId).toBe("abc");
    }
  });
});
