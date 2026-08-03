/** Mastery level that unlocks dependent atoms after introduction. */
export const PREREQUISITE_INTRODUCTION_THRESHOLD = 25;

/** Legacy export kept for callers that still reference the old name. */
export const PREREQUISITE_MASTERY_THRESHOLD = PREREQUISITE_INTRODUCTION_THRESHOLD;

/** Max cards on the same atom in one session before forcing rotation. */
export const MAX_SESSION_CARDS_PER_ATOM = 2;

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

/** Passive learning cards — avoid long streaks in the feed. */
export const LEARN_CARD_TYPES = new Set([
  ...EXPLANATION_CARD_TYPES,
]);

/** Image cards behave like visual retrieval, not passive learn cards. */
export const VISUAL_RETRIEVAL_CARD_TYPES = new Set([
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

/** Open-ended production/reflection cards (blurting, feynman). */
export const OPEN_RESPONSE_CARD_TYPES = new Set([
  "blurting",
  "feynman",
]);

/** Recent cards scanned when checking if production is missing from the session. */
export const OPEN_RESPONSE_SESSION_WINDOW = 8;

/** Quick retrieval successes needed on an atom before blurting/feynman. */
export const OPEN_RESPONSE_MIN_QUICK_RETRIEVALS = 1;

/** Quick retrieval cards preferred for session variety. */
export const QUICK_RETRIEVAL_CARD_TYPES = new Set([
  "quiz",
  "multiple_choice",
  "true_false",
  "error_detection",
  "image_explain",
]);
