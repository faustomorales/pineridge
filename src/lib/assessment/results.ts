import type { UfliLessonResource } from "$lib/resources";

import type { DemonstratedGap } from "./engine";

export interface Recommendation {
  lesson: string;
  concept: string;
  kind: "concept" | "review";
  isStartingPoint: boolean;
  resource: UfliLessonResource | null;
}

const reviewCoverage = [
  { lesson: "19", first: 1, last: 18 },
  { lesson: "41a", first: 20, last: 40.3 },
  { lesson: "49", first: 42, last: 48 },
  { lesson: "53", first: 42, last: 52 },
  { lesson: "59", first: 54, last: 58 },
  { lesson: "71", first: 69, last: 70 },
  { lesson: "76", first: 69, last: 75 },
  { lesson: "79", first: 77, last: 78 },
  { lesson: "83", first: 77, last: 82 },
  { lesson: "88", first: 84, last: 87 },
  { lesson: "92", first: 84, last: 91 },
  { lesson: "97", first: 84, last: 96 },
  { lesson: "106", first: 99, last: 105 },
  { lesson: "128", first: 111, last: 127 },
] as const;

export function lessonOrder(lesson: string): number {
  return Number.parseFloat(
    lesson.replace(
      /[a-z]$/,
      (letter) => `.${letter.charCodeAt(0) - 96}`,
    ),
  );
}

export function buildRecommendations(
  gaps: readonly DemonstratedGap[],
  lessons: readonly UfliLessonResource[],
): Recommendation[] {
  const sortedGaps = [...gaps].sort(
    (left, right) => lessonOrder(left.lesson) - lessonOrder(right.lesson),
  );
  if (sortedGaps.length === 0) return [];

  const byLesson = new Map(lessons.map((lesson) => [lesson.lesson, lesson]));
  const recommendations: Recommendation[] = sortedGaps.slice(0, 2).map((gap) => ({
    lesson: gap.lesson,
    concept: gap.concept,
    kind: "concept",
    isStartingPoint: gap === sortedGaps[0],
    resource: byLesson.get(gap.lesson) ?? null,
  }));

  const matchingReview = reviewCoverage.find((review) => {
    const coveredGapCount = sortedGaps.filter((gap) => {
      const order = lessonOrder(gap.lesson);
      return order >= review.first && order <= review.last;
    }).length;
    return coveredGapCount >= 2;
  });

  if (matchingReview && recommendations.length < 3) {
    const resource = byLesson.get(matchingReview.lesson) ?? null;
    recommendations.push({
      lesson: matchingReview.lesson,
      concept: resource?.concept ?? "Review",
      kind: "review",
      isStartingPoint: false,
      resource,
    });
  }

  for (const gap of sortedGaps.slice(2)) {
    if (recommendations.length >= 3) break;
    recommendations.push({
      lesson: gap.lesson,
      concept: gap.concept,
      kind: "concept",
      isStartingPoint: false,
      resource: byLesson.get(gap.lesson) ?? null,
    });
  }

  return recommendations.sort(
    (left, right) => lessonOrder(left.lesson) - lessonOrder(right.lesson),
  );
}
