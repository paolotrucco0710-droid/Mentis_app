import { describe, expect, it } from "vitest";
import {
  appendSpeechTranscript,
  collectSpeechTranscript,
  mapSpeechRecognitionError,
} from "@/lib/speech/recognition";

describe("speech recognition helpers", () => {
  it("appends transcripts with spacing", () => {
    expect(appendSpeechTranscript("", "prima frase")).toBe("prima frase");
    expect(appendSpeechTranscript("già detto", "altro pezzo")).toBe(
      "già detto altro pezzo"
    );
  });

  it("collects final and interim transcript chunks", () => {
    const event = {
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: "La Reconquista " } },
        { isFinal: false, 0: { transcript: "in Spagna" } },
      ],
    };

    expect(collectSpeechTranscript(event)).toEqual({
      finalText: "La Reconquista",
      interimText: "in Spagna",
    });
  });

  it("skips duplicate transcript chunks", () => {
    expect(appendSpeechTranscript("la civiltà romana", "la civiltà romana")).toBe(
      "la civiltà romana"
    );
  });

  it("maps microphone permission errors to user-facing copy", () => {
    expect(mapSpeechRecognitionError("not-allowed")).toContain("microfono");
    expect(mapSpeechRecognitionError("network")).toContain("offline");
  });
});
