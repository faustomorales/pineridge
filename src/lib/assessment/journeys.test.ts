import { describe, expect, it } from "vitest";

import { ufliResourceManifest } from "$lib/resources";

import { assessmentContent } from "./content";
import {
  createAssessmentRun,
  currentWord,
  transitionAssessment,
  type AssessmentRun,
} from "./engine";
import { buildEvidenceRecommendation, buildRecommendations, lessonOrder } from "./results";

interface StudentProfile {
  gapLessons: string[];
  expectedRecommendationLessons: string[];
  maximumWords: number;
  expectedWords: number;
}

function bandForLesson(lesson: string): number {
  const target = lessonOrder(lesson);
  return assessmentContent.bands.findIndex((band) =>
    band.probes.some((probe) => lessonOrder(probe.lesson) === target),
  );
}

function judgmentFor(run: AssessmentRun, profile: StudentProfile): boolean {
  const gapBand = bandForLesson(profile.gapLessons[0]);
  const currentBand = assessmentContent.bands[run.position.bandIndex];

  if (run.position.stage === "checkpoint") {
    const groupId = `${currentBand.id}-${run.position.groupIndex}`;
    const responsesInGroup = run.responses.filter(
      (response) => response.groupId === groupId,
    ).length;
    if (run.position.bandIndex < gapBand) {
      // One realistic miscue, followed by enough correct responses to pass 4/5.
      return responsesInGroup !== 1;
    }

    // A mixed failure reaches two misses on the third presented word.
    return responsesInGroup === 0;
  }

  const probe = currentBand.probes[run.position.probeIndex ?? 0];
  const responsesInProbe = run.responses.filter(
    (response) => response.groupId === probe.id,
  ).length;
  if (profile.gapLessons.includes(probe.lesson)) {
    const isDecisiveGap = probe.lesson === profile.gapLessons.at(-1);
    // Earlier gaps have two mixed misses; the final gap has three and stops the run.
    return isDecisiveGap
      ? responsesInProbe === 1
      : responsesInProbe === 1 || responsesInProbe >= 3;
  }

  // Earlier mastered concepts still contain an occasional isolated miscue.
  return responsesInProbe !== 1;
}

function administer(profile: StudentProfile): AssessmentRun {
  let run = transitionAssessment(createAssessmentRun(assessmentContent), {
    type: "confirm",
  });

  while (run.status === "active") {
    expect(currentWord(run)).not.toBeNull();
    run = transitionAssessment(run, {
      type: "judge",
      correct: judgmentFor(run, profile),
    });
    expect(run.responses.length).toBeLessThanOrEqual(profile.maximumWords);
  }

  return run;
}

describe.each([
  { gapLessons: ["7"], expectedRecommendationLessons: ["7"], maximumWords: 38, expectedWords: 32 },
  { gapLessons: ["48"], expectedRecommendationLessons: ["48"], maximumWords: 49, expectedWords: 45 },
  { gapLessons: ["105"], expectedRecommendationLessons: ["105"], maximumWords: 53, expectedWords: 50 },
  { gapLessons: ["120"], expectedRecommendationLessons: ["120"], maximumWords: 73, expectedWords: 72 },
  { gapLessons: ["44", "48"], expectedRecommendationLessons: ["44", "48", "49"], maximumWords: 50, expectedWords: 45 },
] satisfies StudentProfile[])(
  "realistic student journey with gaps at $gapLessons",
  (profile) => {
    it("recommends the intended Starting Point without repeated items or Checkpoints", () => {
      const run = administer(profile);
      const recommendations = buildRecommendations(
        run.demonstratedGaps,
        ufliResourceManifest.lessons,
      );
      const wordIds = run.responses.map((response) => response.word.id);
      const displayedWords = run.responses.map((response) =>
        response.word.text.toLocaleLowerCase(),
      );
      const repeatedWords = displayedWords.filter(
        (word, index) => displayedWords.indexOf(word) !== index,
      );
      const checkpointBands = run.responses
        .filter((response) => response.stage === "checkpoint")
        .map((response) => response.bandId)
        .filter((bandId, index, bands) => bands[index - 1] !== bandId);

      expect(run.completionReason).toBe("needs-support");
      expect(recommendations.map((item) => item.lesson)).toEqual(
        profile.expectedRecommendationLessons,
      );
      expect(recommendations[0].isStartingPoint).toBe(true);
      expect(new Set(wordIds).size).toBe(wordIds.length);
      expect(repeatedWords).toEqual([]);
      expect(new Set(checkpointBands).size).toBe(checkpointBands.length);
      expect(run.responses).toHaveLength(profile.expectedWords);
      expect(run.responses.length).toBeLessThanOrEqual(profile.maximumWords);
    });
  },
);

it("places a student who reads only m, a, s, and t words at Lesson 5", () => {
  const knownLetters = new Set(["m", "a", "s", "t"]);
  let run = transitionAssessment(createAssessmentRun(assessmentContent), {
    type: "confirm",
  });

  while (run.status === "active") {
    const word = currentWord(run);
    expect(word).not.toBeNull();
    const correct = [...word!.text.toLocaleLowerCase()].every((letter) =>
      knownLetters.has(letter),
    );
    run = transitionAssessment(run, { type: "judge", correct });
  }

  const recommendation = buildEvidenceRecommendation(
    run.responses,
    assessmentContent.bands,
    ufliResourceManifest.lessons,
  );
  expect(recommendation?.lesson).toBe("5");
  expect(run.responses.length).toBeLessThanOrEqual(15);
});

it("places a student who also reads p words at Lesson 6", () => {
  const knownLetters = new Set(["m", "a", "s", "t", "p"]);
  let run = transitionAssessment(createAssessmentRun(assessmentContent), {
    type: "confirm",
  });

  while (run.status === "active") {
    const word = currentWord(run)!;
    const correct = [...word.text.toLocaleLowerCase()].every((letter) =>
      knownLetters.has(letter),
    );
    run = transitionAssessment(run, { type: "judge", correct });
  }

  expect(
    buildEvidenceRecommendation(
      run.responses,
      assessmentContent.bands,
      ufliResourceManifest.lessons,
    )?.lesson,
  ).toBe("6");
  expect(run.responses.length).toBeLessThanOrEqual(15);
});
