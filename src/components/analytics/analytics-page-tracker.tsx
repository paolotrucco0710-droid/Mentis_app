"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/api/analytics";
import { AnalyticsEvents } from "@/analytics";

export function AnalyticsPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    void trackAnalyticsEvent({
      name: AnalyticsEvents.FeaturePageViewed,
      properties: { path: pathname },
    }).catch(() => {
      // Analytics non deve bloccare la navigazione.
    });
  }, [pathname]);

  return null;
}
