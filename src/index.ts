#!/usr/bin/env bun
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import { spawn } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, "..", "templates");

const VERSION = "0.1.0";

function generateWranglerConfig(projectName: string, bindings: string[]): string {
  let config = `name = "${projectName}"
compatibility_date = "2024-12-30"
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
id = "<run 'wrangler kv:namespace create KV' and paste the ID here>"
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

  return config;
}

function generateSetupInstructions(
  projectName: string,
  bindings: string[],
  hasAuth: boolean
): string {
  let instructions = `# Cloudflare Setup

Complete these steps to finish configuring your Cloudflare bindings.

`;

  if (bindings.includes("d1")) {
    instructions += `## D1 Database

1. Create the database:
   \`\`\`bash
   bun run db:create
   \`\`\`

2. Copy the \`database_id\` from the output and paste it into \`wrangler.toml\`

3. Apply migrations locally:
   \`\`\`bash
   bun run db:migrate:local
   \`\`\`

`;

    if (hasAuth) {
      instructions += `## Authentication (Better Auth)

The auth tables are already included in \`migrations/0001_auth_tables.sql\`.

1. Copy \`.env.example\` to \`.env\` and set your secrets:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Generate a secure secret:
   \`\`\`bash
   openssl rand -base64 32
   \`\`\`

3. Use the auth client in your components:
   \`\`\`tsx
   import { useSession, signIn, signOut } from "~/lib/auth.client";

   function AuthButton() {
     const { data: session } = useSession();

     if (session) {
       return <button onClick={() => signOut()}>Sign Out</button>;
     }
     return <button onClick={() => signIn.email({ email, password })}>Sign In</button>;
   }
   \`\`\`

`;
    }
  }

  if (bindings.includes("kv")) {
    instructions += `## KV Namespace

1. Create the namespace:
   \`\`\`bash
   wrangler kv:namespace create KV
   \`\`\`

2. Copy the \`id\` from the output and paste it into \`wrangler.toml\`

`;
  }

  if (bindings.includes("r2")) {
    instructions += `## R2 Bucket

1. Create the bucket:
   \`\`\`bash
   wrangler r2 bucket create ${projectName}-bucket
   \`\`\`

`;
  }

  if (bindings.includes("ai")) {
    instructions += `## Workers AI

Workers AI is automatically available. Use it in your code:

\`\`\`typescript
const result = await c.env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
  prompt: "Hello, world!"
});
\`\`\`

`;
  }

  if (bindings.includes("queues")) {
    instructions += `## Queues

1. Create the queue:
   \`\`\`bash
   wrangler queues create ${projectName}-queue
   \`\`\`

2. Send messages:
   \`\`\`typescript
   await c.env.QUEUE.send({ type: "email", to: "user@example.com" });
   \`\`\`

`;
  }

  instructions += `## Deploy

\`\`\`bash
bun run deploy:cf
\`\`\`
`;

  return instructions;
}

const HELP_TEXT = `
@jlmx/starter v${VERSION}

Scaffold new projects with jlmx's preferred stack.

Usage:
  bunx @jlmx/starter [project-name] [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Examples:
  bunx @jlmx/starter my-app
  bunx @jlmx/starter

Templates:
  tanstack-start  Full-stack React with TanStack Router
  nextjs          Full-stack React with App Router

Features:
  tailwind        Tailwind CSS with jlmx design system
  fonts           Inter + JetBrains Mono via Fontsource
  auth            Better Auth + Drizzle ORM (requires D1)
  cloudflare      Cloudflare Workers deployment config

Cloudflare Bindings:
  d1              SQLite database at the edge
  r2              S3-compatible object storage
  kv              Key-value storage
  ai              Workers AI models
  queues          Message queues
`;

async function main() {
  const args = process.argv.slice(2);

  // Handle flags
  if (args.includes("-h") || args.includes("--help")) {
    console.info(HELP_TEXT);
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.info(VERSION);
    process.exit(0);
  }

  console.clear();
  p.intro("@jlmx/starter");

  // Filter out flags to get project name
  let projectName = args.find((arg) => !arg.startsWith("-"));

  if (!projectName) {
    const nameResult = await p.text({
      message: "Project name:",
      placeholder: "my-app",
      validate: (value) => {
        if (!value) return "Project name is required";
        if (!/^[a-z0-9-]+$/.test(value)) return "Use lowercase letters, numbers, and hyphens only";
      },
    });

    if (p.isCancel(nameResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    projectName = nameResult;
  }

  const template = await p.select({
    message: "Select a template:",
    options: [
      {
        value: "tanstack-start",
        label: "TanStack Start",
        hint: "Full-stack React with TanStack Router",
      },
      {
        value: "nextjs",
        label: "Next.js",
        hint: "Full-stack React with App Router",
      },
    ],
  });

  if (p.isCancel(template)) {
    p.cancel("Cancelled");
    process.exit(0);
  }

  const features = await p.multiselect({
    message: "Select features:",
    options: [
      { value: "tailwind", label: "Tailwind CSS", hint: "design system + tailwindcss-animate" },
      { value: "fonts", label: "Custom Fonts", hint: "Inter + JetBrains Mono" },
      { value: "auth", label: "Authentication", hint: "Better Auth + D1" },
      { value: "cloudflare", label: "Cloudflare Workers", hint: "deployment config" },
    ],
    initialValues: ["tailwind", "fonts", "cloudflare"],
  });

  if (p.isCancel(features)) {
    p.cancel("Cancelled");
    process.exit(0);
  }

  const selectedFeatures = features as string[];
  let cfBindings: string[] = [];

  // Auth requires Cloudflare + D1
  if (selectedFeatures.includes("auth")) {
    if (!selectedFeatures.includes("cloudflare")) {
      selectedFeatures.push("cloudflare");
      p.log.info("Cloudflare Workers enabled (required for auth)");
    }
  }

  // Ask about Cloudflare platform features if cloudflare is selected
  if (selectedFeatures.includes("cloudflare")) {
    const needsD1 = selectedFeatures.includes("auth");

    const bindings = await p.multiselect({
      message: "Cloudflare platform features:",
      options: [
        {
          value: "d1",
          label: "D1 Database",
          hint: needsD1 ? "required for auth" : "SQLite at the edge",
        },
        { value: "r2", label: "R2 Storage", hint: "S3-compatible object storage" },
        { value: "kv", label: "KV Store", hint: "key-value storage" },
        { value: "ai", label: "Workers AI", hint: "run AI models" },
        { value: "queues", label: "Queues", hint: "message queues" },
      ],
      initialValues: needsD1 ? ["d1"] : [],
      required: false,
    });

    if (p.isCancel(bindings)) {
      p.cancel("Cancelled");
      process.exit(0);
    }

    cfBindings = bindings as string[];

    // Ensure D1 is included if auth is selected
    if (needsD1 && !cfBindings.includes("d1")) {
      cfBindings.push("d1");
      p.log.info("D1 Database enabled (required for auth)");
    }
  }

  const projectPath = resolve(process.cwd(), projectName);
  const selectedTemplate = template as string;

  const s = p.spinner();

  // Step 1: Scaffold base project
  if (selectedTemplate === "tanstack-start") {
    s.start("Creating TanStack Start project...");

    const proc = spawn({
      cmd: ["bun", "create", "@tanstack/start@latest", projectName],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      stdin: "inherit",
    });

    await proc.exited;

    if (proc.exitCode !== 0) {
      s.stop("Failed to create TanStack Start project");
      process.exit(1);
    }

    s.stop("TanStack Start project created");
  } else if (selectedTemplate === "nextjs") {
    s.start("Creating Next.js project...");

    const proc = spawn({
      cmd: [
        "bunx",
        "create-next-app@latest",
        projectName,
        "--typescript",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
        "--no-import-alias",
        "--turbopack",
      ],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      stdin: "inherit",
    });

    await proc.exited;

    if (proc.exitCode !== 0) {
      s.stop("Failed to create Next.js project");
      process.exit(1);
    }

    s.stop("Next.js project created");
  }

  // Step 2: Apply selected features
  // Determine paths based on template
  const appDir =
    selectedTemplate === "nextjs" ? join(projectPath, "src", "app") : join(projectPath, "app");
  const libDir =
    selectedTemplate === "nextjs"
      ? join(projectPath, "src", "lib")
      : join(projectPath, "app", "lib");
  const componentsDir =
    selectedTemplate === "nextjs"
      ? join(projectPath, "src", "components", "ui")
      : join(projectPath, "app", "components", "ui");

  // Copy shared utilities (logger, result type)
  s.start("Adding core utilities...");
  await mkdir(libDir, { recursive: true });
  await cp(join(templatesDir, "shared", "logger.ts"), join(libDir, "logger.ts"));
  await cp(join(templatesDir, "shared", "result.ts"), join(libDir, "result.ts"));
  s.stop("Core utilities added");

  // Setup Biome (linting + formatting)
  s.start("Configuring Biome...");
  await cp(join(templatesDir, "shared", "biome.json"), join(projectPath, "biome.json"));

  const pkgJsonPath = join(projectPath, "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

  pkgJson.devDependencies = {
    ...pkgJson.devDependencies,
    "@biomejs/biome": "^1.9.4",
  };

  pkgJson.scripts = {
    ...pkgJson.scripts,
    lint: "biome check .",
    "lint:fix": "biome check --write .",
    format: "biome format --write .",
  };

  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  s.stop("Biome configured");

  if (selectedFeatures.includes("tailwind")) {
    s.start("Applying jlmx design system...");

    // Copy globals.css
    if (selectedTemplate === "nextjs") {
      // Next.js already has globals.css, we'll overwrite it
      await cp(join(templatesDir, "nextjs", "styles", "globals.css"), join(appDir, "globals.css"));
      await cp(
        join(templatesDir, "nextjs", "tailwind.config.ts"),
        join(projectPath, "tailwind.config.ts")
      );
    } else {
      const projectStylesDir = join(appDir, "styles");
      await mkdir(projectStylesDir, { recursive: true });
      await cp(
        join(templatesDir, "tanstack-start", "styles", "globals.css"),
        join(projectStylesDir, "globals.css")
      );
      await cp(
        join(templatesDir, "tanstack-start", "tailwind.config.ts"),
        join(projectPath, "tailwind.config.ts")
      );
    }

    // Add tailwindcss-animate to package.json
    const pkgJsonPath = join(projectPath, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

    pkgJson.devDependencies = {
      ...pkgJson.devDependencies,
      "tailwindcss-animate": "^1.0.7",
    };

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    s.stop("Design system applied");
  }

  if (selectedFeatures.includes("fonts")) {
    s.start("Adding custom fonts...");

    const pkgJsonPath = join(projectPath, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      "@fontsource-variable/inter": "^5.1.1",
      "@fontsource-variable/jetbrains-mono": "^5.1.1",
    };

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    // Copy font setup file
    await cp(join(templatesDir, "tanstack-start", "fonts.ts"), join(appDir, "fonts.ts"));

    s.stop("Fonts configured");
  }

  if (selectedFeatures.includes("auth")) {
    s.start("Setting up Better Auth + Drizzle...");

    const pkgJsonPath = join(projectPath, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

    // Add Better Auth + Drizzle dependencies
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      "better-auth": "^1.2.0",
      "drizzle-orm": "^0.38.0",
      clsx: "^2.1.0",
      "tailwind-merge": "^2.2.0",
    };

    pkgJson.devDependencies = {
      ...pkgJson.devDependencies,
      "drizzle-kit": "^0.30.0",
      "@cloudflare/workers-types": "^4.20241230.0",
    };

    // Add auth/db scripts
    pkgJson.scripts = {
      ...pkgJson.scripts,
      "db:generate": "drizzle-kit generate",
      "db:migrate:local": `wrangler d1 migrations apply ${projectName}-db --local`,
      "db:migrate:prod": `wrangler d1 migrations apply ${projectName}-db --remote`,
      "db:studio": "drizzle-kit studio",
    };

    // Next.js on Cloudflare needs @cloudflare/next-on-pages
    if (selectedTemplate === "nextjs") {
      pkgJson.devDependencies["@cloudflare/next-on-pages"] = "^1.13.0";
    }

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    // Create lib directory
    await mkdir(libDir, { recursive: true });

    // Copy auth files based on template
    const authTemplateDir = join(templatesDir, selectedTemplate, "auth");

    if (selectedTemplate === "nextjs") {
      await cp(join(authTemplateDir, "auth.ts"), join(libDir, "auth.ts"));
      await cp(join(authTemplateDir, "auth-client.ts"), join(libDir, "auth-client.ts"));
      await cp(join(authTemplateDir, "schema.ts"), join(libDir, "schema.ts"));

      // Copy drizzle config
      await cp(join(authTemplateDir, "drizzle.config.ts"), join(projectPath, "drizzle.config.ts"));

      // Create API route: app/api/auth/[...all]/route.ts
      const apiAuthDir = join(appDir, "api", "auth", "[...all]");
      await mkdir(apiAuthDir, { recursive: true });
      await cp(join(authTemplateDir, "route.ts"), join(apiAuthDir, "route.ts"));

      // Create auth pages
      const loginDir = join(appDir, "login");
      const registerDir = join(appDir, "register");
      await mkdir(loginDir, { recursive: true });
      await mkdir(registerDir, { recursive: true });
      await cp(join(authTemplateDir, "login-page.tsx"), join(loginDir, "page.tsx"));
      await cp(join(authTemplateDir, "register-page.tsx"), join(registerDir, "page.tsx"));

      // Copy UI components
      await mkdir(componentsDir, { recursive: true });
      await cp(
        join(templatesDir, "nextjs", "components", "button.tsx"),
        join(componentsDir, "button.tsx")
      );
      await cp(
        join(templatesDir, "nextjs", "components", "input.tsx"),
        join(componentsDir, "input.tsx")
      );
      await cp(
        join(templatesDir, "nextjs", "components", "card.tsx"),
        join(componentsDir, "card.tsx")
      );
      await cp(join(templatesDir, "nextjs", "components", "utils.ts"), join(libDir, "utils.ts"));
    } else {
      // TanStack Start
      await cp(join(authTemplateDir, "auth.server.ts"), join(libDir, "auth.server.ts"));
      await cp(join(authTemplateDir, "auth.client.ts"), join(libDir, "auth.client.ts"));
      await cp(join(authTemplateDir, "schema.ts"), join(libDir, "schema.ts"));

      // Copy drizzle config
      await cp(join(authTemplateDir, "drizzle.config.ts"), join(projectPath, "drizzle.config.ts"));

      // Create API route: app/routes/api/auth/$.ts
      const apiAuthDir = join(appDir, "routes", "api", "auth");
      await mkdir(apiAuthDir, { recursive: true });
      await cp(join(authTemplateDir, "api.auth.$.ts"), join(apiAuthDir, "$.ts"));
    }

    // Create migrations directory and initial migration
    const migrationsDir = join(projectPath, "migrations");
    await mkdir(migrationsDir, { recursive: true });
    await cp(
      join(templatesDir, "tanstack-start", "auth", "0001_auth_tables.sql"),
      join(migrationsDir, "0001_auth_tables.sql")
    );

    // Create .env.example with auth secrets
    const envVarPrefix = selectedTemplate === "nextjs" ? "NEXT_PUBLIC_" : "VITE_";
    const envExample = `# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-here
BETTER_AUTH_URL=http://localhost:3000
${envVarPrefix}BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers (optional)
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Drizzle Studio (optional - for remote DB access)
# CLOUDFLARE_ACCOUNT_ID=
# CLOUDFLARE_D1_ID=
# CLOUDFLARE_API_TOKEN=
`;
    await writeFile(join(projectPath, ".env.example"), envExample);

    s.stop("Better Auth + Drizzle configured");
  }

  if (selectedFeatures.includes("cloudflare")) {
    s.start("Configuring Cloudflare Workers...");

    // Generate wrangler.toml with selected bindings
    const wranglerConfig = generateWranglerConfig(projectName, cfBindings);
    await writeFile(join(projectPath, "wrangler.toml"), wranglerConfig);

    // Update package.json with Cloudflare scripts
    const pkgJsonPath = join(projectPath, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

    if (selectedTemplate === "nextjs") {
      pkgJson.scripts = {
        ...pkgJson.scripts,
        "build:cf": "npx @cloudflare/next-on-pages",
        "preview:cf": "wrangler pages dev .vercel/output/static",
        "deploy:cf": "wrangler pages deploy .vercel/output/static",
      };
    } else {
      pkgJson.scripts = {
        ...pkgJson.scripts,
        "build:cf": "vinxi build --preset cloudflare-pages",
        "preview:cf": "wrangler pages dev",
        "deploy:cf": "wrangler pages deploy ./dist",
      };
    }

    // Add setup scripts for selected bindings
    if (cfBindings.includes("d1")) {
      pkgJson.scripts["db:create"] = `wrangler d1 create ${projectName}-db`;
      pkgJson.scripts["db:migrate"] = `wrangler d1 migrations apply ${projectName}-db`;
    }

    pkgJson.devDependencies = {
      ...pkgJson.devDependencies,
      wrangler: "^3.99.0",
    };

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    // Create setup instructions
    if (cfBindings.length > 0) {
      const hasAuth = selectedFeatures.includes("auth");
      const setupInstructions = generateSetupInstructions(projectName, cfBindings, hasAuth);
      await writeFile(join(projectPath, "CLOUDFLARE_SETUP.md"), setupInstructions);
    }

    s.stop("Cloudflare configured");
  }

  // Step 3: Install dependencies
  s.start("Installing dependencies...");

  const installProcess = spawn({
    cmd: ["bun", "install"],
    cwd: projectPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  await installProcess.exited;
  s.stop("Dependencies installed");

  // Step 4: Initialize git
  s.start("Initializing git...");

  const gitProcess = spawn({
    cmd: ["git", "init"],
    cwd: projectPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  await gitProcess.exited;

  const gitAddProcess = spawn({
    cmd: ["git", "add", "."],
    cwd: projectPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  await gitAddProcess.exited;

  const gitCommitProcess = spawn({
    cmd: ["git", "commit", "-m", "Initial commit from @jlmx/starter"],
    cwd: projectPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  await gitCommitProcess.exited;
  s.stop("Git initialized");

  let nextSteps = `cd ${projectName}
  bun dev`;

  if (selectedFeatures.includes("cloudflare")) {
    if (cfBindings.length > 0) {
      nextSteps += `

  Setup Cloudflare bindings:
  See CLOUDFLARE_SETUP.md`;
    }
    nextSteps += `

  Deploy to Cloudflare:
  bun run deploy:cf`;
  }

  p.outro(`Done! Next steps:

  ${nextSteps}`);
}

main().catch(console.error);
