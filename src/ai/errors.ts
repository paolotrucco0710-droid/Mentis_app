import { AIProcessingError } from "./pipeline";

export function toUserFacingAIError(error: unknown): AIProcessingError {
  if (error instanceof AIProcessingError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "Elaborazione AI fallita.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("402") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("credit balance")
  ) {
    return new AIProcessingError(
      "Credito OpenRouter insufficiente per questo modello. Aggiungi credito su openrouter.ai oppure usa un modello :free.",
      "INSUFFICIENT_CREDITS",
      402
    );
  }

  if (
    normalized.includes("401") ||
    normalized.includes("invalid api key") ||
    normalized.includes("user not found")
  ) {
    return new AIProcessingError(
      "Chiave OpenRouter non valida. Controlla OPENAI_API_KEY nel file .env.",
      "INVALID_API_KEY",
      401
    );
  }

  if (normalized.includes("no endpoints found for")) {
    return new AIProcessingError(
      `Modello AI non disponibile: ${message}`,
      "MODEL_NOT_FOUND",
      400
    );
  }

  if (normalized.includes("rate limit") || normalized.includes("429")) {
    return new AIProcessingError(
      "Limite richieste raggiunto. Attendi un minuto e riprova.",
      "RATE_LIMITED",
      429
    );
  }

  if (normalized.includes("json non valido")) {
    return new AIProcessingError(
      "Il modello AI non ha prodotto un JSON valido. Prova AI_REASONING_MODEL=google/gemini-2.5-flash.",
      "INVALID_JSON",
      422
    );
  }

  return new AIProcessingError(message, "PROCESSING_FAILED", 500);
}
