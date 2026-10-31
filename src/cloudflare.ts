import {
  CLOUDFLARE_COMPATIBILITY_DATE,
  CLOUDFLARE_WORKERS_TYPES_VERSION,
  OPENNEXT_CLOUDFLARE_VERSION,
  UNDICI_OVERRIDE_VERSION,
  WRANGLER_VERSION,
} from "./versions";

export type Template = "nextjs" | "tanstack-start";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  [key: string]: unknown;
};

// OpenNext builds the Worker into .open-next/; wrangler needs the entry point and assets.
// (TanStack Start needs neither: nitro's cloudflare_module preset generates its own
// wrangler.json from wrangler.toml.)
const OPENNEXT_WORKER_CONFIG = `main = ".open-next/worker.js"
`;

const OPENNEXT_ASSETS_CONFIG = `
[assets]
directory = ".open-next/assets"
binding = "ASSETS"
`;

/**
 * Adds wrangler, Workers types and the undici override to a generated package.json.
 * Idempotent: safe to call from both the auth and cloudflare feature steps.
 */
export function addCloudflareTooling(pkgJson: PackageJson, template: Template): void {
  pkgJson.devDependencies = {
    ...pkgJson.devDependencies,
    wrangler: WRANGLER_VERSION,
    "@cloudflare/workers-types": CLOUDFLARE_WORKERS_TYPES_VERSION,
  };

  // Drop once wrangler >=4.153 is more than 5 days old (see UNDICI_OVERRIDE_VERSION).
  pkgJson.overrides = { ...pkgJson.overrides, undici: UNDICI_OVERRIDE_VERSION };

  if (template === "nextjs") {
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      "@opennextjs/cloudflare": OPENNEXT_CLOUDFLARE_VERSION,
    };
  }
}

/** Build/preview/deploy scripts for running the generated app on Cloudflare Workers. */
export function cloudflareScripts(
  projectName: string,
  bindings: string[],
  template: Template
): Record<string, string> {
  const scripts: Record<string, string> =
    template === "nextjs"
      ? {
          "build:cf": "opennextjs-cloudflare build",
          "preview:cf": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
          "deploy:cf": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
          "cf-typegen": "wrangler types --env-interface CloudflareEnv",
        }
      : {
          "build:cf": "NITRO_PRESET=cloudflare_module vite build",
          "preview:cf": "bun run build:cf && wrangler dev",
          "deploy:cf": "bun run build:cf && wrangler deploy",
        };

  if (bindings.includes("d1")) {
    scripts["db:create"] = `wrangler d1 create ${projectName}-db`;
    scripts["db:migrate"] = `wrangler d1 migrations apply ${projectName}-db --remote`;
    scripts["db:migrate:local"] = `wrangler d1 migrations apply ${projectName}-db --local`;
  }

  return scripts;
}

export const OPEN_NEXT_CONFIG = `import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
`;

export function generateWranglerConfig(
  projectName: string,
  bindings: string[],
  template: Template
): string {
  let config = `name = "${projectName}"
${template === "nextjs" ? OPENNEXT_WORKER_CONFIG : ""}compatibility_date = "${CLOUDFLARE_COMPATIBILITY_DATE}"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
`;

  if (bindings.includes("d1")) {
    config += `
[[d1_databases]]
binding = "DB"
database_name = "${projectName}-db"
database_id = "<run 'bun run db:create' and paste the ID here>"
`;
  }

  if (bindings.includes("kv")) {
    config += `
[[kv_namespaces]]
binding = "KV"
id = "<run 'wrangler kv namespace create KV' and paste the ID here>"
`;
  }

  if (bindings.includes("r2")) {
    config += `
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "${projectName}-bucket"
`;
  }

  if (bindings.includes("ai")) {
    config += `
[ai]
binding = "AI"
`;
  }

  if (bindings.includes("queues")) {
    config += `
[[queues.producers]]
binding = "QUEUE"
queue = "${projectName}-queue"

[[queues.consumers]]
queue = "${projectName}-queue"
max_batch_size = 10
max_batch_timeout = 5
`;
  }

  if (template === "nextjs") {
    config += OPENNEXT_ASSETS_CONFIG;
  }

  return config;
}

const OPENNEXT_DEV_IMPORT = `import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";`;

/**
 * Makes Cloudflare bindings (getCloudflareContext) available under `next dev`.
 * Idempotent: returns the source unchanged if it is already wired up.
 */
export function withOpenNextDevInit(nextConfigSource: string): string {
  if (nextConfigSource.includes("initOpenNextCloudflareForDev")) {
    return nextConfigSource;
  }
  return `${OPENNEXT_DEV_IMPORT}\n${nextConfigSource.trimEnd()}\n\ninitOpenNextCloudflareForDev();\n`;
}
