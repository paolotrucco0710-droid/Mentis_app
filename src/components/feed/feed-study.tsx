"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FeedItem, FeedResponse } from "@/domain/entities/feed-item";
import type { StudySession } from "@/domain/entities/study-session";
import { CardType, SessionEventOutcome } from "@/domain/enums";
import type { KnowledgeSourceId, StudySessionId } from "@/domain/ids";
import {
  ApiError,
  createStudySession,
  endSession,
  fetchNextFeedItem,
  fetchSessionDetail,
  pauseSession,
  resumeSession,
  submitCardResponse,
} from "@/lib/api";
import { useActiveSubjectId, useSwipeUp } from "@/hooks";
import { SessionStatus } from "@/session/types";
import { Button, EmptyState, Loader } from "@/components/ui";
import { IconButton } from "@/components/ui";
import { ChevronRightIcon } from "@/components/ui/icons";
import { FeedCardRenderer } from "./feed-card-renderer";
import { FeedCardStage } from "./feed-card-stage";
import type { CardAnswerResult } from "./card-utils";

const SESSION_STORAGE_KEY = "mentis.activeSessionId";
const CHAPTER_SCOPE_KEY = "mentis.activeKnowledgeSourceId";

type FeedState =
  | { status: "loading" }
  | { status: "ready"; session: StudySession; item: FeedItem }
  | { status: "complete"; session: StudySession }
  | { status: "error"; message: string; code?: string };

function allowsSwipeWithoutAdvance(type: CardType): boolean {
  return type === CardType.Explain;
}

export function FeedStudy() {
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
  const [advanceReady, setAdvanceReady] = useState(false);
  const cardStartedAt = useRef<number>(0);
  const feedRequestId = useRef(0);
  const loadQueue = useRef<Promise<void>>(Promise.resolve());
  const bootstrapStarted = useRef(false);
  const answering = useRef(false);
  const advanceActionRef = useRef<(() => void) | null>(null);

  const registerAdvance = useCallback((action: (() => void) | null) => {
    advanceActionRef.current = action;
    setAdvanceReady(action !== null);
  }, []);

  const applyFeedItem = useCallback(
    (session: StudySession | undefined, item: FeedItem) => {
      cardStartedAt.current = Date.now();
      advanceActionRef.current = null;
      setAdvanceReady(false);
      setState({
        status: "ready",
        session: session ?? ({ id: item.sessionId } as StudySession),
        item,
      });
    },
    []
  );

  const applyFeedResponse = useCallback(
    (
      session: StudySession | undefined,
      feed: FeedResponse,
      sessionId: StudySessionId
    ) => {
      if (!feed.item || feed.sessionComplete) {
        setState({
          status: "complete",
          session:
            session ??
            ({
              id: sessionId,
            } as StudySession),
        });
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      applyFeedItem(session, feed.item);
    },
    [applyFeedItem]
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

          applyFeedResponse(session, feed, sessionId);
        });

      return loadQueue.current;
    },
    [applyFeedResponse, subjectId, knowledgeSourceId]
  );

  const bootstrap = useCallback(async () => {
    if (!subjectId || bootstrapStarted.current) {
      return;
    }

    bootstrapStarted.current = true;

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
  }, [knowledgeSourceId, loadNext, requestedSessionId, subjectId]);

  useEffect(() => {
    if (!subjectId || loadingSubject) {
      return;
    }

    startTransition(() => {
      void bootstrap();
    });
  }, [bootstrap, loadingSubject, subjectId]);

  const handleAnswer = useCallback(async (answer: CardAnswerResult) => {
    if (state.status !== "ready" || submitting || answering.current) {
      return;
    }

    const { session, item } = state;
    const now = Date.now();
    const durationMs = now - cardStartedAt.current;
    const responseTimeMs = durationMs;

    answering.current = true;
    advanceActionRef.current = null;
    setAdvanceReady(false);

    try {
      setSubmitting(true);
      const submission = await submitCardResponse({
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

      if (submission.nextFeed) {
        applyFeedResponse(session, submission.nextFeed, session.id);
      } else {
        await loadNext(session.id, session);
      }
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
  }, [applyFeedResponse, knowledgeSourceId, loadNext, state, submitting]);

  const handleSwipeAdvance = useCallback(() => {
    if (state.status !== "ready" || submitting) {
      return;
    }

    if (advanceActionRef.current) {
      advanceActionRef.current();
      return;
    }

    if (allowsSwipeWithoutAdvance(state.item.card.type)) {
      void handleAnswer({
        outcome: SessionEventOutcome.Neutral,
        isCorrect: true,
      });
    }
  }, [handleAnswer, state, submitting]);

  const swipeEnabled =
    state.status === "ready" &&
    !submitting &&
    (advanceReady || allowsSwipeWithoutAdvance(state.item.card.type));

  const swipeHandlers = useSwipeUp(handleSwipeAdvance, swipeEnabled);

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

    try {
      await endSession(state.session.id);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setState({ status: "complete", session: state.session });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Impossibile chiudere la sessione.";
      setState({ status: "error", message });
    }
  }

  function handleRetry() {
    bootstrapStarted.current = false;
    feedRequestId.current += 1;
    setState({ status: "loading" });
    void bootstrap();
  }

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
      <EmptyState
        title="Sessione completata"
        description="Ottimo lavoro! Hai completato questa sessione di studio."
        action={
          <Link href="/home">
            <Button>Torna alla home</Button>
          </Link>
        }
      />
    );
  }

  const { item } = state;
  const progressPercent = Math.min(100, Math.round(item.sessionProgress * 100));
  const cardKey = `${item.sessionId}-${item.card.id}-${item.position}`;

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

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4"
        {...swipeHandlers}
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
      </div>

      <footer className="feed-safe-bottom shrink-0 px-4 pt-2 text-center">
        <p className="text-xs text-muted">
          {submitting
            ? "Caricamento..."
            : swipeEnabled
              ? "Scorri verso l'alto per continuare"
              : "\u00a0"}
        </p>
      </footer>
    </div>
  );
}
