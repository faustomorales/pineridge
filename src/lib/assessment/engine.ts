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
  priorPlacementLesson: string | null;
  searchBounds: {
    lastPassedBandIndex: number | null;
    firstFailedBandIndex: number | null;
  };
  frontier: {
    lowerProbeIndex: number;
    upperProbeIndex: number;
    stride: number;
  } | null;
}

export interface AssessmentRun extends RunSnapshot {
  definition: AssessmentDefinition;
  history: RunSnapshot[];
}

export type AssessmentEvent =
  | { type: "confirm"; priorPlacementLesson?: string }
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
    priorPlacementLesson: null,
    searchBounds: {
      lastPassedBandIndex: null,
      firstFailedBandIndex: null,
    },
    frontier: null,
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
    priorPlacementLesson: run.priorPlacementLesson,
    searchBounds: { ...run.searchBounds },
    frontier: run.frontier ? { ...run.frontier } : null,
  };
}

function completeRun(run: AssessmentRun): AssessmentRun {
  return {
    ...run,
    status: "complete",
    completionReason:
      run.demonstratedGaps.length > 0 ? "needs-support" : "all-passed",
  };
}

function showCheckpoint(run: AssessmentRun, bandIndex: number): AssessmentRun {
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

function routeAfterCheckpointPass(run: AssessmentRun): AssessmentRun {
  const current = run.position.bandIndex;
  const last = run.definition.bands.length - 1;
  const upper = run.searchBounds.firstFailedBandIndex;
  const passedRun = {
    ...run,
    searchBounds: {
      ...run.searchBounds,
      lastPassedBandIndex: current,
    },
  };

  if (current === last) return completeRun(passedRun);

  if (upper !== null) {
    if (upper - current <= 1) {
      return enterFocus({
        ...passedRun,
        position: { ...passedRun.position, bandIndex: upper },
      });
    }
    return showCheckpoint(passedRun, Math.floor((current + upper) / 2));
  }

  return showCheckpoint(
    passedRun,
    Math.floor((current + last + 1) / 2),
  );
}

function routeAfterCheckpointFail(run: AssessmentRun): AssessmentRun {
  const current = run.position.bandIndex;
  const failedRun = {
    ...run,
    searchBounds: {
      ...run.searchBounds,
      firstFailedBandIndex: current,
    },
  };

  return enterFocus(failedRun);
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
  const groupCorrect = groupResponses.length - groupMisses;

  if (groupMisses >= 2) return routeAfterCheckpointFail(run);
  if (groupCorrect >= 4) return routeAfterCheckpointPass(run);

  if (run.position.wordIndex + 1 < group.length) {
    return {
      ...run,
      position: { ...run.position, wordIndex: run.position.wordIndex + 1 },
    };
  }

  return groupCorrect >= 4
    ? routeAfterCheckpointPass(run)
    : routeAfterCheckpointFail(run);
}

function enterFocus(run: AssessmentRun): AssessmentRun {
  const probes = run.definition.bands.flatMap((band, bandIndex) =>
    band.probes.map((probe, probeIndex) => ({ bandIndex, probeIndex, probe })),
  );
  if (probes.length === 0) return completeRun(run);
  const demonstratedOrder = Math.max(
    ...run.responses
      .filter((response) => response.correct)
      .flatMap((response) => response.word.evidenceFor)
      .map((lesson) => Number.parseFloat(lesson)),
    Number.NEGATIVE_INFINITY,
  );
  const lowerProbeIndex = probes.findLastIndex(
    ({ probe }) => Number.parseFloat(probe.lesson) <= demonstratedOrder,
  );
  const failedBandIndex = run.position.bandIndex;
  const upperProbeIndex = probes.findLastIndex(
    ({ bandIndex }) => bandIndex === failedBandIndex,
  );
  const nextProbeIndex = Math.min(lowerProbeIndex + 1, upperProbeIndex);
  const next = probes[nextProbeIndex];

  return {
    ...run,
    position: {
      bandIndex: next.bandIndex,
      stage: "focus",
      groupIndex: 0,
      probeIndex: next.probeIndex,
      wordIndex: 0,
    },
    frontier: { lowerProbeIndex, upperProbeIndex, stride: 2 },
  };
}

function showGlobalProbe(run: AssessmentRun, globalProbeIndex: number): AssessmentRun {
  const probes = run.definition.bands.flatMap((band, bandIndex) =>
    band.probes.map((_, probeIndex) => ({ bandIndex, probeIndex })),
  );
  const next = probes[globalProbeIndex];
  if (!next) return completeRun(run);
  return {
    ...run,
    position: { bandIndex: next.bandIndex, stage: "focus", groupIndex: 0, probeIndex: next.probeIndex, wordIndex: 0 },
  };
}

function currentGlobalProbeIndex(run: AssessmentRun): number {
  let index = 0;
  for (let bandIndex = 0; bandIndex < run.position.bandIndex; bandIndex += 1) {
    index += run.definition.bands[bandIndex].probes.length;
  }
  return index + (run.position.probeIndex ?? 0);
}

function advanceFocus(run: AssessmentRun): AssessmentRun {
  const band = run.definition.bands[run.position.bandIndex];
  const probeIndex = run.position.probeIndex ?? 0;
  const probe = band.probes[probeIndex];
  const probeResponses = run.responses.filter(
    (response) => response.stage === "focus" && response.groupId === probe.id,
  );
  const misses = probeResponses.filter((response) => !response.correct).length;
  const correct = probeResponses.length - misses;
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

  if (correct >= 2) {
    const current = currentGlobalProbeIndex(run);
    const frontier = run.frontier!;
    const lowerProbeIndex = current;
    const lastProbeIndex = run.definition.bands.reduce(
      (count, item) => count + item.probes.length,
      0,
    ) - 1;
    if (current >= lastProbeIndex) return completeRun(run);
    const upperProbeIndex = current >= frontier.upperProbeIndex
      ? lastProbeIndex
      : frontier.upperProbeIndex;
    const nextIndex = Math.min(current + frontier.stride, upperProbeIndex);
    return showGlobalProbe(
      { ...run, frontier: { lowerProbeIndex, upperProbeIndex, stride: frontier.stride * 2 } },
      nextIndex,
    );
  }

  if (misses >= 2) {
    const current = currentGlobalProbeIndex(run);
    const frontier = run.frontier!;
    if (current - frontier.lowerProbeIndex <= 1) {
      return { ...run, status: "complete", completionReason: "needs-support" };
    }
    const upperProbeIndex = current;
    return showGlobalProbe(
      { ...run, frontier: { ...frontier, upperProbeIndex, stride: 1 } },
      Math.floor((frontier.lowerProbeIndex + upperProbeIndex) / 2),
    );
  }

  if (run.position.wordIndex + 1 < probe.words.length) {
    return {
      ...run,
      position: { ...run.position, wordIndex: run.position.wordIndex + 1 },
    };
  }

  return { ...run, status: "complete", completionReason: "needs-support" };
}

function skipPreviouslyAdministeredWords(run: AssessmentRun): AssessmentRun {
  let next = run;
  const administered = new Set(
    run.responses.map((response) => response.word.text.toLocaleLowerCase()),
  );

  while (next.status === "active") {
    const word = currentWord(next);
    if (!word || !administered.has(word.text.toLocaleLowerCase())) return next;

    next =
      next.position.stage === "checkpoint"
        ? advanceCheckpoint(next)
        : advanceFocus(next);
  }

  return next;
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

  const advanced =
    run.position.stage === "checkpoint"
      ? advanceCheckpoint(next)
      : advanceFocus(next);
  return skipPreviouslyAdministeredWords(advanced);
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
    if (event.priorPlacementLesson) {
      const probes = run.definition.bands.flatMap((band, bandIndex) =>
        band.probes.map((probe, probeIndex) => ({ bandIndex, probeIndex, probe })),
      );
      const requestedOrder = Number.parseFloat(event.priorPlacementLesson);
      const globalProbeIndex = probes.findIndex(
        ({ probe }) => Number.parseFloat(probe.lesson) >= requestedOrder,
      );
      const selectedIndex = globalProbeIndex < 0 ? probes.length - 1 : globalProbeIndex;
      const selected = probes[selectedIndex];
      if (selected) {
        return {
          ...run,
          status: "active",
          priorPlacementLesson: event.priorPlacementLesson,
          position: {
            bandIndex: selected.bandIndex,
            stage: "focus",
            groupIndex: 0,
            probeIndex: selected.probeIndex,
            wordIndex: 0,
          },
          frontier: {
            lowerProbeIndex: selectedIndex - 1,
            upperProbeIndex: probes.length - 1,
            stride: 2,
          },
        };
      }
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
