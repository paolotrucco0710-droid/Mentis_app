import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  countAnalyticsEventsByName,
  createAnalyticsEvent,
} from "@/db/repositories/analytics-events";
import type { UserId } from "@/domain/ids";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const TEST_USER_ID = "00000000-0000-4000-8000-000000000001" as UserId;
const TEST_EVENT = `test.integration.${Date.now()}`;

describe.skipIf(!hasDatabase)("integration/database analytics repository", () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (hasDatabase) {
      await prisma.analyticsEvent.deleteMany({
        where: { name: { startsWith: "test.integration." } },
      });
      await prisma.$disconnect();
    }
  });

  it("persists and counts analytics events", async () => {
    const before = await countAnalyticsEventsByName(TEST_USER_ID, TEST_EVENT);

    await createAnalyticsEvent({
      userId: TEST_USER_ID,
      name: TEST_EVENT,
      category: "feature",
      source: "api",
      properties: { suite: "integration" },
    });

    const after = await countAnalyticsEventsByName(TEST_USER_ID, TEST_EVENT);
    expect(after).toBe(before + 1);
  });
});
