import { describe, expect, test } from "bun:test";
import {
  addCloudflareTooling,
  cloudflareScripts,
  generateWranglerConfig,
  withOpenNextDevInit,
} from "./cloudflare";
import {
  CLOUDFLARE_COMPATIBILITY_DATE,
  CLOUDFLARE_WORKERS_TYPES_VERSION,
  OPENNEXT_CLOUDFLARE_VERSION,
  UNDICI_OVERRIDE_VERSION,
  WRANGLER_VERSION,
} from "./versions";

describe("addCloudflareTooling", () => {
  test("adds wrangler, workers-types and the undici override, keeping existing entries", () => {
    const pkg: {
      devDependencies?: Record<string, string>;
      overrides?: Record<string, string>;
    } = {
      devDependencies: { typescript: "^5" },
      overrides: { foo: "1.0.0" },
    };
    addCloudflareTooling(pkg, "tanstack-start");
    expect(pkg.devDependencies).toEqual({
      typescript: "^5",
      wrangler: WRANGLER_VERSION,
      "@cloudflare/workers-types": CLOUDFLARE_WORKERS_TYPES_VERSION,
    });
    expect(pkg.overrides).toEqual({ foo: "1.0.0", undici: UNDICI_OVERRIDE_VERSION });
    expect(pkg).not.toHaveProperty("dependencies");
  });

  test("adds the OpenNext adapter for Next.js", () => {
    const pkg: { dependencies?: Record<string, string> } = {};
    addCloudflareTooling(pkg, "nextjs");
    expect(pkg.dependencies?.["@opennextjs/cloudflare"]).toBe(OPENNEXT_CLOUDFLARE_VERSION);
  });
});

describe("cloudflareScripts", () => {
  test("TanStack Start builds with nitro's cloudflare_module preset and deploys with wrangler", () => {
    expect(cloudflareScripts("app", [], "tanstack-start")).toEqual({
      "build:cf": "NITRO_PRESET=cloudflare_module vite build",
      "preview:cf": "wrangler dev",
      "deploy:cf": "wrangler deploy",
    });
  });

  test("Next.js builds and deploys with OpenNext", () => {
    const scripts = cloudflareScripts("app", [], "nextjs");
    expect(scripts["build:cf"]).toBe("opennextjs-cloudflare build");
    expect(scripts["deploy:cf"]).toBe(
      "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
    );
  });

  test("D1 migrations target remote by default, with an explicit local variant", () => {
    const scripts = cloudflareScripts("app", ["d1"], "tanstack-start");
    expect(scripts["db:migrate"]).toBe("wrangler d1 migrations apply app-db --remote");
    expect(scripts["db:migrate:local"]).toBe("wrangler d1 migrations apply app-db --local");
  });
});

describe("generateWranglerConfig", () => {
  test("uses the pinned compatibility date", () => {
    const config = generateWranglerConfig("app", [], "tanstack-start");
    expect(config).toContain(`compatibility_date = "${CLOUDFLARE_COMPATIBILITY_DATE}"`);
    expect(config).not.toContain("main =");
  });

  test("points Next.js at the OpenNext worker and assets", () => {
    const config = generateWranglerConfig("app", ["d1"], "nextjs");
    expect(config).toContain('main = ".open-next/worker.js"');
    expect(config).toContain('directory = ".open-next/assets"');
    expect(config).toContain('binding = "DB"');
  });
});

describe("withOpenNextDevInit", () => {
  test("wires up bindings for next dev exactly once", () => {
    const source = 'import type { NextConfig } from "next";\nexport default {} as NextConfig;\n';
    const once = withOpenNextDevInit(source);
    expect(once).toContain("initOpenNextCloudflareForDev();");
    expect(withOpenNextDevInit(once)).toBe(once);
  });
});
