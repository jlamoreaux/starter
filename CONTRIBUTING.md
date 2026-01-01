# Contributing

Thanks for your interest in contributing!

## Development

```bash
# Clone the repo
git clone https://github.com/jlmx/starter.git
cd starter

# Install dependencies
bun install

# Run locally
bun run dev my-test-app

# Build
bun run build

# Lint
bun run lint
bun run lint:fix
```

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commits will be validated by commitlint.

### Format

```
type(scope): description

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `refactor` | Code restructure (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance |
| `ci` | CI/CD changes |

### Examples

```bash
feat: add astro template
feat(auth): add magic link support
fix: handle empty project name
fix(nextjs): correct api route path
docs: update readme with examples
chore: update dependencies
```

## Releases

Releases are automated via semantic-release:

- `feat:` commits → minor version bump (0.x.0)
- `fix:` commits → patch version bump (0.0.x)
- `feat!:` or `BREAKING CHANGE:` → major version bump (x.0.0)

Just push to `main` and the CI will handle versioning, changelog, and npm publish.

## Adding a New Template

1. Create directory: `templates/your-template/`
2. Add template files (styles, config, etc.)
3. Update `src/index.ts`:
   - Add to template select options
   - Add scaffolding logic
   - Handle feature application
4. Test locally with `bun run dev`
5. Submit PR with `feat: add your-template template`

## Adding a New Feature

1. Add feature to the multiselect options
2. Implement the feature application logic
3. Update templates if needed
4. Test with both TanStack Start and Next.js
5. Submit PR with `feat: add feature-name`
