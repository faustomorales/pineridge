import { describe, expect, it } from "vitest";

import {
  createAssessmentRun,
  transitionAssessment,
  type AssessmentDefinition,
  type AssessmentRun,
} from "./engine";
import type { FiveWords } from "./model";

const words = (prefix: string) =>
  Array.from({ length: 5 }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    text: `${prefix}${index + 1}`,
    kind: index < 3 ? ("real" as const) : ("invented" as const),
    requirements: ["1"],
    evidenceFor: ["1"],
  })) as unknown as FiveWords;

const definition: AssessmentDefinition = {
  bands: [
    {
      id: "short-vowels",
      label: "Short vowels",
      checkpointGroups: [words("a"), words("b"), words("c"), words("d")],
      probes: [
        {
          id: "lesson-7-f",
          lesson: "7",
          concept: "f /f/",
          words: words("f"),
        },
        {
          id: "lesson-8-i",
          lesson: "8",
          concept: "i /ĭ/",
          words: words("i"),
        },
        {
          id: "lesson-9-s",
          lesson: "9",
          concept: "s /s/",
          words: words("s"),
        },
      ],
    },
    {
      id: "digraphs",
      label: "Digraphs",
      checkpointGroups: [words("e"), words("g"), words("h"), words("j")],
      probes: [],
    },
  ],
};

const start = () =>
  transitionAssessment(createAssessmentRun(definition), { type: "confirm" });

const judge = (run: AssessmentRun, correct: boolean) =>
  transitionAssessment(run, { type: "judge", correct });

const adaptiveDefinition: AssessmentDefinition = {
  bands: Array.from({ length: 11 }, (_, index) => ({
    id: `band-${index}`,
    label: `Band ${index}`,
    checkpointGroups: [
      words(`b${index}a`),
      words(`b${index}b`),
      words(`b${index}c`),
      words(`b${index}d`),
    ],
    probes: [
      {
        id: `probe-${index}`,
        lesson: `${index + 1}`,
        concept: `Concept ${index}`,
        words: words(`p${index}`),
      },
    ],
  })),
};

const passSample = (run: AssessmentRun) => {
  for (let index = 0; index < 4; index += 1) run = judge(run, true);
  return run;
};

const failSample = (run: AssessmentRun) => judge(judge(run, false), false);

describe("assessment run", () => {
  it("uses midpoint jumps to reach the highest band", () => {
    let run = transitionAssessment(createAssessmentRun(adaptiveDefinition), {
      type: "confirm",
    });
    const visited: number[] = [];

    while (run.status === "active") {
      visited.push(run.position.bandIndex);
      run = passSample(run);
    }

    expect(visited).toEqual([0, 5, 8, 9, 10]);
    expect(run.responses).toHaveLength(20);
    expect(run.completionReason).toBe("all-passed");
  });

  it("bisects downward until it brackets the focused band", () => {
    let run = transitionAssessment(createAssessmentRun(adaptiveDefinition), {
      type: "confirm",
    });

    run = passSample(run); // 0 -> 5
    run = failSample(run); // 5 -> 2
    expect(run.position.bandIndex).toBe(2);
    run = passSample(run); // 2 -> 3
    run = passSample(run); // 3 -> 4
    run = passSample(run); // adjacent boundary -> focus 5

    expect(run.position).toMatchObject({
      bandIndex: 5,
      stage: "focus",
      probeIndex: 0,
      wordIndex: 0,
    });
  });

  it("undoes the judgment that caused an adaptive jump", () => {
    let run = transitionAssessment(createAssessmentRun(adaptiveDefinition), {
      type: "confirm",
    });
    run = passSample(run);
    expect(run.position.bandIndex).toBe(5);

    run = transitionAssessment(run, { type: "undo" });

    expect(run.position).toMatchObject({ bandIndex: 0, wordIndex: 3 });
    expect(run.responses).toHaveLength(3);
    expect(run.searchBounds).toEqual({
      lastPassedBandIndex: null,
      firstFailedBandIndex: null,
    });
  });

  it("starts at the basic band, then jumps to the midpoint after four correct", () => {
    let run = start();

    for (let index = 0; index < 4; index += 1) run = judge(run, true);

    expect(run.status).toBe("active");
    expect(run.position).toMatchObject({
      bandIndex: 1,
      stage: "checkpoint",
      groupIndex: 0,
      wordIndex: 0,
    });
    expect(run.responses).toHaveLength(4);
    expect(run.demonstratedGaps).toEqual([]);
  });

  it("switches to focused probing after two misses in the first band", () => {
    let run = start();
    run = judge(run, false);
    run = judge(run, false);

    expect(run.status).toBe("active");
    expect(run.position).toMatchObject({
      bandIndex: 0,
      stage: "focus",
      probeIndex: 0,
      wordIndex: 0,
    });
  });

  it("records a Demonstrated Gap after two misses and continues the probe", () => {
    let run = start();
    run = judge(judge(run, false), false);
    run = judge(run, false);
    run = judge(run, false);

    expect(run.demonstratedGaps).toEqual([
      {
        bandId: "short-vowels",
        probeId: "lesson-7-f",
        lesson: "7",
        concept: "f /f/",
      },
    ]);
    expect(run.status).toBe("active");
    expect(run.position.wordIndex).toBe(2);
  });

  it("ends after a third miss in one Concept Probe", () => {
    let run = start();
    run = judge(judge(run, false), false);
    run = judge(judge(judge(run, false), false), false);

    expect(run.status).toBe("complete");
    expect(run.completionReason).toBe("needs-support");
    expect(run.demonstratedGaps).toHaveLength(1);
  });

  it("undoes a judgment that caused completion", () => {
    let run = start();
    run = judge(judge(run, false), false);
    run = judge(judge(judge(run, false), false), false);

    run = transitionAssessment(run, { type: "undo" });

    expect(run.status).toBe("active");
    expect(run.responses.at(-1)?.word.id).toBe("f-2");
    expect(run.position).toMatchObject({ stage: "focus", wordIndex: 2 });

    const afterSecondUndo = transitionAssessment(run, { type: "undo" });
    expect(afterSecondUndo).toEqual(run);
  });

  it("undoes only the immediately previous active judgment", () => {
    let run = judge(start(), true);
    expect(run.responses).toHaveLength(1);

    run = transitionAssessment(run, { type: "undo" });
    expect(run.responses).toHaveLength(0);
    expect(run.position).toMatchObject({
      stage: "checkpoint",
      groupIndex: 0,
      wordIndex: 0,
    });
    expect(transitionAssessment(run, { type: "undo" })).toEqual(run);
  });

  it("undoes the judgment that switched a Checkpoint into focus", () => {
    let run = start();
    run = judge(judge(run, false), false);
    expect(run.position.stage).toBe("focus");

    run = transitionAssessment(run, { type: "undo" });
    expect(run.status).toBe("active");
    expect(run.responses).toHaveLength(1);
    expect(run.position).toMatchObject({
      stage: "checkpoint",
      groupIndex: 0,
      wordIndex: 1,
    });
  });

  it("ends as soon as a third Demonstrated Gap is observed", () => {
    let run = start();
    run = judge(judge(run, false), false);

    for (let probe = 0; probe < 2; probe += 1) {
      for (const correct of [false, false, true, true, true]) {
        run = judge(run, correct);
      }
    }
    run = judge(run, false);
    run = judge(run, false);

    expect(run.status).toBe("complete");
    expect(run.demonstratedGaps.map((gap) => gap.lesson)).toEqual([
      "7",
      "8",
      "9",
    ]);
  });

  it("finishes with no Starting Point when every Checkpoint passes", () => {
    let run = start();
    while (run.status === "active") run = judge(run, true);

    expect(run.status).toBe("complete");
    expect(run.completionReason).toBe("all-passed");
    expect(run.demonstratedGaps).toEqual([]);
  });

  it("exposes printing as a Tutor Result operation", () => {
    let run = createAssessmentRun({ bands: [] });
    run = transitionAssessment(run, { type: "confirm" });
    run = transitionAssessment(run, { type: "reveal" });
    run = transitionAssessment(run, { type: "requestPrint" });
    expect(run.printRequested).toBe(true);

    run = transitionAssessment(run, { type: "printHandled" });
    expect(run.printRequested).toBe(false);
  });
});
