"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let disposed = false;
    let removeListeners: (() => void) | undefined;

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (disposed) {
          return;
        }

        const onVisible = () => {
          void registration.update();
        };

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onVisible);
        removeListeners = () => {
          document.removeEventListener("visibilitychange", onVisible);
          window.removeEventListener("focus", onVisible);
        };
      })
      .catch(() => {
        // Service worker registration is best-effort for offline shell support.
      });

    return () => {
      disposed = true;
      removeListeners?.();
    };
  }, []);

  return null;
}
