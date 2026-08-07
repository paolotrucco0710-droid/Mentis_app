"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SPEECH_LANG,
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  type BrowserSpeechRecognition,
} from "@/lib/speech/recognition";

export interface UseSpeechInputOptions {
  lang?: string;
  enabled?: boolean;
  onFinalTranscript?: (transcript: string) => void;
}

export function useSpeechInput({
  lang = DEFAULT_SPEECH_LANG,
  enabled = true,
  onFinalTranscript,
}: UseSpeechInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const processedUntilRef = useRef(0);
  const holdActiveRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const spawnRecognitionRef = useRef<(() => void) | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const resetRecognitionState = useCallback(() => {
    recognitionRef.current = null;
    processedUntilRef.current = 0;
    setInterimText("");
  }, []);

  const spawnRecognition = useCallback(() => {
    if (!enabled || !isSupported) {
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setError(mapSpeechRecognitionError());
      return;
    }

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) {
          continue;
        }

        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          if (index >= processedUntilRef.current) {
            const finalChunk = transcript.trim();
            if (finalChunk) {
              onFinalTranscriptRef.current?.(finalChunk);
            }
            processedUntilRef.current = index + 1;
          }
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      setError(mapSpeechRecognitionError(event.error));
      holdActiveRef.current = false;
      setIsListening(false);
      resetRecognitionState();
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (holdActiveRef.current && enabled) {
        processedUntilRef.current = 0;
        setInterimText("");
        spawnRecognitionRef.current?.();
        return;
      }

      setIsListening(false);
      processedUntilRef.current = 0;
      setInterimText("");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setError(null);
      setIsListening(true);
    } catch {
      setError(mapSpeechRecognitionError());
      resetRecognitionState();
      setIsListening(false);
    }
  }, [enabled, isSupported, lang, resetRecognitionState]);

  useEffect(() => {
    spawnRecognitionRef.current = spawnRecognition;
  }, [spawnRecognition]);

  const stopListening = useCallback(() => {
    holdActiveRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const beginHold = useCallback(() => {
    if (!enabled || !isSupported || holdActiveRef.current) {
      return;
    }

    holdActiveRef.current = true;
    spawnRecognition();
  }, [enabled, isSupported, spawnRecognition]);

  const endHold = useCallback(() => {
    if (!holdActiveRef.current) {
      return;
    }

    stopListening();
  }, [stopListening]);

  useEffect(() => {
    if (!enabled && recognitionRef.current) {
      holdActiveRef.current = false;
      recognitionRef.current.abort();
      resetRecognitionState();
      setIsListening(false);
    }
  }, [enabled, resetRecognitionState]);

  useEffect(() => {
    return () => {
      holdActiveRef.current = false;
      recognitionRef.current?.abort();
      resetRecognitionState();
    };
  }, [resetRecognitionState]);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    beginHold,
    endHold,
  };
}
