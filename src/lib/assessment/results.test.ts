import { describe, expect, it } from "vitest";

import { ufliResourceManifest } from "$lib/resources";
import { assessmentContent } from "./content";
import type { DemonstratedGap } from "./engine";
import { buildEvidenceRecommendation, buildEvidenceSummary, buildRecommendations } from "./results";

const gap = (lesson: string): DemonstratedGap => ({
  bandId: "digraphs",
  probeId: `lesson-${lesson}`,
  lesson,
  concept: `Concept ${lesson}`,
});

describe("Tutor Result recommendations", () => {
  it("brackets Lesson 9 evidence with the first observed Lesson 42 gap", () => {
    const fin = assessmentContent.bands[0].checkpointGroups[0].find(
      (word) => word.text === "fin",
    )!;
    const summary = buildEvidenceSummary(
      [{ correct: true, bandId: "short-vowels", stage: "checkpoint", groupId: "short-vowels-0", word: fin }],
      [gap("42")],
      assessmentContent.bands,
      ufliResourceManifest.lessons,
    );

    expect(summary.demonstrated?.lesson).toBe("9");
    expect(summary.firstGap?.lesson).toBe("42");
  });

  it("chooses Lesson 5 when correct words evidence Lessons 1 through 4", () => {
    const band = assessmentContent.bands[0];
    const responses = [
      {
        correct: true,
        bandId: band.id,
        stage: "focus" as const,
        groupId: "lesson-1",
        word: { id: "am", text: "am", kind: "real" as const, requirements: ["1", "2"], evidenceFor: ["5"] },
      },
      {
        correct: true,
        bandId: band.id,
        stage: "focus" as const,
        groupId: "lesson-3",
        word: { id: "sat", text: "sat", kind: "real" as const, requirements: ["1", "2", "3", "4"], evidenceFor: ["5"] },
      },
    ];

    expect(
      buildEvidenceRecommendation(responses, [band], ufliResourceManifest.lessons),
    ).toMatchObject({ lesson: "5", isStartingPoint: true });
  });

  it("chooses Lesson 6 when a correct word provides p-level evidence", () => {
    const band = assessmentContent.bands[0];
    const map = band.checkpointGroups[0].find((word) => word.text === "map")!;
    const responses = [
      {
        correct: true,
        bandId: band.id,
        stage: "checkpoint" as const,
        groupId: `${band.id}-0`,
        word: map,
      },
      {
        correct: false,
        bandId: band.id,
        stage: "focus" as const,
        groupId: "lesson-1",
        word: band.probes[0].words[0],
      },
    ];

    expect(
      buildEvidenceRecommendation(responses, [band], ufliResourceManifest.lessons),
    ).toMatchObject({ lesson: "6", isStartingPoint: true });
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
