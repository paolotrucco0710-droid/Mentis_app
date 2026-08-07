import type { Atom } from "@/domain/entities";
import type { UserAtomState } from "@/domain/entities";
import { UserAtomLearningState } from "@/domain/enums";
import type { AtomId, UserId } from "@/domain/ids";
import { findAtomsDependingOnPrerequisite } from "@/db/repositories/atoms";
import {
  findUserAtomStatesByUserAndAtomIds,
  upsertUserAtomState,
} from "@/db/repositories/user-atom-states";
import { initialLearningStage, prerequisitesMet } from "@/engine/stages";
import type { DbTx } from "@/db/transaction";

export async function unlockDependentAtoms(input: {
  userId: UserId;
  atoms: Atom[];
  userAtomStates: Map<string, UserAtomState>;
  tx?: DbTx;
}): Promise<AtomId[]> {
  const { userId, atoms, userAtomStates, tx } = input;
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
    }, tx);

    userAtomStates.set(atom.id, updated);
    unlockedAtomIds.push(atom.id);
  }

  return unlockedAtomIds;
}

export async function unlockAtomsUnlockedByPrerequisite(input: {
  userId: UserId;
  prerequisiteAtomId: AtomId;
}): Promise<AtomId[]> {
  const dependents = await findAtomsDependingOnPrerequisite(
    input.prerequisiteAtomId
  );

  if (dependents.length === 0) {
    return [];
  }

  const dependentIds = dependents.map((atom) => atom.id);
  const scopedStates = await findUserAtomStatesByUserAndAtomIds(
    input.userId,
    dependentIds
  );
  const userAtomStates = new Map(
    scopedStates.map((state) => [state.atomId, state])
  );

  return unlockDependentAtoms({
    userId: input.userId,
    atoms: dependents,
    userAtomStates,
  });
}
