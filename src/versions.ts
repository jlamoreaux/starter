/**
 * Pinned versions of the upstream scaffolders this CLI invokes.
 *
 * Never use `@latest` here: a floating tag pulls whatever was published
 * minutes ago (no supply-chain cooldown) and makes generated projects
 * non-reproducible. Bump these deliberately.
 */
export const CREATE_NEXT_APP_VERSION = "16.4.3";
export const CREATE_TANSTACK_START_VERSION = "0.59.45";

export const CREATE_NEXT_APP_PACKAGE = `create-next-app@${CREATE_NEXT_APP_VERSION}`;
export const CREATE_TANSTACK_START_PACKAGE = `@tanstack/create-start@${CREATE_TANSTACK_START_VERSION}`;

/**
 * Cloudflare tooling written into generated projects. Exact or tilde ranges
 * only, each published at least 5 days before it was adopted here.
 */
export const WRANGLER_VERSION = "~4.152.0";
export const CLOUDFLARE_WORKERS_TYPES_VERSION = "~5.20261024.1";
/** OpenNext adapter for Next.js on Workers (peer: next >=16.4.1, wrangler ^4.148.0). */
export const OPENNEXT_CLOUDFLARE_VERSION = "1.20.13";

/**
 * Forces wrangler/miniflare onto a patched undici.
 * TODO: drop this override once wrangler >=4.153 has been published for more
 * than 5 days and WRANGLER_VERSION is bumped to it.
 */
export const UNDICI_OVERRIDE_VERSION = "7.30.1";

/** compatibility_date for newly generated Workers (no existing behavior to preserve). */
export const CLOUDFLARE_COMPATIBILITY_DATE = "2026-10-01";

/**
 * @tailwindcss/typography (<=0.5.20) pins postcss-selector-parser 6.0.10, which is
 * affected by GHSA-rj75-hqrm-r3gf (fixed in 6.1.5). Applied only when the generated
 * project depends on @tailwindcss/typography.
 * TODO: drop once a typography release depends on postcss-selector-parser >=6.1.5.
 */
export const POSTCSS_SELECTOR_PARSER_OVERRIDE_VERSION = "6.1.5";

/**
 * Supply-chain cooldown for the generated project's install: bun refuses any
 * package version published less than this many seconds ago (5 days), so a
 * freshly compromised release can't land in a new project before it is caught.
 */
export const MINIMUM_RELEASE_AGE_SECONDS = 432_000;
