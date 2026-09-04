# UFLI resource manifest

`ufli-resources.v1.json` is a checked-in snapshot of the official UFLI
Foundations Toolbox. It was retrieved on the date recorded in the file from the
[official toolbox index](https://ufli.education.ufl.edu/foundations/toolbox/)
and its 14 linked lesson-range pages. Those first-party pages are the source of
each lesson identifier, concept label, and literal resource URL.

The snapshot contains every lesson row shown by the US toolbox: 138 rows for
Lessons 1–128, including letter-suffixed lesson variants. A `null` value means
the toolbox row did not link that resource type; it is deliberate rather than
an inferred filename. In this snapshot, 7 lessons lack a Decodable Passage, 4
lack Home Practice, and 12 lack Roll and Read. Every lesson has Google Slides.

The application imports the snapshot; it does not fetch or scrape UFLI at
runtime. Maintainers can compare it with the live toolbox and check every
linked destination by running:

```sh
node scripts/verify-ufli-resources.mjs
```

After reviewing official toolbox changes, refresh the checked-in snapshot with
`node scripts/verify-ufli-resources.mjs --write`. `--skip-links` skips the
individual URL checks when only validating schema and toolbox drift.
