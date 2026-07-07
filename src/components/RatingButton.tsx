"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";

interface RatingButtonProps {
  initialRating: number;
}

export default function RatingButton({ initialRating }: RatingButtonProps) {
  const [rating, setRating] = useState(initialRating);
  const [voted, setVoted] = useState(false);

  const handleVote = () => {
    if (!voted) {
      setRating((r) => r + 1);
      setVoted(true);
    }
  };

  return (
    <button
      onClick={handleVote}
      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2.5 py-1.5 transition ${
        voted
          ? "border-primary bg-primary-light text-primary"
          : "border-gray-200 bg-white text-muted hover:border-primary/30"
      }`}
    >
      <ChevronUp className={`h-4 w-4 ${voted ? "text-primary" : ""}`} />
      <span className="text-xs font-bold">{rating}</span>
    </button>
  );
}
