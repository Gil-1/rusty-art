# Rusty Art

Public static website for the Rusty Art project.

This repository contains only the website-facing subset:

- `app/web` frontend source
- published artwork archive in `app/web/data`
- Vite build config

The private generation workflow lives elsewhere and syncs this repo automatically after successful daily runs.
Cloudflare Pages deploys this repo directly from GitHub.

## Direct Frontend Workflow

```bash
corepack enable
pnpm install
pnpm run build
pnpm test
pnpm run preview
```

Use `pnpm run web:build` for the stable automation build contract; `pnpm run build` is the direct-maintenance alias.
Build output goes to `app/web-dist`.
For frontend-only changes, edit frontend-owned files here, run the frontend checks, commit/push through the normal frontend Git workflow, and keep the tree clean before scheduled Daily automation runs.
