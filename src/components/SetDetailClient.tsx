"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContentShell } from "@/components/ContentShell";
import { QuizSetScreen } from "@/components/QuizSetScreen";
import { ReportSheet } from "@/components/ReportSheet";
import FlashcardDeck, {
  type CardReviewFilter,
} from "@/components/content/FlashcardDeck";
import FlashcardStudy from "@/components/content/FlashcardStudy";
import HYImages from "@/components/content/HYImages";
import HYNotesFeed from "@/components/content/HYNotesFeed";
import { getSetById, toQuizSetScreenData } from "@/lib/mock-data";
import { examTabPath, type ContentTab } from "@/lib/routes";
import {
  getSessionItems,
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

  const set = getSetById(tab, setId)!;
  const contentTab = resolveSessionTab(tab, set);
  const contentSetId = resolveSessionSetId(tab, set);
  const sessionItems = getSessionItems(contentTab, contentSetId);
  const backToBrowse = () => router.push(examTabPath(examId, tab));

  if (contentTab === "summary") {
    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        <HYNotesFeed notes={sessionItems as NoteItem[]} />
      </ContentShell>
    );
  }

  if (contentTab === "images") {
    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        <HYImages images={sessionItems as ImageItem[]} />
      </ContentShell>
    );
  }

  if (contentTab === "flashcards") {
    const cards = sessionItems as FlashcardItem[];
    return (
      <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
        {studying ? (
          <FlashcardStudy
            cards={studyCards}
            onClose={() => setStudying(false)}
          />
        ) : (
          <FlashcardDeck
            set={set}
            cards={cards}
            onStart={(_filter: CardReviewFilter, deckCards: FlashcardItem[]) => {
              setStudyCards(deckCards);
              setStudying(true);
            }}
          />
        )}
      </ContentShell>
    );
  }

  return (
    <ContentShell examId={examId} title={set.title} onBack={backToBrowse}>
      <QuizSetScreen
        examId={examId}
        tab={tab}
        setId={setId}
        data={toQuizSetScreenData(set, tab)}
        onReport={() => setReportOpen(true)}
      />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </ContentShell>
  );
}
