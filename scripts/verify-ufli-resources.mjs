#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const TOOLBOX_ORIGIN = "https://ufli.education.ufl.edu";
const INDEX_URL = `${TOOLBOX_ORIGIN}/foundations/toolbox/`;
const MANIFEST_PATH = fileURLToPath(
  new URL("../src/lib/resources/ufli-resources.v1.json", import.meta.url),
);
const RESOURCE_LABELS = {
  googleSlides: /Google Slides/i,
  decodablePassage: /Decodable Passage/i,
  homePractice: /Home Practice/i,
  rollAndRead: /Roll and Read/i,
};

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—");
}

function textContent(html) {
  return decodeHtml(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function hrefs(cell) {
  return [...cell.matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi)].map(
    ([, doubleQuoted, singleQuoted, label]) => ({
      href: decodeHtml(doubleQuoted ?? singleQuoted),
      label: textContent(label),
    }),
  );
}

function parseToolboxPage(html, sourceUrl) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const lessons = [];

  for (const [, row] of rows) {
    const headingCells = [...row.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(
      (match) => match[1],
    );
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (match) => match[1],
    );
    if (headingCells.length !== 1 || cells.length < 1) continue;

    const lesson = textContent(headingCells[0]);
    if (!/^\d+[a-z]?$/i.test(lesson)) continue;

    const links = cells.flatMap(hrefs);
    const resources = Object.fromEntries(
      Object.entries(RESOURCE_LABELS).map(([key, labelPattern]) => [
        key,
        links.find(({ label }) => labelPattern.test(label))?.href ?? null,
      ]),
    );

    lessons.push({ lesson, concept: textContent(cells[0]), sourceUrl, resources });
  }

  return lessons;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "pineridge-resource-verifier/1.0" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

async function toolboxSnapshot() {
  const indexHtml = await fetchText(INDEX_URL);
  const pageUrls = [
    ...new Set(
      [...indexHtml.matchAll(/href=(?:"([^"]+)"|'([^']+)')/gi)]
        .map(([, doubleQuoted, singleQuoted]) => doubleQuoted ?? singleQuoted)
        .filter((href) => /^\/foundations\/toolbox\/\d+-\d+\/?$/.test(href))
        .map((href) => new URL(href, TOOLBOX_ORIGIN).href),
    ),
  ];

  if (pageUrls.length === 0) throw new Error(`No lesson pages found at ${INDEX_URL}`);
  const pages = await Promise.all(
    pageUrls.map(async (sourceUrl) => parseToolboxPage(await fetchText(sourceUrl), sourceUrl)),
  );
  return pages.flat();
}

function lessonOrder(lesson) {
  const [, number, suffix = ""] = lesson.match(/^(\d+)([a-z]?)$/i) ?? [];
  return [Number(number), suffix.toLowerCase()];
}

function validate(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.retrievedAt ?? "")) {
    errors.push("retrievedAt must be an ISO date");
  }
  if (!Array.isArray(manifest.lessons) || manifest.lessons.length === 0) {
    errors.push("lessons must be a non-empty array");
    return errors;
  }

  const seen = new Set();
  let prior = [0, ""];
  for (const [index, entry] of manifest.lessons.entries()) {
    const prefix = `lessons[${index}]`;
    if (!/^\d+[a-z]?$/i.test(entry.lesson ?? "")) errors.push(`${prefix}.lesson is malformed`);
    if (seen.has(entry.lesson)) errors.push(`duplicate lesson ${entry.lesson}`);
    seen.add(entry.lesson);
    const current = lessonOrder(entry.lesson);
    if (current[0] < prior[0] || (current[0] === prior[0] && current[1] <= prior[1])) {
      errors.push(`${entry.lesson} is out of order`);
    }
    prior = current;
    if (typeof entry.concept !== "string" || entry.concept.trim() === "") {
      errors.push(`${prefix}.concept must be a non-empty string`);
    }
    try {
      const source = new URL(entry.sourceUrl);
      if (source.hostname !== "ufli.education.ufl.edu") throw new Error();
    } catch {
      errors.push(`${prefix}.sourceUrl must be an official UFLI URL`);
    }
    for (const key of Object.keys(RESOURCE_LABELS)) {
      const value = entry.resources?.[key];
      if (value !== null && typeof value !== "string") {
        errors.push(`${prefix}.resources.${key} must be a URL or null`);
        continue;
      }
      if (typeof value === "string") {
        try {
          const url = new URL(value);
          const official =
            url.hostname === "ufli.education.ufl.edu" ||
            (key === "googleSlides" && url.hostname === "docs.google.com");
          if (url.protocol !== "https:" || !official) throw new Error();
        } catch {
          errors.push(`${prefix}.resources.${key} is not an allowed official URL`);
        }
      }
    }
  }
  return errors;
}

function comparable(lessons) {
  return lessons.map(({ lesson, concept, sourceUrl, resources }) => ({
    lesson,
    concept,
    sourceUrl,
    resources,
  }));
}

async function checkUrls(lessons) {
  const urls = [
    ...new Set(lessons.flatMap(({ resources }) => Object.values(resources).filter(Boolean))),
  ];
  const failures = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          let response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            headers: { "user-agent": "pineridge-resource-verifier/1.0" },
          });
          if (response.status === 405) {
            response = await fetch(url, {
              method: "GET",
              redirect: "follow",
              headers: {
                range: "bytes=0-0",
                "user-agent": "pineridge-resource-verifier/1.0",
              },
            });
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) failures.push(`${url}: ${lastError.message}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  return failures;
}

const writeSnapshot = process.argv.includes("--write");
const skipLinks = process.argv.includes("--skip-links");
const liveLessons = await toolboxSnapshot();
liveLessons.sort((a, b) => {
  const [aNumber, aSuffix] = lessonOrder(a.lesson);
  const [bNumber, bSuffix] = lessonOrder(b.lesson);
  return aNumber - bNumber || aSuffix.localeCompare(bSuffix);
});

if (writeSnapshot) {
  const snapshot = {
    schemaVersion: 1,
    retrievedAt: new Date().toISOString().slice(0, 10),
    toolboxIndexUrl: INDEX_URL,
    lessons: liveLessons,
  };
  const snapshotErrors = validate(snapshot);
  if (snapshotErrors.length > 0) {
    throw new Error(`Refusing to write invalid toolbox data:\n${snapshotErrors.join("\n")}`);
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${liveLessons.length} lessons to ${MANIFEST_PATH}`);
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
const errors = validate(manifest);
if (JSON.stringify(comparable(manifest.lessons)) !== JSON.stringify(comparable(liveLessons))) {
  errors.push("toolbox drift: checked-in lessons differ from the current official toolbox");
}
if (!skipLinks) errors.push(...(await checkUrls(manifest.lessons)).map((error) => `broken URL: ${error}`));

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${manifest.lessons.length} lessons; manifest matches the official toolbox.`);
}
