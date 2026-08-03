"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FeedItem } from "@/domain/entities/feed-item";
import type { StudySession } from "@/domain/entities/study-session";
import { SessionEventOutcome } from "@/domain/enums";
import type { KnowledgeSourceId, StudySessionId } from "@/domain/ids";
import {
  ApiError,
  createStudySession,
  endSession,
  fetchNextFeedItem,
  fetchSessionDetail,
  pauseSession,
  submitCardResponse,
} from "@/lib/api";
import { useActiveSubjectId } from "@/hooks";
import { SessionStatus } from "@/session/types";
import {
  Badge,
  Button,
  EmptyState,
  Loader,
  ProgressBar,
} from "@/components/ui";
import { FeedCardRenderer } from "./feed-card-renderer";
import { getCardTypeLabel } from "./card-utils";
import type { CardAnswerResult } from "./card-utils";

const SESSION_STORAGE_KEY = "mentis.activeSessionId";
const CHAPTER_SCOPE_KEY = "mentis.activeKnowledgeSourceId";

type FeedState =
  | { status: "loading" }
  | { status: "ready"; session: StudySession; item: FeedItem }
  | { status: "complete"; session: StudySession }
  | { status: "error"; message: string; code?: string };

export function FeedStudy() {
  const searchParams = useSearchParams();
  const knowledgeSourceId = searchParams.get(
    "knowledgeSourceId"
  ) as KnowledgeSourceId | null;
  const { subjectId, loading: loadingSubject, error: subjectError } =
    useActiveSubjectId();
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const cardStartedAt = useRef<number>(0);
  const feedRequestId = useRef(0);
  const loadQueue = useRef<Promise<void>>(Promise.resolve());
  const bootstrapStarted = useRef(false);
  const answering = useRef(false);

  const applyFeedItem = useCallback(
    (session: StudySession | undefined, item: FeedItem) => {
      cardStartedAt.current = Date.now();
      setState({
        status: "ready",
        session: session ?? ({ id: item.sessionId } as StudySession),
        item,
      });
    },
    []
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
        });

      return loadQueue.current;
    },
    [applyFeedItem, subjectId, knowledgeSourceId]
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

      if (storedSessionId) {
        try {
          const detail = await fetchSessionDetail(
            storedSessionId as StudySessionId
          );

          if (
            detail.status === SessionStatus.Active &&
            detail.session.subjectId === subjectId
          ) {
            await loadNext(storedSessionId as StudySessionId, detail.session);
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
  }, [knowledgeSourceId, loadNext, subjectId]);

  useEffect(() => {
    if (!subjectId || loadingSubject) {
      return;
    }

    startTransition(() => {
      void bootstrap();
    });
  }, [bootstrap, loadingSubject, subjectId]);

  async function handleAnswer(result: CardAnswerResult) {
    if (state.status !== "ready" || submitting || answering.current) {
      return;
    }

    const { session, item } = state;
    const now = Date.now();
    const durationMs = now - cardStartedAt.current;
    const responseTimeMs = durationMs;

    answering.current = true;

    try {
      setSubmitting(true);
      await submitCardResponse({
        sessionId: session.id,
        cardId: item.card.id,
        atomId: item.atomId,
        outcome: result.outcome,
        isCorrect: result.isCorrect,
        responseTimeMs,
        durationMs,
        feedPosition: item.position,
      });

      await loadNext(session.id, session);
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
  }

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
  const progressPercent = Math.round(item.sessionProgress * 100);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{getCardTypeLabel(item.card.type)}</Badge>
          <Badge>{item.atomTitle}</Badge>
          {item.masteryBefore !== null ? (
            <Badge variant="default">Mastery {item.masteryBefore}%</Badge>
          ) : null}
        </div>
        <ProgressBar value={progressPercent} label="Progresso sessione" />
      </div>

      <FeedCardRenderer
        key={`${item.sessionId}-${item.card.id}-${item.position}`}
        card={item.card}
        atomId={item.atomId}
        atomTitle={item.atomTitle}
        imageUrl={item.imageUrl}
        disabled={submitting}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/home" onClick={() => void handlePause()}>
          <Button variant="secondary" disabled={submitting}>
            Pausa
          </Button>
        </Link>
        <Button
          variant="ghost"
          disabled={submitting}
          onClick={() => void handleEndSession()}
        >
          Termina sessione
        </Button>
      </div>
    </div>
  );
}
