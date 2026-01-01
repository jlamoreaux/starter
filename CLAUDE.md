# CLAUDE.md

This is the `@jlmx/starter` CLI - a project scaffolding tool that creates new apps with TanStack Start or Next.js, configured for Cloudflare Workers deployment.

## Project Structure

```
src/index.ts          # Main CLI entry point
templates/
  tanstack-start/     # TanStack Start template files
  nextjs/             # Next.js template files
  shared/             # Shared utilities (logger, result, biome.json)
```

## Commands

```bash
bun run dev           # Run CLI locally (bun run ./src/index.ts)
bun run build         # Build to dist/
bun run lint          # Check with Biome
bun run lint:fix      # Auto-fix lint issues
```

## Code Style

- TypeScript with ES modules
- Biome for linting/formatting (not ESLint)
- Conventional commits (feat:, fix:, etc.)

## How It Works

The CLI:
1. Prompts user for project name, template, and features
2. Scaffolds base project (TanStack Start or Next.js)
3. Copies selected features from `templates/`
4. Generates dynamic config files (wrangler.toml, etc.)

## Adding New Features

1. Add template files to `templates/<framework>/`
2. Update `src/index.ts` to include the feature in prompts
3. Add copy logic in the main function

## Testing Changes

```bash
bun run ./src/index.ts test-app
```

Then check the generated `test-app/` directory. Clean up with `rm -rf test-app`.
