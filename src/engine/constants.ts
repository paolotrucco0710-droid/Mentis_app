/** Mastery level that unlocks dependent atoms. */
export const PREREQUISITE_MASTERY_THRESHOLD = 70;

/** Forget probability above which review becomes urgent. */
export const REVIEW_FORGET_THRESHOLD = 0.55;

/** Mastery considered fully stable for session completion heuristics. */
export const MASTERY_STABLE_THRESHOLD = 85;

/** Default session length in cards before suggesting completion. */
export const DEFAULT_SESSION_TARGET_CARDS = 20;

/** Card types treated as explanation-heavy (variety rules). */
export const EXPLANATION_CARD_TYPES = new Set([
  "explain",
]);

/** Visual explanation cards handled separately from text explain cards. */
export const IMAGE_EXPLAIN_CARD_TYPES = new Set([
  "image_explain",
]);

/** Card types treated as retrieval-heavy (variety rules). */
export const RETRIEVAL_CARD_TYPES = new Set([
  "quiz",
  "multiple_choice",
  "true_false",
  "fill_blank",
  "blurting",
  "feynman",
  "error_detection",
  "memory_recall",
]);

/** Open-ended retrieval cards shown less often than quick checks. */
export const OPEN_RESPONSE_CARD_TYPES = new Set([
  "blurting",
  "feynman",
]);

/** Quick retrieval cards preferred for session variety. */
export const QUICK_RETRIEVAL_CARD_TYPES = new Set([
  "quiz",
  "multiple_choice",
  "true_false",
  "error_detection",
]);
