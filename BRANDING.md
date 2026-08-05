# Branding Task

This site currently uses a **placeholder** visual identity (green/amber
palette, Poppins/Inter fonts, a generic sprout icon). It does not reflect
the real Greenhouse Church brand. This file is the task to hand to Claude
(or follow yourself) once you're on a machine with unrestricted internet
access, to replace the placeholder with the real identity.

## Why this exists

The site was built in a sandboxed environment whose network policy blocks
arbitrary outbound domains — `taproot.agency` and `greenhousechurch.org`
both returned `403` on every fetch attempt. Rather than guess at the real
brand, the build used clearly-labeled placeholders everywhere so this step
wouldn't be silently skipped.

## Task

1. **Research the brand.**
   - Fetch `https://taproot.agency/project/greenhouse-church/` — this is the
     agency case study for the original brand design. Look for the color
     palette (hex values if shown, or extract from images), typography
     (typeface names, weights), logo files/marks, and any imagery/tone
     guidance (photography style, iconography, voice).
   - Fetch `https://greenhousechurch.org/` and look at its actual CSS/assets
     (view source, inspect computed styles, download the logo from the
     header/favicon) since the live site may have evolved past the original
     Taproot deliverable and is the more authoritative current source.
   - Reconcile any differences between the two sources; prefer the live
     site for anything the case study doesn't cover.

2. **Update the brand tokens** in `src/styles/brand.css`:
   - Replace `--color-primary`, `--color-primary-dark`, `--color-primary-light`,
     `--color-accent`, `--color-ink`, `--color-muted` with the real palette.
   - Replace `--font-heading` / `--font-body` with the real typefaces. If
     they're Google Fonts, update the `<link href="https://fonts.googleapis.com/...">`
     tag in the `<head>` of every HTML file (`index.html`, `handout.html`,
     `van-magnet.html`, `signs/*.html`) to load the correct families/weights.
     If they're licensed/self-hosted fonts, add the font files under
     `src/assets/fonts/` and `@font-face` declarations in `brand.css` instead.

3. **Replace the logo.**
   - Download the real logo (SVG preferred, PNG fallback) and save it as
     `src/assets/logo.svg` (and/or `logo.png`).
   - Replace every `<img src="/src/assets/logo-placeholder.svg">` reference
     across `index.html`, `handout.html`, `van-magnet.html`, and the three
     files in `signs/` with the real logo path. Delete
     `logo-placeholder.svg` once nothing references it.
   - Add a real favicon (`public/favicon.ico` or similar) linked from each
     page's `<head>`.

4. **Sanity-check the results.**
   - Run `npm run dev` and visually check all five pages (handout, 3 yard
     signs, van magnet) plus the `index.html` landing page.
   - Confirm text stays legible against the real palette — the yard signs
     and van magnet currently assume white text on a solid `--color-primary`
     background; if the real primary color is light, flip to dark text or
     adjust contrast so it still reads at a distance.
   - Confirm the accent color still stands out against the primary
     background where it's used (subtitles, permission-slip/transportation
     flags).
   - Re-check each `@page` print size still looks right via each page's
     "Print / Save as PDF" button.

5. **Remove this file's placeholder callout** in `index.html` (the "Branding
   note" box at the bottom of the landing page) once real branding is in
   place, or update it to reflect that branding is now final.

## Assumptions made that you may want to revisit

These weren't specified in the original request and were chosen as
reasonable defaults — confirm with whoever's ordering the physical prints:

- Yard signs: 24in × 18in landscape (common coroplast H-stake sign size).
- Van magnet: 18in × 12in landscape.
- Handout: 8.5in × 11in portrait, single page, all three programs on one
  sheet.
