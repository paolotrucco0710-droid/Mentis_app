"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FeedItem, FeedResponse } from "@/domain/entities/feed-item";
import type { StudySession } from "@/domain/entities/study-session";
import { SessionEventOutcome } from "@/domain/enums";
import type { KnowledgeSourceId, StudySessionId } from "@/domain/ids";
import {
  ApiError,
  createStudySession,
  endSession,
  fetchDailyReview,
  fetchNextFeedItem,
  fetchSessionDetail,
  pauseSession,
  resumeSession,
  submitCardResponse,
} from "@/lib/api";
import { useActiveSubjectId } from "@/hooks";
import { SessionStatus } from "@/session/types";
import { Button, EmptyState, Loader } from "@/components/ui";
import { IconButton } from "@/components/ui";
import { ChevronRightIcon } from "@/components/ui/icons";
import { FeedCardRenderer } from "./feed-card-renderer";
import { FeedCardStage } from "./feed-card-stage";
import { FeedSwipeSurface } from "./feed-swipe-surface";
import { SessionComplete } from "./session-complete";
import {
  buildSessionSummaryView,
  type SessionSummaryView,
} from "./session-summary";
import type { CardAnswerResult } from "./card-utils";
import type { RecordCardResponseResult } from "@/lib/api/progress";
import {
  buildFeedScopeKey,
  shouldResetFeedForScopeChange,
} from "./feed-scope";

const SESSION_STORAGE_KEY = "mentis.activeSessionId";
const CHAPTER_SCOPE_KEY = "mentis.activeKnowledgeSourceId";

type FeedState =
  | { status: "loading" }
  | { status: "ready"; session: StudySession; item: FeedItem }
  | { status: "complete"; summary: SessionSummaryView }
  | { status: "error"; message: string; code?: string };

export function FeedStudy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const knowledgeSourceId = searchParams.get(
    "knowledgeSourceId"
  ) as KnowledgeSourceId | null;
  const requestedSessionId = searchParams.get(
    "sessionId"
  ) as StudySessionId | null;
  const { subjectId, loading: loadingSubject, error: subjectError } =
    useActiveSubjectId();
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [advanceReady, setAdvanceReady] = useState(false);
  const cardStartedAt = useRef<number>(0);
  const feedRequestId = useRef(0);
  const loadQueue = useRef<Promise<void>>(Promise.resolve());
  const bootstrapStarted = useRef(false);
  const feedScopeRef = useRef<string | null>(null);
  const answering = useRef(false);
  const advanceActionRef = useRef<(() => void) | null>(null);
  const advanceInPlaceRef = useRef(false);
  const readyFeedRef = useRef<{ session: StudySession; item: FeedItem } | null>(
    null
  );
  const prefetchedSubmissionRef = useRef<{
    cardKey: string;
    submission: RecordCardResponseResult;
  } | null>(null);
  const prefetchPromisesRef = useRef(
    new Map<string, Promise<RecordCardResponseResult>>()
  );
  const conceptsStudiedRef = useRef<Map<string, string>>(new Map());
  const masteryGainRef = useRef(0);

  const finalizeSession = useCallback(async (sessionId: StudySessionId) => {
    try {
      const result = await endSession(sessionId);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setState({
        status: "complete",
        summary: buildSessionSummaryView(result, {
          conceptsStudied: [...conceptsStudiedRef.current.values()],
          masteryGain: masteryGainRef.current,
        }),
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Impossibile chiudere la sessione.";
      setState({ status: "error", message });
    }
  }, [setState]);

  function buildFeedCardKey(
    sessionId: StudySessionId,
    item: Pick<FeedItem, "card" | "position" | "sessionId">
  ): string {
    return `${sessionId}-${item.card.id}-${item.position}`;
  }

  const applyFeedItem = useCallback(
    (session: StudySession | undefined, item: FeedItem) => {
      cardStartedAt.current = Date.now();
      advanceActionRef.current = null;
      advanceInPlaceRef.current = false;
      prefetchedSubmissionRef.current = null;
      prefetchPromisesRef.current.clear();
      setAdvanceReady(false);
      setSubmitting(false);
      conceptsStudiedRef.current.set(item.atomId, item.atomTitle);
      const nextState = {
        status: "ready" as const,
        session: session ?? ({ id: item.sessionId } as StudySession),
        item,
      };
      readyFeedRef.current = {
        session: nextState.session,
        item: nextState.item,
      };
      setState(nextState);
    },
    [setAdvanceReady, setState]
  );

  const applyFeedResponse = useCallback(
    async (
      session: StudySession | undefined,
      feed: FeedResponse,
      sessionId: StudySessionId
    ) => {
      if (!feed.item || feed.sessionComplete) {
        await finalizeSession(sessionId);
        return;
      }

      applyFeedItem(session, feed.item);
    },
    [applyFeedItem, finalizeSession]
  );

  const loadNext = useCallback(
    (sessionId: StudySessionId, session?: StudySession) => {
      if (!subjectId) {
        return Promise.resolve();
      }

      const requestId = ++feedRequestId.current;

      loadQueue.current = loadQueue.current
        .catch(() => undefined)
        .then(async () => {
          const feed = await fetchNextFeedItem({
            sessionId,
            subjectId,
            ...(knowledgeSourceId ? { knowledgeSourceId } : {}),
          });

          if (requestId !== feedRequestId.current) {
            return;
          }

          await applyFeedResponse(session, feed, sessionId);
        });

      return loadQueue.current;
    },
    [applyFeedResponse, subjectId, knowledgeSourceId]
  );

  const applySubmission = useCallback(
    async (
      session: StudySession,
      submission: RecordCardResponseResult,
      sessionId: StudySessionId
    ) => {
      if (submission.masteryDelta > 0) {
        masteryGainRef.current += submission.masteryDelta;
      }

      if (submission.nextFeed) {
        await applyFeedResponse(session, submission.nextFeed, sessionId);
      } else {
        await loadNext(sessionId, session);
      }
    },
    [applyFeedResponse, loadNext]
  );

  const prefetchCardSubmission = useCallback(
    async (
      cardKey: string,
      session: StudySession,
      item: FeedItem,
      answer: CardAnswerResult
    ) => {
      if (!subjectId) {
        return;
      }

      const existing = prefetchPromisesRef.current.get(cardKey);
      if (existing) {
        return existing;
      }

      const durationMs = Date.now() - cardStartedAt.current;
      const request = submitCardResponse({
        sessionId: session.id,
        cardId: item.card.id,
        atomId: item.atomId,
        outcome: answer.outcome,
        isCorrect: answer.isCorrect,
        responseTimeMs: durationMs,
        durationMs,
        feedPosition: item.position,
        includeNextFeed: true,
        ...(knowledgeSourceId ? { knowledgeSourceId } : {}),
      })
        .then((submission) => {
          if (readyFeedRef.current) {
            const activeKey = buildFeedCardKey(
              readyFeedRef.current.session.id,
              readyFeedRef.current.item
            );
            if (activeKey === cardKey) {
              prefetchedSubmissionRef.current = { cardKey, submission };
            }
          }
          return submission;
        })
        .finally(() => {
          prefetchPromisesRef.current.delete(cardKey);
        });

      prefetchPromisesRef.current.set(cardKey, request);
      return request;
    },
    [knowledgeSourceId, subjectId]
  );

  const registerAdvance = useCallback(
    (
      action: (() => void) | null,
      prefetchAnswer?: CardAnswerResult | null,
      inPlace = false
    ) => {
      advanceActionRef.current = action;
      advanceInPlaceRef.current = inPlace;
      setAdvanceReady(action !== null);

      const readyFeed = readyFeedRef.current;
      if (!action || !prefetchAnswer || !readyFeed || answering.current) {
        return;
      }

      const cardKey = buildFeedCardKey(readyFeed.session.id, readyFeed.item);
      prefetchedSubmissionRef.current = null;
      void prefetchCardSubmission(
        cardKey,
        readyFeed.session,
        readyFeed.item,
        prefetchAnswer
      );
    },
    [prefetchCardSubmission]
  );

  const bootstrap = useCallback(async () => {
    if (!subjectId || bootstrapStarted.current) {
      return;
    }

    bootstrapStarted.current = true;
    conceptsStudiedRef.current = new Map();
    masteryGainRef.current = 0;

    try {
      const storedScope = sessionStorage.getItem(CHAPTER_SCOPE_KEY) ?? "";
      const activeScope = knowledgeSourceId ?? "";
      if (storedScope !== activeScope) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.setItem(CHAPTER_SCOPE_KEY, activeScope);
      }

      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const sessionIdToResume = requestedSessionId ?? storedSessionId;

      if (sessionIdToResume) {
        try {
          const detail = await fetchSessionDetail(
            sessionIdToResume as StudySessionId
          );

          if (
            detail.status !== SessionStatus.Ended &&
            detail.session.subjectId === subjectId
          ) {
            if (detail.status === SessionStatus.Paused) {
              await resumeSession(sessionIdToResume as StudySessionId);
            }

            sessionStorage.setItem(SESSION_STORAGE_KEY, sessionIdToResume);
            await loadNext(
              sessionIdToResume as StudySessionId,
              detail.session
            );
            return;
          }
        } catch {
          // Sessione non valida: ne verrà creata una nuova.
        }

        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }

      const session = await createStudySession(subjectId);
      sessionStorage.setItem(SESSION_STORAGE_KEY, session.id);
      await loadNext(session.id, session);
    } catch (error) {
      bootstrapStarted.current = false;
      const message =
        error instanceof ApiError
          ? error.message
          : "Impossibile avviare la sessione di studio.";
      setState({
        status: "error",
        message,
        code: error instanceof ApiError ? error.code : undefined,
      });
    }
  }, [knowledgeSourceId, loadNext, requestedSessionId, setState, subjectId]);

  useEffect(() => {
    if (!subjectId || loadingSubject) {
      return;
    }

    const nextScope = buildFeedScopeKey(subjectId, knowledgeSourceId);
    const scopeChanged = shouldResetFeedForScopeChange(
      feedScopeRef.current,
      nextScope
    );

    if (!scopeChanged && bootstrapStarted.current) {
      return;
    }

    if (scopeChanged) {
      bootstrapStarted.current = false;
      feedRequestId.current += 1;
      setState({ status: "loading" });
    }

    feedScopeRef.current = nextScope;

    startTransition(() => {
      void bootstrap();
    });
  }, [bootstrap, knowledgeSourceId, loadingSubject, subjectId]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    readyFeedRef.current = { session: state.session, item: state.item };
  }, [state]);

  const handleAnswer = useCallback(async (answer: CardAnswerResult) => {
    if (state.status !== "ready" || answering.current) {
      return;
    }

    const { session, item } = state;
    const cardKey = buildFeedCardKey(session.id, item);
    const now = Date.now();
    const durationMs = now - cardStartedAt.current;
    const responseTimeMs = durationMs;

    answering.current = true;
    setSubmitting(true);
    advanceActionRef.current = null;
    advanceInPlaceRef.current = false;
    setAdvanceReady(false);

    const prefetched = prefetchedSubmissionRef.current;
    if (prefetched?.cardKey === cardKey) {
      prefetchedSubmissionRef.current = null;
      prefetchPromisesRef.current.delete(cardKey);

      try {
        await applySubmission(session, prefetched.submission, session.id);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message === "Errore interno."
              ? "Connessione lenta al server. Riprova tra qualche secondo."
              : error.message
            : "Errore durante l'invio della risposta.";
        setState({ status: "error", message });
      } finally {
        answering.current = false;
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      const inFlight = prefetchPromisesRef.current.get(cardKey);
      const submission = inFlight
        ? await inFlight
        : await submitCardResponse({
            sessionId: session.id,
            cardId: item.card.id,
            atomId: item.atomId,
            outcome: answer.outcome,
            isCorrect: answer.isCorrect,
            responseTimeMs,
            durationMs,
            feedPosition: item.position,
            includeNextFeed: true,
            ...(knowledgeSourceId ? { knowledgeSourceId } : {}),
          });

      prefetchPromisesRef.current.delete(cardKey);
      await applySubmission(session, submission, session.id);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message === "Errore interno."
            ? "Connessione lenta al server. Riprova tra qualche secondo."
            : error.message
          : "Errore durante l'invio della risposta.";
      setState({ status: "error", message });
    } finally {
      answering.current = false;
      setSubmitting(false);
    }
  }, [
    applySubmission,
    knowledgeSourceId,
    setAdvanceReady,
    setState,
    state,
  ]);

  const handleSwipeAdvance = useCallback((): boolean => {
    if (state.status !== "ready" || answering.current) {
      return false;
    }

    const inPlace = advanceInPlaceRef.current;
    advanceActionRef.current?.();
    return inPlace;
  }, [state]);

  const swipeEnabled =
    state.status === "ready" && !submitting && advanceReady;

  async function handleSkip() {
    await handleAnswer({
      outcome: SessionEventOutcome.Skipped,
      isCorrect: false,
    });
  }

  async function handlePause() {
    if (state.status !== "ready") {
      return;
    }

    try {
      await pauseSession(state.session.id);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Pause errors are non-blocking for navigation.
    }
  }

  async function handleEndSession() {
    if (state.status !== "ready") {
      return;
    }

    await finalizeSession(state.session.id);
  }

  function handleRetry() {
    bootstrapStarted.current = false;
    feedRequestId.current += 1;
    setState({ status: "loading" });
    void bootstrap();
  }

  const handleContinueAfterComplete = useCallback(async () => {
    if (!subjectId || continuing) {
      return;
    }

    setContinuing(true);

    try {
      const review = await fetchDailyReview(subjectId).catch(() => null);
      if (review && review.totalDue > 0) {
        const params = new URLSearchParams({ subjectId });
        router.push(`/review?${params.toString()}`);
        return;
      }

      bootstrapStarted.current = false;
      feedRequestId.current += 1;
      conceptsStudiedRef.current = new Map();
      masteryGainRef.current = 0;
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setState({ status: "loading" });
      await bootstrap();
    } finally {
      setContinuing(false);
    }
  }, [bootstrap, continuing, router, subjectId]);

  if (loadingSubject) {
    return <Loader label="Preparazione del feed..." />;
  }

  if (subjectError || !subjectId) {
    return (
      <EmptyState
        title="Feed non disponibile"
        description={subjectError ?? "Materia non disponibile."}
        action={
          <Link href="/home">
            <Button>Torna alla home</Button>
          </Link>
        }
      />
    );
  }

  if (state.status === "loading") {
    return <Loader label="Preparazione del feed..." />;
  }

  if (state.status === "error") {
    return (
      <EmptyState
        title="Feed non disponibile"
        description={state.message}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleRetry}>
              Riprova
            </Button>
            <Link href="/home">
              <Button>Torna alla home</Button>
            </Link>
          </div>
        }
      />
    );
  }

  if (state.status === "complete") {
    return (
      <SessionComplete
        summary={state.summary}
        onContinue={handleContinueAfterComplete}
        continuing={continuing}
      />
    );
  }

  const { item } = state;
  const progressPercent = Math.min(100, Math.round(item.sessionProgress * 100));
  const cardKey = buildFeedCardKey(item.sessionId, item);
  const feedCardKey = cardKey;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        className="h-0.5 w-full bg-border"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso sessione"
      >
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <header className="feed-safe-top flex shrink-0 items-center gap-3 px-4 pb-2 pt-1">
        <Link href="/home" onClick={() => void handlePause()} aria-label="Pausa e torna alla home">
          <IconButton label="Esci dalla sessione">
            <ChevronRightIcon className="rotate-180" />
          </IconButton>
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-foreground">
          {item.atomTitle}
        </p>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-muted transition-colors hover:text-foreground"
          disabled={submitting}
          onClick={() => void handleEndSession()}
        >
          Fine
        </button>
      </header>

      <FeedSwipeSurface
        key={feedCardKey}
        enabled={swipeEnabled}
        onAdvance={handleSwipeAdvance}
      >
        <FeedCardStage cardKey={cardKey}>
          <FeedCardRenderer
            card={item.card}
            atomId={item.atomId}
            atomTitle={item.atomTitle}
            imageUrl={item.imageUrl}
            imageCaption={item.imageCaption}
            disabled={submitting}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
            registerAdvance={registerAdvance}
          />
        </FeedCardStage>
      </FeedSwipeSurface>

      <footer className="feed-safe-bottom shrink-0 px-4 pt-2 text-center">
        <p className="text-xs text-muted">
          {submitting
            ? "\u00a0"
            : swipeEnabled
              ? "Scorri verso l'alto per continuare"
              : "\u00a0"}
        </p>
      </footer>
    </div>
  );
}
