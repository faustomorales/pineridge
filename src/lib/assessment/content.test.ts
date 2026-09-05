import { describe, expect, it } from "vitest";

import { ufliResourceManifest } from "$lib/resources";
import { assessmentContent } from "./content";

describe("assessment content", () => {
  it("provides complete, well-formed Checkpoints and Concept Probes", () => {
    const wordIds = new Set<string>();
    const probeIds = new Set<string>();
    const manifestLessons = new Set(
      ufliResourceManifest.lessons.map((lesson) => lesson.lesson),
    );

    expect(assessmentContent.bands).toHaveLength(11);
    expect(
      assessmentContent.bands.flatMap((band) => band.probes),
    ).toHaveLength(113);

    for (const band of assessmentContent.bands) {
      expect(band.checkpointGroups).toHaveLength(4);
      for (const group of band.checkpointGroups) {
        expect(group).toHaveLength(5);
        for (const word of group) {
          expect(word.lessons.length).toBeGreaterThan(0);
          expect(new Set(word.lessons).size).toBe(word.lessons.length);
          expect(word.lessons.every((lesson) => manifestLessons.has(lesson))).toBe(true);
          expect(wordIds.has(word.id)).toBe(false);
          wordIds.add(word.id);
        }
      }

      for (const probe of band.probes) {
        expect(probeIds.has(probe.id)).toBe(false);
        probeIds.add(probe.id);
        expect(manifestLessons.has(probe.lesson)).toBe(true);
        expect(probe.words).toHaveLength(5);
        expect(probe.words.filter((word) => word.kind === "real")).toHaveLength(
          3,
        );
        expect(
          probe.words.filter((word) => word.kind === "invented"),
        ).toHaveLength(2);
        for (const word of probe.words) {
          expect(word.lessons).toContain(probe.lesson);
          expect(new Set(word.lessons).size).toBe(word.lessons.length);
          expect(word.lessons.every((lesson) => manifestLessons.has(lesson))).toBe(true);
          expect(wordIds.has(word.id)).toBe(false);
          wordIds.add(word.id);
        }
      }
    }
  });

  it("associates map with the lessons for m, a, and p", () => {
    const map = assessmentContent.bands[0].checkpointGroups[0].find(
      (word) => word.text === "map",
    );
    expect(map).toBeDefined();
    expect(map?.lessons).toEqual(["2", "1", "6"]);
  });

  it("presents Concept Probes in instructional lesson order", () => {
    const lessons = assessmentContent.bands
      .flatMap((band) => band.probes)
      .map((probe) =>
        Number.parseFloat(
          probe.lesson.replace(
            /[a-z]$/,
            (letter) => `.${letter.charCodeAt(0) - 96}`,
          ),
        ),
      );

    expect(lessons).toEqual([...lessons].sort((left, right) => left - right));
  });
});
