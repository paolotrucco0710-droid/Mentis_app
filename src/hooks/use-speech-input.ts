"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendSpeechTranscript,
  collectSpeechTranscript,
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
  const isSupported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
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
    recognition.onresult = (event) => {
      const { finalText, interimText: interim } = collectSpeechTranscript(event);
      setInterimText(interim);
      if (finalText) {
        onFinalTranscript?.(finalText);
        setInterimText("");
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        return;
      }
      setError(mapSpeechRecognitionError(event.error));
      setIsListening(false);
      recognitionRef.current = null;
      setInterimText("");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
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
      setInterimText("");
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
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
    appendTranscript: appendSpeechTranscript,
  };
}
