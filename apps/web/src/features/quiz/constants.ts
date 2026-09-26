import type { Difficulty } from "@mongo/quiz";

export const STORAGE_KEY = "mongo-quiz-progress";

export const DIFFICULTY_ORDER: readonly Difficulty[] = ["easy", "moderate", "difficult"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  difficult: "Difficult",
};

export type DifficultyBadgeVariant = "success" | "warning" | "danger";

export const DIFFICULTY_BADGE: Record<Difficulty, DifficultyBadgeVariant> = {
  easy: "success",
  moderate: "warning",
  difficult: "danger",
};

export const COUNT_PRESETS: readonly number[] = [5, 10, 15, 30];
