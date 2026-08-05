"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(detectStandaloneMode);

  useEffect(() => {
    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleDisplayModeChange() {
      setIsStandalone(detectStandaloneMode());
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window
        .matchMedia("(display-mode: standalone)")
        .removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  if (deferredPrompt) {
    return (
      <Card className="border-primary/20 bg-accent/40">
        <CardHeader className="gap-3">
          <CardTitle>Installa Mentis sul telefono</CardTitle>
          <CardDescription>
            Aggiungi l&apos;app alla schermata Home per studiare a schermo intero,
            come un&apos;app vera.
          </CardDescription>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              fullWidth
              onClick={() => {
                void deferredPrompt.prompt().then(() => {
                  setDeferredPrompt(null);
                });
              }}
            >
              Aggiungi a Home
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Non ora
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Usa Mentis sul telefono</CardTitle>
        <CardDescription>
          Su iPhone: tocca Condividi → Aggiungi a Home. Su Android: usa il menu
          del browser e scegli Installa app o Aggiungi a schermata Home.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
