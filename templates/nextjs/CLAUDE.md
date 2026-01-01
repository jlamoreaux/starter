# CLAUDE.md

Next.js App Router deployed to Cloudflare Workers.

## Commands

```bash
bun run dev          # Development server (use this while iterating)
bun run build        # Production build
bun run lint         # Biome linter
bun run lint:fix     # Auto-fix
bun run deploy       # Deploy to Cloudflare
```

## Structure

- `src/app/` - App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities (logger.ts, result.ts)

## Stack

- Next.js 14+ with App Router
- Cloudflare Workers (D1, R2, KV)
- Tailwind CSS
- Biome (not ESLint)
- Bun runtime

## Patterns

**Server vs Client Components**:
- Server Components by default
- Add "use client" for client components

**Cloudflare bindings**:
```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';
const { env } = getRequestContext();
const db = env.DB;
```

**Error handling** with Result type:
```typescript
import { ok, err, tryCatch } from '@/lib/result';
```

**Logging**:
```typescript
import { logger } from '@/lib/logger';
logger.info('message', { context: 'value' });
```

## IMPORTANT

- Always run `bun run lint` before committing
- Use dev server for iteration, not production builds
- Biome handles formatting - don't add Prettier
