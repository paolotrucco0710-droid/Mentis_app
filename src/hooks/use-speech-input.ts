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
  const isSupported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    processedUntilRef.current = 0;
    setIsListening(false);
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    if (!enabled || !isSupported || isListening) {
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
    processedUntilRef.current = 0;

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
              onFinalTranscript?.(finalChunk);
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
      if (event.error === "no-speech") {
        return;
      }
      setError(mapSpeechRecognitionError(event.error));
      setIsListening(false);
      recognitionRef.current = null;
      processedUntilRef.current = 0;
      setInterimText("");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
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
      recognitionRef.current = null;
      processedUntilRef.current = 0;
      setIsListening(false);
    }
  }, [enabled, isListening, isSupported, lang, onFinalTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (!enabled && recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      processedUntilRef.current = 0;
      setInterimText("");
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      processedUntilRef.current = 0;
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
