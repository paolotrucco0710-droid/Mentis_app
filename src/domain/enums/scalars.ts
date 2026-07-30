/** Integer scale 1 (marginal) → 5 (fundamental). */
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

/** Intrinsic difficulty 1 (easy) → 5 (hard). */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Continuous score 0 → 100. */
export type Score0To100 = number;

/** Probability or confidence 0 → 1. */
export type Score0To1 = number;

/** Abstraction level in the knowledge graph. */
export type AbstractionLevel = 1 | 2 | 3 | 4 | 5;
