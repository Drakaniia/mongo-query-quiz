import { QuizPage } from "@/features/quiz/quiz-page";

import type { Route } from "./+types/quiz";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MongoDB Practice Quiz" },
    {
      name: "description",
      content: "Practice MongoDB find and update queries with structural, per-rubric feedback.",
    },
  ];
}

export default function Quiz() {
  return (
    <div className="h-full min-h-0">
      <QuizPage />
    </div>
  );
}
