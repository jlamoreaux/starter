import { describe, expect, test } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  CLOUDFLARE_COMPATIBILITY_DATE,
  CLOUDFLARE_WORKERS_TYPES_VERSION,
  CREATE_NEXT_APP_PACKAGE,
  CREATE_NEXT_APP_VERSION,
  CREATE_TANSTACK_START_PACKAGE,
  CREATE_TANSTACK_START_VERSION,
  OPENNEXT_CLOUDFLARE_VERSION,
  UNDICI_OVERRIDE_VERSION,
  WRANGLER_VERSION,
} from "./versions";

const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;
const EXACT_OR_TILDE = /^~?\d+\.\d+\.\d+$/;

/** Every file the CLI writes into generated projects or builds them from. */
async function generatorSources(): Promise<Array<{ path: string; content: string }>> {
  const root = join(import.meta.dir, "..");
  const templateFiles = (await readdir(join(root, "templates"), { recursive: true })).map((f) =>
    join("templates", f)
  );
  const paths = ["src/index.ts", "src/cloudflare.ts", "src/versions.ts", ...templateFiles];
  const sources = [];
  for (const path of paths) {
    const content = await readFile(join(root, path), "utf-8").catch(() => null); // directories
    if (content !== null) sources.push({ path, content });
  }
  return sources;
}

describe("pinned scaffolder versions", () => {
  test("create-next-app is pinned to an exact version", () => {
    expect(CREATE_NEXT_APP_VERSION).toMatch(EXACT_SEMVER);
    expect(CREATE_NEXT_APP_PACKAGE).toBe(`create-next-app@${CREATE_NEXT_APP_VERSION}`);
  });

  test("@tanstack/create-start is pinned to an exact version", () => {
    expect(CREATE_TANSTACK_START_VERSION).toMatch(EXACT_SEMVER);
    expect(CREATE_TANSTACK_START_PACKAGE).toBe(
      `@tanstack/create-start@${CREATE_TANSTACK_START_VERSION}`
    );
  });

  test("the CLI source never requests a floating latest tag", async () => {
    const source = await readFile(join(import.meta.dir, "index.ts"), "utf-8");
    expect(source).not.toMatch(/@latest\b/);
    expect(source).not.toMatch(/:\s*"latest"/);
  });
});

describe("Cloudflare tooling written into generated projects", () => {
  test("versions are exact or tilde-pinned, never floating", () => {
    expect(WRANGLER_VERSION).toMatch(EXACT_OR_TILDE);
    expect(WRANGLER_VERSION).not.toMatch(/^~?3\./);
    expect(CLOUDFLARE_WORKERS_TYPES_VERSION).toMatch(EXACT_OR_TILDE);
    expect(CLOUDFLARE_WORKERS_TYPES_VERSION).not.toMatch(/^~?4\./);
    expect(OPENNEXT_CLOUDFLARE_VERSION).toMatch(EXACT_SEMVER);
    expect(UNDICI_OVERRIDE_VERSION).toMatch(EXACT_SEMVER);
    expect(CLOUDFLARE_COMPATIBILITY_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("no generator source references wrangler 3, next-on-pages or vinxi", async () => {
    const offenders = (await generatorSources())
      .filter(({ content }) => /wrangler"?\s*[:@]\s*"?\^?3\.|next-on-pages|vinxi/i.test(content))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});
