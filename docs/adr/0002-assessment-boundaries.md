# ADR 0002: Keep assessment concerns separate and anonymous

## Status

Accepted

## Decision

Separate authored assessment content, the deterministic assessment state machine, official Resource Link metadata, and the Svelte interface. An Assessment Run exists only in browser memory and stores no identity, analytics, results, or browser history.

Official resources are linked rather than copied. The assessment uses original content described as created to align with UFLI's scope and sequence, includes a non-endorsement statement, and presents its Starting Point as an unvalidated tutor-facing suggestion.

## Consequences

Content and Resource Links can be reviewed independently of scoring. The browser does not scrape live resource pages, and a static deployment remains sufficient.
