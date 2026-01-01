# CLAUDE.md

TanStack Start app deployed to Cloudflare Workers.

## Commands

```bash
bun run dev          # Development server (use this while iterating)
bun run build        # Production build
bun run lint         # Biome linter
bun run lint:fix     # Auto-fix
bun run deploy       # Deploy to Cloudflare
```

## Structure

- `app/routes/` - File-based routing
- `app/components/` - React components
- `lib/` - Utilities (logger.ts, result.ts)

## Stack

- TanStack Start + Router
- Cloudflare Workers (D1, R2, KV)
- Tailwind CSS
- Biome (not ESLint)
- Bun runtime

## Patterns

**Cloudflare bindings** in API routes:
```typescript
const db = request.cf?.env?.DB;
```

**Error handling** with Result type:
```typescript
import { ok, err, tryCatch } from '~/lib/result';
```

**Logging**:
```typescript
import { logger } from '~/lib/logger';
logger.info('message', { context: 'value' });
```

## IMPORTANT

- Always run `bun run lint` before committing
- Use dev server for iteration, not production builds
- Biome handles formatting - don't add Prettier
