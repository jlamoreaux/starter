import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "bun";

/**
 * Build integrity tests.
 *
 * These tests rebuild dist/index.js and assert that all symbols from local
 * modules are present in the bundle. This catches missing imports — e.g. a
 * function extracted to a separate file whose import was never committed.
 */

let distContent = "";

beforeAll(async () => {
  const proc = spawn({
    cmd: [
      "bun",
      "build",
      "./src/index.ts",
      "--outdir",
      "./dist",
      "--target",
      "bun",
      "--packages",
      "external",
    ],
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });

  await proc.exited;

  if (proc.exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`Build failed:\n${err}`);
  }

  distContent = await readFile(join(import.meta.dir, "..", "dist", "index.js"), "utf-8");
});

afterAll(() => {
  distContent = "";
});

describe("build output", () => {
  test("bundles more than one module (catches missing local imports)", () => {
    // "Bundled N modules" appears in bun build stdout, but we verify the
    // effect directly: a single-module bundle means local imports were lost.
    // src/args.ts + src/index.ts = at least 2 modules worth of content.
    // The simplest proxy is checking that the args module's function definition
    // is present rather than just called.
    const defined = /function getFlagValue\(/.test(distContent);
    expect(defined).toBe(true);
  });

  test("getFlagValue is defined before its first call site", () => {
    const definitionIndex = distContent.indexOf("function getFlagValue(");
    const firstCallIndex = distContent.indexOf("getFlagValue(args,");
    expect(definitionIndex).toBeGreaterThanOrEqual(0);
    expect(firstCallIndex).toBeGreaterThan(0);
    expect(definitionIndex).toBeLessThan(firstCallIndex);
  });

  test("dist/index.js has a shebang for direct execution", () => {
    expect(distContent.startsWith("#!/usr/bin/env bun")).toBe(true);
  });
});
