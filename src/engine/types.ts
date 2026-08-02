import type { Atom, Card, StudySession, UserAtomState, UserCardState } from "@/domain/entities";
import type { CardType } from "@/domain/enums";
import type { CognitiveAtomStage } from "@/domain/enums/cognitive";
import type { AtomId, SubjectId, UserId } from "@/domain/ids";

export interface FeedEngineContext {
  userId: UserId;
  subjectId: SubjectId;
  session: StudySession;
  atoms: Atom[];
  cardsByAtomId: Map<string, Card[]>;
  userAtomStates: Map<string, UserAtomState>;
  userCardStates: Map<string, UserCardState>;
  cardsById: Map<string, Card>;
  lastCardType: CardType | null;
  recentCardTypes: CardType[];
  recentAtomIds: AtomId[];
  knowledgeSourceExposure: Map<string, number>;
  now: Date;
}

export interface ScoredAtomCandidate {
  atom: Atom;
  state: UserAtomState;
  stage: CognitiveAtomStage;
  priority: number;
  forgetProbability: number;
  prerequisitesMet: boolean;
  unlocksCount: number;
}

export interface AtomSelectionResult {
  candidate: ScoredAtomCandidate;
  card: Card;
}
