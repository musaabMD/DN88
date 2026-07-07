"use client";

import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { exams, getSetsByExam } from "@/lib/data";
import SearchBox from "@/components/SearchBox";
import ExamCard from "@/components/ExamCard";
import SetCard from "@/components/SetCard";

export default function HomePage() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const filteredExams = useMemo(() => {
    const q = search.toLowerCase();
    return exams.filter((e) => e.title.toLowerCase().includes(q));
  }, [search]);

  const filteredSets = useMemo(() => {
    if (!selectedExamId) return [];
    const q = search.toLowerCase();
    return getSetsByExam(selectedExamId).filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.user.username.toLowerCase().includes(q)
    );
  }, [selectedExamId, search]);

  const handleBack = () => {
    setSelectedExamId(null);
    setSearch("");
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setSearch("");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-6">
      {!selectedExam ? (
        <>
          <h1 className="mb-6 text-center text-2xl font-extrabold text-foreground">
            Pick an exam
          </h1>
          <div className="mb-6">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search exams..."
            />
          </div>
          <div className="flex flex-col gap-4">
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onSelect={handleSelectExam}
              />
            ))}
            {filteredExams.length === 0 && (
              <p className="text-center text-sm font-semibold text-muted">
                No exams found
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-sm font-bold text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mb-6 text-center text-2xl font-extrabold text-foreground">
            {selectedExam.title}
          </h1>
          <div className="mb-6">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search sets..."
            />
          </div>
          <div className="flex flex-col gap-5">
            {filteredSets.map((set) => (
              <SetCard key={set.id} set={set} examId={selectedExamId!} />
            ))}
            {filteredSets.length === 0 && (
              <p className="text-center text-sm font-semibold text-muted">
                No sets found
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
