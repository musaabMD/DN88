"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentShell } from "@/components/ContentShell";
import { QuizSetScreen } from "@/components/QuizSetScreen";
import { ReportSheet } from "@/components/ReportSheet";
import FlashcardDeck, {
  type CardReviewFilter,
} from "@/components/content/FlashcardDeck";
import FlashcardStudy from "@/components/content/FlashcardStudy";
import HYImages from "@/components/content/HYImages";
import HYNotesFeed from "@/components/content/HYNotesFeed";
import { useLiveSet } from "@/hooks/useLiveSet";
import { useLiveSetStats } from "@/hooks/useLiveSetStats";
import { useSessionItems } from "@/hooks/useSessionItems";
import { toQuizSetScreenData } from "@/lib/mock-data";
import { examTabPath, type ContentTab } from "@/lib/routes";
import {
  resolveSessionSetId,
  resolveSessionTab,
  type FlashcardItem,
  type ImageItem,
  type NoteItem,
} from "@/lib/set-content";

export function SetDetailClient({
  examId,
  tab,
  setId,
}: {
  examId: string;
  tab: ContentTab;
  setId: string;
}) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashcardItem[]>([]);

  const { set, loading: setLoading } = useLiveSet(examId, tab, setId);
  const { stats } = useLiveSetStats(setId);

  const contentTab = set ? resolveSessionTab(tab, set) : tab;
  const contentSetId = set ? resolveSessionSetId(tab, set) : setId;
  const { items, loading: itemsLoading } = useSessionItems(contentTab, contentSetId);

  const screenData = useMemo(() => {
    if (!set) return null;
    const base = toQuizSetScreenData(set, tab);
    if (!stats) return base;
    return {
      ...base,
      items: stats.items || base.items,
      progress: stats.progress,
      best: stats.best,
      incorrectCount: stats.incorrectCount,
      flaggedCount: stats.flaggedCount,
      readinessPct: stats.readinessPct,
    };
  }, [set, tab, stats]);

  const backToBrowse = () => router.push(examTabPath(examId, tab));

  if (setLoading || itemsLoading) {
    return (
      <ContentShell examId={examId} title="Loading…" onBack={backToBrowse}>
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading set…</div>
      </ContentShell>
    );
  }

  if (!set || !screenData) {
    return (
      <ContentShell examId={examId} title="Not found" onBack={backToBrowse}>
        <div className="py-16 text-center">
          <p className="mb-2 font-bold text-slate-800">Set not found</p>
          <button
            onClick={backToBrowse}
            className="text-sm font-semibold text-indigo-600"
          >
            Back to sets
          </button>
        </div>
      </ContentShell>
    );
  }

  if (contentTab === "summary") {
    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        <HYNotesFeed notes={items as NoteItem[]} />
      </ContentShell>
    );
  }

  if (contentTab === "images") {
    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        <HYImages images={items as ImageItem[]} />
      </ContentShell>
    );
  }

  if (contentTab === "flashcards") {
    const cards = items as FlashcardItem[];

    if (studying) {
      return (
        <FlashcardStudy
          cards={studyCards}
          onClose={() => setStudying(false)}
        />
      );
    }

    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        <FlashcardDeck
          set={set}
          cards={cards}
          onStart={(_filter: CardReviewFilter, deckCards: FlashcardItem[]) => {
            setStudyCards(deckCards);
            setStudying(true);
          }}
        />
      </ContentShell>
    );
  }

  return (
    <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
      <QuizSetScreen
        examId={examId}
        tab={tab}
        setId={setId}
        data={screenData}
        onReport={() => setReportOpen(true)}
      />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </ContentShell>
  );
}
