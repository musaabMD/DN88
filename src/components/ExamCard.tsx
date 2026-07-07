"use client";

import { GraduationCap } from "lucide-react";
import type { Exam } from "@/lib/types";

interface ExamCardProps {
  exam: Exam;
  onSelect: (examId: string) => void;
}

export default function ExamCard({ exam, onSelect }: ExamCardProps) {
  return (
    <button
      onClick={() => onSelect(exam.id)}
      className="card-shadow flex w-full items-center gap-4 rounded-3xl bg-card p-5 text-left transition active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light">
        <GraduationCap className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-extrabold text-foreground">{exam.title}</h3>
    </button>
  );
}
