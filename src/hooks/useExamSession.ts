"use client";

import { useEffect, useState } from "react";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import type { QuizSearchParams } from "@/lib/routes";
import type { StudySet } from "@/lib/set-content";
import type { QuestionItem } from "@/lib/set-content";
import { prepareExamSession, type ExamSessionMeta } from "@/lib/qbank/exam-session";
import { isLiveSetId } from "@/lib/qbank/live-data";

export function useExamSession(
  set: StudySet,
  examId: string,
  quizParams: QuizSearchParams
) {
  const clerkEnabled = useClerkEnabled();
  const shouldUse = isLiveSetId(set.id) && clerkEnabled && isClerkSignedIn();
  const [liveQuestions, setLiveQuestions] = useState<QuestionItem[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [meta, setMeta] = useState<ExamSessionMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = quizParams.mode ?? "restart";
  const count = quizParams.count;
  const minutes = quizParams.minutes;

  useEffect(() => {
    if (!shouldUse) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getClerkToken();
        if (!token) return;
        const result = await prepareExamSession(token, { set, examId, quizParams });
        if (cancelled) return;
        setLiveQuestions(result.questions);
        setSessionId(result.sessionId);
        setMeta(result.meta);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to start session");
          setLiveQuestions(null);
          setSessionId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldUse, set.id, set.title, set.done, examId, mode, count, minutes]);

  return {
    liveQuestions: shouldUse ? liveQuestions : null,
    sessionId: shouldUse ? sessionId : null,
    meta: shouldUse ? meta : null,
    loading: shouldUse && loading,
    error: shouldUse ? error : null,
    isLiveSession: shouldUse && liveQuestions !== null && liveQuestions.length > 0,
  };
}
