import type { Atom } from "@/domain/entities";
import type { UserAtomState } from "@/domain/entities";
import { UserAtomLearningState } from "@/domain/enums";
import type { AtomId, UserId } from "@/domain/ids";
import { initialLearningStage, prerequisitesMet } from "@/engine/stages";
import { upsertUserAtomState } from "@/db/repositories/user-atom-states";

export async function unlockDependentAtoms(input: {
  userId: UserId;
  atoms: Atom[];
  userAtomStates: Map<string, UserAtomState>;
}): Promise<AtomId[]> {
  const { userId, atoms, userAtomStates } = input;
  const unlockedAtomIds: AtomId[] = [];

  for (const atom of atoms) {
    const state = userAtomStates.get(atom.id);
    if (!state || state.currentStage !== UserAtomLearningState.Locked) {
      continue;
    }

    if (!prerequisitesMet(atom.prerequisites, userAtomStates)) {
      continue;
    }

    const updated = await upsertUserAtomState({
      userId,
      atomId: atom.id,
      currentStage: initialLearningStage(true),
    });

    userAtomStates.set(atom.id, updated);
    unlockedAtomIds.push(atom.id);
  }

  return unlockedAtomIds;
}
