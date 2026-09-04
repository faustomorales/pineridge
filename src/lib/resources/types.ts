export type UfliResourceLinks = Readonly<{
  googleSlides: string | null;
  decodablePassage: string | null;
  homePractice: string | null;
  rollAndRead: string | null;
}>;

export type UfliLessonResource = Readonly<{
  lesson: string;
  concept: string;
  sourceUrl: string;
  resources: UfliResourceLinks;
}>;

export type UfliResourceManifestV1 = Readonly<{
  schemaVersion: 1;
  retrievedAt: string;
  toolboxIndexUrl: string;
  lessons: readonly UfliLessonResource[];
}>;
