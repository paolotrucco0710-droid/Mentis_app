"use client";

import { useCallback, useEffect, useRef } from "react";
import { TextArea } from "@/components/ui";
import { IconButton } from "@/components/ui/icon-button";
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
      className={cn("h-5 w-5", className)}
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

  const { isSupported, isListening, interimText, error, toggleListening } = useSpeechInput({
    enabled: !disabled,
    onFinalTranscript: handleFinalTranscript,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextArea
            label={label}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
        {isSupported ? (
          <IconButton
            label={isListening ? "Ferma dettatura" : "Parla la risposta"}
            className={cn(
              "shrink-0",
              isListening && "bg-primary/10 text-primary"
            )}
            disabled={disabled}
            onClick={toggleListening}
          >
            <MicrophoneIcon />
          </IconButton>
        ) : null}
      </div>
      {isListening ? (
        <p className="text-xs text-primary">
          Ascolto in corso...
          {interimText ? ` ${interimText}` : " Parla ora."}
        </p>
      ) : null}
      {error ? <p className="text-xs text-muted">{error}</p> : null}
    </div>
  );
}
