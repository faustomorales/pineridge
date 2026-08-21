# Greenhouse Church — Brand Guide

Distilled from `greenhousechurch.org` (page source of a saved copy of the
live homepage, since the site blocks bot traffic with Cloudflare — the
Taproot case study at `taproot.agency/project/greenhouse-church/` also
403s and could not be used directly). This is the source of truth behind
`src/styles/brand.css`; update both together if the real site's brand
changes.

## Color palette

Named Tailwind tokens pulled from the site's own CSS
(`.text-greenhouse`, `.bg-connect`, etc.):

| Token | Hex | RGB | Used here as |
|---|---|---|---|
| `greenhouse` | `#66845B` | 102 132 91 | `--color-primary` — the current brand green, used in the logo icon |
| `connect` | `#404752` | 64 71 82 | `--color-ink` — dark slate, from the logo wordmark |
| `catalyst` | `#161A1D` | 22 26 29 | `--color-primary-dark` — near-black, used for high-contrast text/surfaces |
| `community` | `#27AAF3` | 39 170 243 | `--color-accent` — bright blue |
| `ash` | `#F1F3F5` | 241 243 245 | `--color-primary-light` — near-white |
| `blood` | `#D43535` | 212 53 53 | not currently used in this repo; reserved (alerts/errors on the real site) |
| `--color-muted` | `#728197` | — | not one of the named tokens; a mid-gray we chose to sit between `connect` and `ash` for de-emphasized text (captions, footers) |

**Contrast note:** Text and icons placed on a `greenhouse` background in
this repo use `catalyst` or `connect`. Recheck contrast with a calculator
if you introduce a new green-background placement.

## Typography

- **Heading**: `Anton` — a free Google Font, condensed all-caps display
  face. Loaded via the standard `fonts.googleapis.com` link tag.
- **Body**: real site uses `objektiv-mk1`, a commercial typeface served
  through Adobe Typekit (`use.typekit.net`) — not usable here without a
  kit ID. This repo substitutes **Manrope** (also a free Google Font) as
  a visually close geometric-sans stand-in. If a Typekit kit ID becomes
  available, swap the `<link>` tags for a Typekit `<script>` embed and
  update `--font-body` to `objektiv-mk1`.

## Logo

Two official SVGs, both green icon + optional dark wordmark:

- **Full lockup** (`src/assets/logo-full.svg`, sourced from
  `greenhousechurch.org/wp-content/uploads/2023/10/logo-primary.svg`) —
  wide format (210×36 viewBox, ~5.8:1 aspect ratio), icon + "GREENHOUSE"
  wordmark. Best for wide horizontal spaces with no adjacent text label.
  Not currently used anywhere in this repo — every logo slot here is a
  fixed square-ish box, which the wide lockup would distort.
- **Icon mark** (`src/assets/logo.svg`, sourced from
  `greenhousechurch.org/wp-content/uploads/2023/10/logo-mark.svg`) —
  square-ish (54×36 viewBox), icon only, no wordmark. Used for every logo
  placement in this repo (page headers, watermarks, favicon) since they're
  all small fixed-size boxes usually paired with a separate "GREENHOUSE
  CHURCH" text label.

Both use the current green (`#66845B`) for the icon and dark slate (`#404752`)
for any wordmark strokes — no other logo color variants (e.g. white/reversed
for dark backgrounds) were found on the live site.

## Favicon

The real site's `/favicon.ico` returns HTTP 200 but is a genuine 0-byte
file — nothing to extract. This repo instead links `logo.svg` directly as
an SVG favicon (`<link rel="icon" type="image/svg+xml">`), which all
modern browsers support natively.

## Imagery / tone (not implemented here)

The live site's photography is warm, natural-light, people-and-community
focused (worship gatherings, small groups, youth activities) — candid
rather than posed. This repo's collateral (handout, van magnet) is
text/color only and doesn't use photography, so this is noted for
reference only in case future pieces want to match tone.
