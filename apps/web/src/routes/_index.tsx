import { countByDifficulty } from "@mongo/quiz/problems";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";
import { buttonVariants } from "@mongo/ui/components/button";
import { Link } from "react-router";

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MongoDB Query Practice" },
    {
      name: "description",
      content:
        "Translate SQL into MongoDB shell syntax and get structural, per-rubric feedback on every query.",
    },
  ];
}

export default function Home() {
  const counts = countByDifficulty();

  return (
    <div className="container mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="type-display">MongoDB Query Practice</h1>
        <p className="type-body max-w-2xl text-muted-foreground">
          Read a real-world task and its SQL equivalent, then write the MongoDB shell statement that
          does the same job. Submissions are graded on the structure of the query you wrote — the
          collection, method, filter, projection and update operators — so you get feedback on the
          query itself, not just on a result set.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["easy", "moderate", "difficult"] as const).map((difficulty, index) => (
          <Card
            key={difficulty}
            size="sm"
            className="animate-materialize depth-1"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardHeader>
              <CardTitle className="type-overline text-muted-foreground capitalize">
                {difficulty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="type-title tabular-nums">{counts[difficulty]}</span>
              <span className="type-caption ml-1.5 text-muted-foreground">problems</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Link to="/quiz" className={buttonVariants({ size: "lg" })}>
          Start practicing
        </Link>
      </div>
    </div>
  );
}
