# ADR 0001: Statically generate the site with SvelteKit

## Status

Accepted

## Decision

Use SvelteKit with `adapter-static`, prerender every route, and emit the deployable site to `dist`. Keep GitHub Pages deployment and the custom `public/CNAME` domain configuration. Expose `/`, `/assessment`, `/handout`, `/van-magnet`, and `/student-expectations`; do not retain the former `.html` URLs.

Existing collateral remains page-scoped Svelte markup and CSS. Its physical-inch sheet dimensions, browser preview scaling, print rules, and student-expectations layout tooling are preserved.

## Consequences

The application requires no server runtime. New routes must be prerenderable, and browser-only behavior must initialize on the client.
