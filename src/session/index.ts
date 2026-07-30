export { SessionEngineError } from "./errors";
export {
  openSession,
  getSessionDetail,
  pauseSession,
  resumeSession,
  endSession,
  assertSessionReadyForStudy,
} from "./lifecycle";
export { computeSessionMetrics } from "./metrics";
export { resolveSessionStatus, resolvePausedAt } from "./state";
export { SessionStatus } from "./types";
export type {
  SessionDetail,
  SessionMetrics,
  EndSessionInput,
  EndSessionResult,
  OpenSessionInput,
} from "./types";
