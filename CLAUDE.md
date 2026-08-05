# CLAUDE.md — Pineridge (Greenhouse Church Program Collateral)

Developer guide for AI assistants working in this repository.

## Project Overview

Static design collateral for three Greenhouse Church volunteer programs
(Tutoring, Kids Church, Greenhouse Youth): a synthesized one-page handout,
a yard sign per program, and a van magnet. Pages are meant to be opened in
a browser and exported via Print → Save as PDF at their true physical size
for a print vendor.

Live at: `pineridge.robinbay.com` (GitHub Pages, custom domain via `public/CNAME`)

**Branding is currently a placeholder.** See `BRANDING.md` for the task to
apply the real Greenhouse Church identity (this sandbox couldn't reach
`taproot.agency` or `greenhousechurch.org` — both blocked by network policy).

## Tech Stack

Vite 5 (multi-page static build, no framework — plain HTML/CSS/JS), deployed
via GitHub Actions to GitHub Pages, same pattern as the `notetrainer` repo.

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server with hot reload
npm run build  # Production build → dist/
npm run preview
```

No test runner or linter configured. Verification is manual via the browser.

## Repository Structure

```
pineridge/
├── index.html                       # Landing page linking to all 5 pieces
├── handout.html                     # 8.5x11in flyer, all 3 programs
├── van-magnet.html                  # 18x12in general church branding magnet
├── signs/
│   ├── tutoring.html                # 24x18in yard sign
│   ├── kids-church.html             # 24x18in yard sign
│   └── greenhouse-youth.html        # 24x18in yard sign
├── src/
│   ├── styles/
│   │   ├── brand.css                # Placeholder color/font CSS custom properties
│   │   └── base.css                 # Resets, .sheet/.sheet-wrap print scaffold, buttons
│   ├── print.js                     # Wires up [data-print] buttons to window.print()
│   └── assets/
│       └── logo-placeholder.svg     # Placeholder mark — replace per BRANDING.md
├── public/
│   └── CNAME                        # pineridge.robinbay.com
├── vite.config.js                   # Multi-page rollupOptions.input
├── BRANDING.md                      # Task: apply real Greenhouse Church brand
└── .github/workflows/deploy.yml     # CI/CD — builds and deploys main to GH Pages
```

## Print-accurate sizing pattern

Every collateral page sets three CSS custom properties on `:root` in its
own `<style>` block:

```css
:root {
  --sheet-width: 24in;
  --sheet-height: 18in;
  --preview-scale: 0.3;
}
```

`base.css`'s `.sheet` / `.sheet-wrap` classes use these to render a
correctly-sized `@page` for print (via `@media print { @page { size: ... } }`)
while showing a scaled-down preview on screen (`transform: scale(var(--preview-scale))`
on `.sheet`, with `.sheet-wrap` sized to match so there's no extra
whitespace). `--preview-scale` is chosen per page so the on-screen preview
is roughly 600-700px wide; it has no effect on the print output, which
resets the transform to `none`.

Each page also has a `.no-print` block with a `<button data-print>` that
triggers `window.print()` via the shared `src/print.js` module script.

**Cascade gotcha:** Vite's production build injects the bundled
`base.css`/`brand.css` `<link>` *after* each page's inline `<style>` block
(source order is reversed from dev, where the `<link>` tags come first).
Any page-specific rule that overrides a property also set in `base.css`'s
`.sheet` (e.g. `background`) must use a selector with higher specificity
than `.sheet` alone — this repo uses `body .sheet { ... }` for that reason.
Plain `.sheet { ... }` in a page's `<style>` block will silently lose to
`base.css` in the production build even though it looks correct in `npm run
dev`.

## Content source of truth

Program details (schedule, location, contact, requirements) live directly
in the HTML of `handout.html` and the three `signs/*.html` files — there's
no shared data file. If a program's logistics change, update all pages that
reference it by hand.

| Program | Address | Time | Ages | Starts | Contact | Notes |
|---|---|---|---|---|---|---|
| Tutoring | 2925 NW 29th Ave | 6:00–7:45 PM | K–5 | Aug 17 | 904-401-0728 | Transportation provided; permission slip required |
| Kids Church | Pineridge Park | 5:00–6:00 PM | K–5 | Aug 19 | 850-509-8283 | — |
| Greenhouse Youth | 11200 NW 39th Ave | 6:00–9:00 PM | Grades 6–12 | Aug 19 | 305-394-2645 | Transportation & food provided; signed permission slip required |

No recurring weekday was given in the source request — only start dates
and daily time windows.

## What Does Not Exist (yet)

- No real Greenhouse Church branding (colors/fonts/logo) — see `BRANDING.md`
- No dedicated print-ready export pipeline (bleed/crop marks/CMYK) — browser
  Print → Save as PDF at the `@page`-declared physical size is the intended
  workflow
- No shared JSON/data file for program content — each page hardcodes its own
  copy
- No tests or linter
