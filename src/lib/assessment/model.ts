export type WordKind = "real" | "invented";

export interface AssessmentWord {
  readonly id: string;
  readonly text: string;
  readonly kind: WordKind;
  readonly requirements: readonly string[];
  readonly evidenceFor: readonly string[];
}

export type FiveWords = readonly [
  AssessmentWord,
  AssessmentWord,
  AssessmentWord,
  AssessmentWord,
  AssessmentWord,
];

export type CheckpointGroups = readonly [
  FiveWords,
  FiveWords,
  FiveWords,
  FiveWords,
];

export interface ConceptProbe {
  readonly id: string;
  readonly lesson: string;
  readonly concept: string;
  readonly words: FiveWords;
}

export interface SkillBand {
  readonly id: string;
  readonly label: string;
  readonly checkpointGroups: CheckpointGroups;
  readonly probes: readonly ConceptProbe[];
}

export interface AssessmentDefinition {
  readonly bands: readonly SkillBand[];
}
