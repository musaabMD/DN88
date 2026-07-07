"use client";

import { useState, useMemo } from "react";
import { BookOpen, HelpCircle, Plus } from "lucide-react";
import type { SetType } from "@/lib/types";
import SearchBox from "@/components/SearchBox";
import UserAvatar from "@/components/UserAvatar";

interface AddedSet {
  id: string;
  title: string;
  type: SetType;
  user: { username: string; avatarColor: string };
}

const initialSets: AddedSet[] = [
  {
    id: "1",
    title: "My Anatomy Notes",
    type: "learning",
    user: { username: "you", avatarColor: "#1B8AE6" },
  },
  {
    id: "2",
    title: "Quick Pharm Quiz",
    type: "mcq",
    user: { username: "you", avatarColor: "#1B8AE6" },
  },
];

export default function AddPage() {
  const [search, setSearch] = useState("");
  const [sets, setSets] = useState<AddedSet[]>(initialSets);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<SetType>("mcq");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.user.username.toLowerCase().includes(q)
    );
  }, [sets, search]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    setSets((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        type: newType,
        user: { username: "you", avatarColor: "#1B8AE6" },
      },
    ]);
    setNewTitle("");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-6">
      <h1 className="mb-6 text-center text-2xl font-extrabold text-foreground">
        Add a set
      </h1>

      <div className="mb-6">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search your sets..."
        />
      </div>

      <div className="card-shadow mb-6 rounded-3xl bg-card p-5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Set title..."
          className="mb-3 w-full rounded-2xl bg-primary-light px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setNewType("mcq")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition ${
              newType === "mcq"
                ? "bg-primary text-white"
                : "bg-primary-light text-primary"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            MCQs
          </button>
          <button
            onClick={() => setNewType("learning")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition ${
              newType === "learning"
                ? "bg-primary text-white"
                : "bg-primary-light text-primary"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Learning
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((set) => (
          <div
            key={set.id}
            className="card-shadow flex items-center gap-3 rounded-2xl bg-card p-4"
          >
            {set.type === "mcq" ? (
              <HelpCircle className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-extrabold">{set.title}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <UserAvatar user={set.user} />
                <span className="text-xs font-semibold text-muted">
                  @{set.user.username}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm font-semibold text-muted">
            No sets found
          </p>
        )}
      </div>
    </div>
  );
}
