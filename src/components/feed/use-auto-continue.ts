import { useEffect, useRef } from "react";

export function useAutoContinue(
  active: boolean,
  onContinue: () => void,
  delayMs = 400
): void {
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
  }, [active]);

  useEffect(() => {
    if (!active || fired.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (fired.current) {
        return;
      }

      fired.current = true;
      onContinue();
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [active, delayMs, onContinue]);
}
