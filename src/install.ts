import { spawn } from "bun";
import { MINIMUM_RELEASE_AGE_SECONDS } from "./versions";

export const INSTALL_COMMAND = [
  "bun",
  "install",
  `--minimum-release-age=${MINIMUM_RELEASE_AGE_SECONDS}`,
] as const;

export type InstallResult = { ok: true } | { ok: false; exitCode: number; output: string };

/** Runs the cooldown install in `cwd`. Never falls back to an install without the cooldown. */
export async function installDependencies(cwd: string): Promise<InstallResult> {
  const proc = spawn({ cmd: [...INSTALL_COMMAND], cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode === 0) return { ok: true };
  return { ok: false, exitCode, output: `${stdout}\n${stderr}`.trim() };
}

const COOLDOWN_REJECTION = /Version "([^"]+)" was published within minimum release age/g;

/** Package specs bun rejected because they are newer than the cooldown. */
export function findCooldownRejections(output: string): string[] {
  return [...new Set([...output.matchAll(COOLDOWN_REJECTION)].map((m) => m[1]))];
}

/** Builds an actionable error for a failed install. */
export function describeInstallFailure(
  result: { exitCode: number; output: string },
  template: string
): string {
  const rejected = findCooldownRejections(result.output);
  const days = MINIMUM_RELEASE_AGE_SECONDS / 86_400;

  if (rejected.length > 0) {
    const source =
      template === "tanstack-start"
        ? "The TanStack Start generator pins some packages to whatever was newest when it ran, so brand-new releases can land in package.json."
        : "The project generator wrote package versions that are newer than the cooldown allows.";
    return [
      `Dependency install failed: ${rejected.length} package version(s) were published less than ${days} days ago and are blocked by the supply-chain cooldown:`,
      ...rejected.map((spec) => `  - ${spec}`),
      source,
      "To fix: in package.json, change each listed package to its previous release (older than the cooldown), then run:",
      `  ${INSTALL_COMMAND.join(" ")}`,
      "Or wait until those versions are old enough and rerun the same command.",
    ].join("\n");
  }

  const tail = result.output.split("\n").slice(-15).join("\n");
  return [
    `Dependency install failed (\`${INSTALL_COMMAND.join(" ")}\` exited with code ${result.exitCode}).`,
    tail,
    `Fix the problem above, then run \`${INSTALL_COMMAND.join(" ")}\` in the project directory.`,
  ].join("\n");
}
