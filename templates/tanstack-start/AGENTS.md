# AGENTS.md

## Overview

This is a TanStack Start application deployed to Cloudflare Workers.

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
app/
  routes/            # File-based routing
  components/        # React components
  lib/               # Utilities and shared code
lib/
  logger.ts          # Structured logging utility
  result.ts          # Result type for error handling
```

## Code Conventions

- TypeScript with strict mode
- Biome for linting/formatting (not ESLint/Prettier)
- TanStack Router for routing (file-based in app/routes/)
- Tailwind CSS for styling

## Cloudflare Bindings

Access bindings in API routes via `request.cf?.env`:

```typescript
const db = request.cf?.env?.DB;      // D1 database
const kv = request.cf?.env?.KV;      // KV storage
const bucket = request.cf?.env?.BUCKET; // R2 storage
```

## Testing Changes

Always run `bun run lint` before committing. The dev server supports hot reload - prefer it over production builds during development.

## Error Handling

Use the Result type from `lib/result.ts` for explicit error handling:

```typescript
import { ok, err, tryCatch } from '~/lib/result';

const result = tryCatch(() => riskyOperation());
result.match({
  ok: (value) => handleSuccess(value),
  err: (error) => handleError(error),
});
```
