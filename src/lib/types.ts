export type SetType = "mcq" | "learning";

export interface Exam {
  id: string;
  title: string;
}

export interface User {
  username: string;
  avatarColor: string;
}

export interface LearnItem {
  id: string;
  title: string;
  content: string;
}

export interface McqItem {
  id: string;
  question: string;
  options: string[];
  answer: number;
}

export interface ReviewItem {
  id: string;
  prompt: string;
  answer: string;
}

export interface StudySet {
  id: string;
  examId: string;
  title: string;
  type: SetType;
  user: User;
  progress: number;
  score: number;
  rating: number;
  pinned: boolean;
  learnItems: LearnItem[];
  mcqItems: McqItem[];
  reviewItems: ReviewItem[];
}

export type ViewMode = "one" | "all";
export type DetailTab = "learn" | "mcqs" | "review";
