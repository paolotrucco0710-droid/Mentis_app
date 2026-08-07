export const DEFAULT_SPEECH_LANG = "it-IT";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

export type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scope = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

function normalizeSpeechText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function findSuffixPrefixWordOverlap(left: string, right: string): number {
  const leftWords = left.trim().split(/\s+/).filter(Boolean);
  const rightWords = right.trim().split(/\s+/).filter(Boolean);

  if (leftWords.length === 0 || rightWords.length === 0) {
    return 0;
  }

  const maxSize = Math.min(leftWords.length, rightWords.length);
  for (let size = maxSize; size > 0; size -= 1) {
    const suffix = leftWords.slice(-size).join(" ").toLowerCase();
    const prefix = rightWords.slice(0, size).join(" ").toLowerCase();
    if (suffix !== prefix) {
      continue;
    }

    let overlapLength = 0;
    for (let index = 0; index < size; index += 1) {
      if (index > 0) {
        overlapLength += 1;
      }
      overlapLength += rightWords[index]?.length ?? 0;
    }

    return overlapLength;
  }

  return 0;
}

export function appendSpeechTranscript(
  current: string,
  transcript: string
): string {
  const chunk = transcript.trim().replace(/\s+/g, " ");
  if (!chunk) {
    return current;
  }

  const currentTrimmed = current.trim().replace(/\s+/g, " ");
  if (!currentTrimmed) {
    return chunk;
  }

  const currentNormalized = normalizeSpeechText(currentTrimmed);
  const chunkNormalized = normalizeSpeechText(chunk);

  if (currentNormalized === chunkNormalized) {
    return currentTrimmed;
  }

  if (chunkNormalized.startsWith(currentNormalized)) {
    return chunk;
  }

  if (currentNormalized.startsWith(chunkNormalized)) {
    return currentTrimmed;
  }

  if (currentNormalized.includes(chunkNormalized)) {
    return currentTrimmed;
  }

  const overlap = findSuffixPrefixWordOverlap(currentTrimmed, chunk);
  if (overlap > 0) {
    const merged = `${currentTrimmed}${chunk.slice(overlap)}`;
    return merged.replace(/\s+/g, " ").trim();
  }

  return `${currentTrimmed} ${chunk}`;
}

export function collectSpeechTranscript(
  event: SpeechRecognitionEventLike
): { finalText: string; interimText: string } {
  let finalText = "";
  let interimText = "";

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (!result) {
      continue;
    }

    const transcript = result[0]?.transcript ?? "";
    if (result.isFinal) {
      finalText += transcript;
    } else {
      interimText += transcript;
    }
  }

  return {
    finalText: finalText.trim(),
    interimText: interimText.trim(),
  };
}

export function mapSpeechRecognitionError(error?: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permesso microfono negato. Puoi continuare a scrivere.";
    case "no-speech":
      return "Non ho sentito nulla. Riprova o scrivi la risposta.";
    case "audio-capture":
      return "Microfono non disponibile su questo dispositivo.";
    case "network":
      return "Riconoscimento vocale non disponibile offline.";
    default:
      return "Riconoscimento vocale non disponibile. Usa la tastiera.";
  }
}
