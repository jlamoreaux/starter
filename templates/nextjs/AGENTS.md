# AGENTS.md

## Overview

This is a Next.js application with App Router, deployed to Cloudflare Workers.

## Commands

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run lint         # Run Biome linter
bun run lint:fix     # Auto-fix lint issues
bun run deploy       # Deploy to Cloudflare
```

## Project Structure

```
src/
  app/               # App Router pages and layouts
    api/             # API routes
    (auth)/          # Auth pages (login, register)
  components/        # React components
    ui/              # Base UI components
  lib/               # Utilities and shared code
    logger.ts        # Structured logging utility
    result.ts        # Result type for error handling
```

## Code Conventions

- TypeScript with strict mode
- Biome for linting/formatting (not ESLint/Prettier)
- Next.js App Router with Server Components by default
- Client components marked with "use client"
- Tailwind CSS for styling

## Cloudflare Bindings

Access bindings via `getRequestContext()` from `@cloudflare/next-on-pages`:

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  const { env } = getRequestContext();
  const db = env.DB;      // D1 database
  const kv = env.KV;      // KV storage
}
```

## Testing Changes

Always run `bun run lint` before committing. The dev server supports hot reload - prefer it over production builds during development.

## Error Handling

Use the Result type from `@/lib/result` for explicit error handling:

```typescript
import { ok, err, tryCatch } from '@/lib/result';

const result = tryCatch(() => riskyOperation());
result.match({
  ok: (value) => handleSuccess(value),
  err: (error) => handleError(error),
});
```
