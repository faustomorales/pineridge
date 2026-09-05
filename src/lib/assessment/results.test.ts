import { describe, expect, it } from "vitest";

import { ufliResourceManifest } from "$lib/resources";
import { assessmentContent } from "./content";
import type { DemonstratedGap } from "./engine";
import { buildEvidenceRecommendation, buildRecommendations } from "./results";

const gap = (lesson: string): DemonstratedGap => ({
  bandId: "digraphs",
  probeId: `lesson-${lesson}`,
  lesson,
  concept: `Concept ${lesson}`,
});

describe("Tutor Result recommendations", () => {
  it("chooses Lesson 5 when correct words evidence Lessons 1 through 4", () => {
    const band = assessmentContent.bands[0];
    const responses = [
      {
        correct: true,
        bandId: band.id,
        stage: "focus" as const,
        groupId: "lesson-1",
        word: { id: "am", text: "am", kind: "real" as const, lessons: ["1", "2"] },
      },
      {
        correct: true,
        bandId: band.id,
        stage: "focus" as const,
        groupId: "lesson-3",
        word: { id: "sat", text: "sat", kind: "real" as const, lessons: ["1", "2", "3", "4"] },
      },
    ];

    expect(
      buildEvidenceRecommendation(responses, [band], ufliResourceManifest.lessons),
    ).toMatchObject({ lesson: "5", isStartingPoint: true });
  });

  it("stars the earliest concept and adds a review when gaps span its concepts", () => {
    const recommendations = buildRecommendations(
      [gap("44"), gap("42"), gap("43")],
      ufliResourceManifest.lessons,
    );

    expect(recommendations.map((item) => item.lesson)).toEqual([
      "42",
      "43",
      "49",
    ]);
    expect(recommendations.map((item) => item.kind)).toEqual([
      "concept",
      "concept",
      "review",
    ]);
    expect(recommendations[0].isStartingPoint).toBe(true);
    expect(recommendations[2].resource?.concept).toBe("Digraphs Review 1");
  });

  it("returns only observed concept gaps when no review spans them", () => {
    const recommendations = buildRecommendations(
      [gap("7"), gap("44"), gap("84")],
      ufliResourceManifest.lessons,
    );

    expect(recommendations.map((item) => item.lesson)).toEqual([
      "7",
      "44",
      "84",
    ]);
    expect(recommendations.every((item) => item.kind === "concept")).toBe(true);
  });
});
