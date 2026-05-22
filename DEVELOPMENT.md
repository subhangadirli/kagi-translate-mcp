Development - Local workflow

This short guide documents common developer commands and recommendations.

Prerequisites

- Node.js 20+ (recommended)
- pnpm (preferred package manager)
  - Install via Corepack: `corepack enable && corepack prepare pnpm@latest --activate`
  - Or install globally: `npm install -g pnpm`

Initial setup

```bash
pnpm install
cp .env.example .env
# edit .env to set KAGI_API_KEY and any other local vars
```

Common commands

- Install deps: `pnpm install`
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint`
- Run tests: `pnpm run build && node --test test/*.test.mjs`
- Dev mode (watch + restart): `pnpm run dev`

CI / Reproducible installs

- The repository includes `pnpm-lock.yaml` and a `packageManager` field in `package.json`.
- Use `pnpm install --frozen-lockfile` in CI to ensure reproducible installs.

Publishing

- The publish workflow uses `pnpm publish`. Ensure `NPM_TOKEN` is set in repository secrets before creating a release tag.

Notes

- If using Corepack, the `packageManager` field lets Corepack select the appropriate `pnpm` version automatically.
- If you run into issues with the environment, run `pnpm -v` and verify the version matches the `packageManager` declared in `package.json`.
