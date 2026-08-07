"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextArea } from "@/components/ui";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { appendSpeechTranscript } from "@/lib/speech/recognition";
import { cn } from "@/lib/utils";

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M19 11v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function RetrievalVoiceInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      onChange(appendSpeechTranscript(valueRef.current, transcript));
    },
    [onChange]
  );

  const { isSupported, isListening, interimText, error, beginHold, endHold } =
    useSpeechInput({
      enabled: !disabled,
      onFinalTranscript: handleFinalTranscript,
    });

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      beginHold();
    },
    [beginHold, disabled]
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }

      event.currentTarget.releasePointerCapture(event.pointerId);
      endHold();
    },
    [endHold]
  );

  return (
    <div className="space-y-4">
      <TextArea
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />

      {isSupported ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label={
              isListening ? "Rilascia per fermare la dettatura" : "Tieni premuto per parlare"
            }
            aria-pressed={isListening}
            disabled={disabled}
            className={cn(
              "flex h-20 w-20 touch-none items-center justify-center rounded-full border-2 transition-all duration-150",
              isListening
                ? "scale-105 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-border bg-muted/30 text-foreground hover:bg-accent active:scale-95"
            )}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onContextMenu={(event) => event.preventDefault()}
          >
            <MicrophoneIcon />
          </button>
          <p className="text-center text-xs text-muted">
            {isListening
              ? interimText
                ? `Ascolto... ${interimText}`
                : "Rilascia quando hai finito"
              : "Tieni premuto per parlare"}
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-muted">{error}</p> : null}
    </div>
  );
}
