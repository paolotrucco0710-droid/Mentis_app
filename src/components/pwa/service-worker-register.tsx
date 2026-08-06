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

        const refreshIfWaiting = () => {
          if (!registration.waiting) {
            return;
          }

          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        };

        if (registration.waiting) {
          refreshIfWaiting();
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }

          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              refreshIfWaiting();
            }
          });
        });

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
