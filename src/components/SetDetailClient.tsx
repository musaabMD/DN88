"use client";

import { useState } from "react";
import { QuizSetScreen } from "@/components/QuizSetScreen";
import { ReportSheet } from "@/components/ReportSheet";
import { DrNoteShell } from "@/components/DrNoteShell";
import FlashcardDeck, {
  type CardReviewFilter,
} from "@/components/content/FlashcardDeck";
import FlashcardStudy from "@/components/content/FlashcardStudy";
import HYImages from "@/components/content/HYImages";
import HYNotesFeed from "@/components/content/HYNotesFeed";
import { getSetById, toQuizSetScreenData } from "@/lib/mock-data";
import { type ContentTab } from "@/lib/routes";
import {
  getSessionItems,
  resolveSessionSetId,
  resolveSessionTab,
  type FlashcardItem,
  type ImageItem,
  type NoteItem,
  type QuestionItem,
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
  const [reportOpen, setReportOpen] = useState(false);
  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashcardItem[]>([]);

  const set = getSetById(tab, setId)!;
  const contentTab = resolveSessionTab(tab, set);
  const contentSetId = resolveSessionSetId(tab, set);
  const sessionItems = getSessionItems(contentTab, contentSetId);

  if (contentTab === "summary") {
    return (
      <DrNoteShell examId={examId} activeTab={tab}>
        <HYNotesFeed notes={sessionItems as NoteItem[]} />
      </DrNoteShell>
    );
  }

  if (contentTab === "images") {
    return (
      <DrNoteShell examId={examId} activeTab={tab}>
        <HYImages images={sessionItems as ImageItem[]} />
      </DrNoteShell>
    );
  }

  if (contentTab === "flashcards") {
    const cards = sessionItems as FlashcardItem[];
    return (
      <DrNoteShell examId={examId} activeTab={tab}>
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
      </DrNoteShell>
    );
  }

  return (
    <DrNoteShell examId={examId} activeTab={tab}>
      <QuizSetScreen
        examId={examId}
        tab={tab}
        setId={setId}
        data={toQuizSetScreenData(set, tab)}
        onReport={() => setReportOpen(true)}
      />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </DrNoteShell>
  );
}
