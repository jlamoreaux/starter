import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  INSTALL_COMMAND,
  describeInstallFailure,
  findCooldownRejections,
  installDependencies,
} from "./install";
import { MINIMUM_RELEASE_AGE_SECONDS } from "./versions";

const BUN_COOLDOWN_OUTPUT = `bun install v1.3.5
error: Version "@tanstack/devtools-vite@0.8.6" was published within minimum release age of 432000 seconds
error: Version "@tanstack/react-devtools@0.10.14" was published within minimum release age of 432000 seconds
error: @tanstack/devtools-vite@0.8.6 failed to resolve`;

const tempDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("install command", () => {
  test("always applies the 5-day supply-chain cooldown", () => {
    expect(MINIMUM_RELEASE_AGE_SECONDS).toBe(5 * 24 * 60 * 60);
    expect(INSTALL_COMMAND).toEqual([
      "bun",
      "install",
      `--minimum-release-age=${MINIMUM_RELEASE_AGE_SECONDS}`,
    ]);
  });
});

describe("installDependencies", () => {
  test("reports failure with the exit code instead of succeeding", async () => {
    const dir = await mkdtemp(join(tmpdir(), "starter-install-"));
    tempDirs.push(dir);
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "x", dependencies: { missing: "file:./does-not-exist" } })
    );
    const result = await installDependencies(dir);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.exitCode).not.toBe(0);
  });

  test("succeeds for a project with nothing to install", async () => {
    const dir = await mkdtemp(join(tmpdir(), "starter-install-"));
    tempDirs.push(dir);
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "x" }));
    expect(await installDependencies(dir)).toEqual({ ok: true });
  });
});

describe("describeInstallFailure", () => {
  test("names packages blocked by the cooldown and how to fix them", () => {
    expect(findCooldownRejections(BUN_COOLDOWN_OUTPUT)).toEqual([
      "@tanstack/devtools-vite@0.8.6",
      "@tanstack/react-devtools@0.10.14",
    ]);
    const message = describeInstallFailure(
      { exitCode: 1, output: BUN_COOLDOWN_OUTPUT },
      "tanstack-start"
    );
    expect(message).toContain("@tanstack/devtools-vite@0.8.6");
    expect(message).toContain("TanStack Start generator");
    expect(message).toContain(INSTALL_COMMAND.join(" "));
  });

  test("falls back to the install output for other failures", () => {
    const message = describeInstallFailure({ exitCode: 1, output: "error: ENOSPC" }, "nextjs");
    expect(message).toContain("exited with code 1");
    expect(message).toContain("ENOSPC");
  });
});
