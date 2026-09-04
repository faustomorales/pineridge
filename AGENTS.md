# Pineridge Repository Guide

Pineridge is a statically generated SvelteKit site for Greenhouse Church program collateral and an independent tutor-operated reading assessment. It is deployed to GitHub Pages at `pineridge.robinbay.com`.

## Working conventions

- Read `CONTEXT.md` before changing tutoring-assessment concepts or terminology.
- Preserve the print dimensions and browser Print → Save as PDF behavior of existing collateral during framework migrations.
- Branding guidance lives in `BRAND_GUIDE.md`.
- Feature planning uses `.scratch/{feature}/spec.md`; track implementation work as Markdown issues in `.scratch/{feature}/issues/`. Each actionable issue must declare its status/triage label and link back to the feature spec.

## Current application

- The landing page links to the reading assessment, handout, van magnet, and student-expectations guide.
- Shared print and brand styles live under `src/styles/`; Svelte routes invoke browser printing directly.
- The student-expectations page also uses `src/student-map.js` for its layout tooling.
- `public/CNAME` configures the custom GitHub Pages domain.

## Print constraint

Collateral pages use `--sheet-width`, `--sheet-height`, and `--preview-scale` with the shared `.sheet` and `.sheet-wrap` scaffold. Production CSS ordering can cause a page-local `.sheet` rule to lose to shared CSS; use a more specific page selector when overriding shared sheet properties. Verify both browser previews and printed physical dimensions after changes.
