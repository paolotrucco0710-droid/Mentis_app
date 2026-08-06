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

export function appendSpeechTranscript(
  current: string,
  transcript: string
): string {
  const chunk = transcript.trim();
  if (!chunk) {
    return current;
  }

  if (!current.trim()) {
    return chunk;
  }

  const currentLower = current.toLowerCase();
  const chunkLower = chunk.toLowerCase();
  if (
    currentLower.endsWith(chunkLower) ||
    currentLower.includes(` ${chunkLower}`)
  ) {
    return current;
  }

  const needsSpace = !current.endsWith(" ") && !chunk.startsWith(" ");
  return `${current}${needsSpace ? " " : ""}${chunk}`;
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
