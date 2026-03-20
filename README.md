# @jlmx/starter

CLI to scaffold new projects with my preferred stack, optimized for Cloudflare deployment.

## Usage

Interactive mode — prompts for all options:

```bash
bunx @jlmx/starter
```

Pass a project name to skip the name prompt:

```bash
bunx @jlmx/starter my-app
```

One-liner with flags — fully non-interactive:

```bash
bunx @jlmx/starter my-app --template nextjs --features tailwind,fonts,cloudflare --bindings d1,r2 --ai claude
```

Accept all defaults with no prompts:

```bash
bunx @jlmx/starter my-app --yes
```

## Options

| Flag | Values | Description |
|------|--------|-------------|
| `--template` | `tanstack-start`, `nextjs` | Framework template |
| `--features` | `tailwind,fonts,auth,cloudflare` | Comma-separated feature list |
| `--bindings` | `d1,r2,kv,ai,queues` | Cloudflare bindings (requires `cloudflare` feature) |
| `--ai` | `none`, `agents`, `claude`, `both` | AI coding assistant instructions |
| `-y, --yes` | — | Accept all defaults, skip all prompts |
| `-h, --help` | — | Show help |
| `-v, --version` | — | Show version |

Defaults (used with `--yes`): `tanstack-start`, features `tailwind,fonts,cloudflare`, no bindings, no AI instructions.

## Templates

- **TanStack Start** - Full-stack React with TanStack Router
- **Next.js** - Full-stack React with App Router

## Features

All projects include:
- **Biome** - Fast linting and formatting (replaces ESLint + Prettier)
- **Logger** - Structured logging utility
- **Result Type** - Explicit error handling (neverthrow pattern)

Optional:
- **Tailwind CSS** - Custom design system with `tailwindcss-animate`
- **Custom Fonts** - Inter + JetBrains Mono via Fontsource
- **Authentication** - Better Auth + Drizzle ORM
- **Cloudflare Workers** - Edge deployment with D1, R2, KV, AI, Queues
- **AI Instructions** - AGENTS.md and/or CLAUDE.md for coding assistants

## Cloudflare Bindings

When `cloudflare` is selected, you can enable:

| Binding | Description |
|---------|-------------|
| `d1` | SQLite database at the edge |
| `r2` | S3-compatible object storage |
| `kv` | Key-value storage |
| `ai` | Workers AI models |
| `queues` | Message queues |

## Development

```bash
# Run locally
bun run dev

# Build
bun run build

# Lint
bun run lint
```

## License

MIT
