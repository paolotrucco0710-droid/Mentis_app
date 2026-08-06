"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration is best-effort for offline shell support.
    });
  }, []);

  return null;
}
