# @jlmx/starter

CLI to scaffold new projects with my preferred stack, optimized for Cloudflare deployment.

## Usage

```bash
bunx @jlmx/starter my-app
```

Or run interactively:

```bash
bunx @jlmx/starter
```

## Templates

- **TanStack Start** - Full-stack React with TanStack Router
- **Next.js** - Full-stack React with App Router

## Features

All projects include:
- **Tailwind CSS** - Custom design system with `tailwindcss-animate`
- **Custom Fonts** - Inter + JetBrains Mono via Fontsource
- **Biome** - Fast linting and formatting (replaces ESLint + Prettier)
- **Logger** - Structured logging utility
- **Result Type** - Explicit error handling (neverthrow pattern)

Optional:
- **Authentication** - Better Auth + Drizzle ORM
- **Cloudflare Workers** - Edge deployment with D1, R2, KV, AI, Queues
- **AI Instructions** - AGENTS.md and/or CLAUDE.md for coding assistants

## Cloudflare Bindings

When Cloudflare is selected, you can enable:

| Binding | Description |
|---------|-------------|
| D1 | SQLite database at the edge |
| R2 | S3-compatible object storage |
| KV | Key-value storage |
| AI | Workers AI models |
| Queues | Message queues |

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
