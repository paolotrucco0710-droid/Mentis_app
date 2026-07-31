import {
  countAnalyticsEventsByName,
  createAnalyticsEvent,
} from "@/db/repositories/analytics-events";
import { prisma } from "@/db/client";
import type { UserId } from "@/domain/ids";
import { logger } from "@/lib/logger";
import type { TrackAnalyticsEventInput } from "./types";

export function trackAnalyticsEvent(input: TrackAnalyticsEventInput): void {
  void createAnalyticsEvent({
    userId: input.userId as UserId | null | undefined,
    name: input.name,
    category: input.category,
    source: input.source,
    properties: input.properties,
    occurredAt: input.occurredAt,
  }).catch((error) => {
    logger.error("Analytics tracking failed", error);
  });
}

export async function trackFunnelMilestone(input: {
  userId: UserId;
  name: string;
  category: TrackAnalyticsEventInput["category"];
  source: TrackAnalyticsEventInput["source"];
  properties?: Record<string, unknown>;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await countAnalyticsEventsByName(
      input.userId,
      input.name,
      tx
    );
    if (existing > 0) {
      return;
    }

    await createAnalyticsEvent(
      {
        userId: input.userId,
        name: input.name,
        category: input.category,
        source: input.source,
        properties: input.properties,
      },
      tx
    );
  });
}

export function trackFunnelMilestoneAsync(input: {
  userId: UserId;
  name: string;
  category: TrackAnalyticsEventInput["category"];
  source: TrackAnalyticsEventInput["source"];
  properties?: Record<string, unknown>;
}): void {
  void trackFunnelMilestone(input).catch((error) => {
    logger.error("Funnel milestone tracking failed", error);
  });
}

export function trackApiError(input: {
  userId?: UserId | null;
  code: string;
  message: string;
  route: string;
  status: number;
}): void {
  trackAnalyticsEvent({
    userId: input.userId,
    name: "error.api",
    category: "error",
    source: "api",
    properties: {
      code: input.code,
      message: input.message,
      route: input.route,
      status: input.status,
    },
  });
}

export function trackPipelineError(input: {
  userId?: UserId | null;
  pipeline: string;
  code: string;
  message: string;
}): void {
  trackAnalyticsEvent({
    userId: input.userId,
    name: "error.pipeline",
    category: "error",
    source: "pipeline",
    properties: {
      pipeline: input.pipeline,
      code: input.code,
      message: input.message,
    },
  });
}
