import type {
  AssessmentDefinition,
  AssessmentWord,
} from "./model";

export type {
  AssessmentDefinition,
  AssessmentWord,
  ConceptProbe,
  SkillBand,
  WordKind,
} from "./model";

export type AssessmentPosition = {
  bandIndex: number;
  stage: "checkpoint" | "focus";
  groupIndex: number;
  wordIndex: number;
  probeIndex?: number;
};

export interface AssessmentResponse {
  word: AssessmentWord;
  correct: boolean;
  bandId: string;
  stage: "checkpoint" | "focus";
  groupId: string;
  lesson?: string;
  concept?: string;
}

export interface DemonstratedGap {
  bandId: string;
  probeId: string;
  lesson: string;
  concept: string;
}

type RunStatus = "instructions" | "active" | "complete" | "results";
type CompletionReason = "needs-support" | "all-passed" | null;

interface RunSnapshot {
  status: RunStatus;
  position: AssessmentPosition;
  responses: AssessmentResponse[];
  demonstratedGaps: DemonstratedGap[];
  completionReason: CompletionReason;
  printRequested: boolean;
}

export interface AssessmentRun extends RunSnapshot {
  definition: AssessmentDefinition;
  history: RunSnapshot[];
}

export type AssessmentEvent =
  | { type: "confirm" }
  | { type: "judge"; correct: boolean }
  | { type: "undo" }
  | { type: "reveal" }
  | { type: "requestPrint" }
  | { type: "printHandled" }
  | { type: "reset" };

const initialPosition = (): AssessmentPosition => ({
  bandIndex: 0,
  stage: "checkpoint",
  groupIndex: 0,
  wordIndex: 0,
});

export function createAssessmentRun(
  definition: AssessmentDefinition,
): AssessmentRun {
  return {
    definition,
    status: "instructions",
    position: initialPosition(),
    responses: [],
    demonstratedGaps: [],
    completionReason: null,
    printRequested: false,
    history: [],
  };
}

export function currentWord(run: AssessmentRun): AssessmentWord | null {
  if (run.status !== "active") return null;
  const band = run.definition.bands[run.position.bandIndex];
  if (!band) return null;

  if (run.position.stage === "checkpoint") {
    return (
      band.checkpointGroups[run.position.groupIndex]?.[
        run.position.wordIndex
      ] ?? null
    );
  }

  return (
    band.probes[run.position.probeIndex ?? 0]?.words[
      run.position.wordIndex
    ] ?? null
  );
}

function snapshot(run: AssessmentRun): RunSnapshot {
  return {
    status: run.status,
    position: { ...run.position },
    responses: [...run.responses],
    demonstratedGaps: [...run.demonstratedGaps],
    completionReason: run.completionReason,
    printRequested: run.printRequested,
  };
}

function advanceToBand(run: AssessmentRun, bandIndex: number): AssessmentRun {
  if (bandIndex >= run.definition.bands.length) {
    return {
      ...run,
      status: "complete",
      completionReason:
        run.demonstratedGaps.length > 0 ? "needs-support" : "all-passed",
    };
  }

  return {
    ...run,
    position: {
      bandIndex,
      stage: "checkpoint",
      groupIndex: 0,
      wordIndex: 0,
    },
  };
}

function advanceCheckpoint(run: AssessmentRun): AssessmentRun {
  const band = run.definition.bands[run.position.bandIndex];
  const group = band.checkpointGroups[run.position.groupIndex];
  const groupResponses = run.responses.filter(
    (response) =>
      response.bandId === band.id &&
      response.stage === "checkpoint" &&
      response.groupId === `${band.id}-${run.position.groupIndex}`,
  );
  const groupMisses = groupResponses.filter((response) => !response.correct).length;

  if (groupMisses >= 3) return enterFocus(run);

  if (run.position.wordIndex + 1 < group.length) {
    return {
      ...run,
      position: { ...run.position, wordIndex: run.position.wordIndex + 1 },
    };
  }

  if (run.position.groupIndex + 1 < band.checkpointGroups.length) {
    return {
      ...run,
      position: {
        ...run.position,
        groupIndex: run.position.groupIndex + 1,
        wordIndex: 0,
      },
    };
  }

  const checkpointResponses = run.responses.filter(
    (response) =>
      response.bandId === band.id && response.stage === "checkpoint",
  );
  const correct = checkpointResponses.filter((response) => response.correct).length;
  return correct >= 18
    ? advanceToBand(run, run.position.bandIndex + 1)
    : enterFocus(run);
}

function enterFocus(run: AssessmentRun): AssessmentRun {
  const band = run.definition.bands[run.position.bandIndex];
  if (band.probes.length === 0) {
    return advanceToBand(run, run.position.bandIndex + 1);
  }

  return {
    ...run,
    position: {
      bandIndex: run.position.bandIndex,
      stage: "focus",
      groupIndex: 0,
      probeIndex: 0,
      wordIndex: 0,
    },
  };
}

function advanceFocus(run: AssessmentRun): AssessmentRun {
  const band = run.definition.bands[run.position.bandIndex];
  const probeIndex = run.position.probeIndex ?? 0;
  const probe = band.probes[probeIndex];
  const probeResponses = run.responses.filter(
    (response) => response.stage === "focus" && response.groupId === probe.id,
  );
  const misses = probeResponses.filter((response) => !response.correct).length;
  let demonstratedGaps = run.demonstratedGaps;

  if (
    misses >= 2 &&
    !demonstratedGaps.some((gap) => gap.probeId === probe.id)
  ) {
    demonstratedGaps = [
      ...demonstratedGaps,
      {
        bandId: band.id,
        probeId: probe.id,
        lesson: probe.lesson,
        concept: probe.concept,
      },
    ];
    run = { ...run, demonstratedGaps };
  }

  if (misses >= 3 || demonstratedGaps.length >= 3) {
    return { ...run, status: "complete", completionReason: "needs-support" };
  }

  if (run.position.wordIndex + 1 < probe.words.length) {
    return {
      ...run,
      position: { ...run.position, wordIndex: run.position.wordIndex + 1 },
    };
  }

  if (probeIndex + 1 < band.probes.length) {
    return {
      ...run,
      position: {
        ...run.position,
        probeIndex: probeIndex + 1,
        wordIndex: 0,
      },
    };
  }

  return advanceToBand(run, run.position.bandIndex + 1);
}

function judge(run: AssessmentRun, correct: boolean): AssessmentRun {
  const word = currentWord(run);
  if (!word) return run;
  const band = run.definition.bands[run.position.bandIndex];
  const probe =
    run.position.stage === "focus"
      ? band.probes[run.position.probeIndex ?? 0]
      : undefined;
  const response: AssessmentResponse = {
    word,
    correct,
    bandId: band.id,
    stage: run.position.stage,
    groupId:
      run.position.stage === "checkpoint"
        ? `${band.id}-${run.position.groupIndex}`
        : probe!.id,
    lesson: probe?.lesson,
    concept: probe?.concept,
  };
  const next = {
    ...run,
    responses: [...run.responses, response],
    history: [snapshot(run)],
  };

  return run.position.stage === "checkpoint"
    ? advanceCheckpoint(next)
    : advanceFocus(next);
}

export function transitionAssessment(
  run: AssessmentRun,
  event: AssessmentEvent,
): AssessmentRun {
  if (event.type === "reset") return createAssessmentRun(run.definition);
  if (event.type === "confirm" && run.status === "instructions") {
    if (run.definition.bands.length === 0) {
      return { ...run, status: "complete", completionReason: "all-passed" };
    }
    return { ...run, status: "active" };
  }
  if (event.type === "undo" && run.history.length > 0) {
    const previous = run.history.at(-1)!;
    return {
      ...run,
      ...previous,
      history: run.history.slice(0, -1),
    };
  }
  if (event.type === "reveal" && run.status === "complete") {
    return { ...run, status: "results" };
  }
  if (event.type === "requestPrint" && run.status === "results") {
    return { ...run, printRequested: true };
  }
  if (event.type === "printHandled" && run.printRequested) {
    return { ...run, printRequested: false };
  }
  if (event.type === "judge" && run.status === "active") {
    return judge(run, event.correct);
  }
  return run;
}
