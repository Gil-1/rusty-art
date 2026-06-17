Be brief.

# Rusty Art Frontend

This repository is the public Rusty Art website and published artwork archive.

## Scope

- Frontend source lives in `app/web`.
- Published public data lives in `app/web/data`.
- This repo lives at `workspace/projects/rusty-art`.
- Private generation automation lives outside this repo at `workspace/automation/domains/rusty-art`.
- Frontend docs, package metadata, lockfiles, and ignore rules are owned by this repo, not generated or validated by automation.
- Old mixed-project names are historical backup naming only.

## Frontend-Only Safe Paths

- Safe default edit targets: `app/web/**` except `app/web/data/**` and `app/web/js/contracts/**`, plus `tests/**`, `vite.config.mjs`, root docs, package metadata, lockfiles, and ignore rules.
- The small `pipeline/core/**` files in this repo are static-site support/contract shims. Change them only when the Vite build or public browser contracts require it.
- Treat `app/web/data/**` as automation-managed public archive output. Read it freely; edit it only for an explicit archive/data migration coordinated with the automation domain.
- Scheduled Daily automation auto-commits dirty safe frontend-owned paths before running. It does not auto-commit mirrored contracts, private-looking files, unknown root files, or cross-boundary moves into `app/web/data/**`.
- Do not edit `workspace/automation/domains/rusty-art/**` for frontend-only work. If a frontend change alters a browser/data contract consumed by automation, update the automation contract mirror and boundary tests as part of that cross-boundary change.

## Working Style

1. Keep changes minimal and static-site compatible.
2. Do not add private automation, secrets, run diagnostics, or debug payloads to this repo.
3. Preserve public archive contracts: `app/web/data/manifest.json`, `app/web/data/latest.json`, and `app/web/data/artworks/*.json`.
4. Verify frontend changes with `pnpm run build` and `pnpm test`; use `pnpm run preview` for local inspection.
