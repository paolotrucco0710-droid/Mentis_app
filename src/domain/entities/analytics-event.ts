import type { AnalyticsEventCategory, AnalyticsEventSource } from "@prisma/client";

export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  name: string;
  category: AnalyticsEventCategory;
  source: AnalyticsEventSource;
  properties: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
}
