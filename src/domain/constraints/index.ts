/**
 * Database integrity constraints (Capitolo 7).
 * Documented as constants — enforced in Milestone 3.
 */

/** Every Atom belongs to exactly one KnowledgeSource. */
export const CONSTRAINT_ATOM_SINGLE_SOURCE = "atom_single_source" as const;

/** Every Card belongs to exactly one Atom. */
export const CONSTRAINT_CARD_SINGLE_ATOM = "card_single_atom" as const;

/** UserAtomState is unique per (userId, atomId). */
export const CONSTRAINT_USER_ATOM_STATE_UNIQUE =
  "user_atom_state_unique" as const;

/** UserCardState is unique per (userId, cardId). */
export const CONSTRAINT_USER_CARD_STATE_UNIQUE =
  "user_card_state_unique" as const;

/** Every Review references one user-atom pair. */
export const CONSTRAINT_REVIEW_USER_ATOM = "review_user_atom" as const;

/** Every SessionEvent belongs to exactly one StudySession. */
export const CONSTRAINT_EVENT_SINGLE_SESSION = "event_single_session" as const;

/** Prefer soft deletes to preserve history. */
export const CONSTRAINT_SOFT_DELETE_PREFERRED =
  "soft_delete_preferred" as const;

export const INTEGRITY_CONSTRAINTS = [
  CONSTRAINT_ATOM_SINGLE_SOURCE,
  CONSTRAINT_CARD_SINGLE_ATOM,
  CONSTRAINT_USER_ATOM_STATE_UNIQUE,
  CONSTRAINT_USER_CARD_STATE_UNIQUE,
  CONSTRAINT_REVIEW_USER_ATOM,
  CONSTRAINT_EVENT_SINGLE_SESSION,
  CONSTRAINT_SOFT_DELETE_PREFERRED,
] as const;

export type IntegrityConstraint = (typeof INTEGRITY_CONSTRAINTS)[number];
