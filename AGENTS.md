Be brief.

# Rusty Art Frontend

This repository is the public Rusty Art website and published artwork archive.

## Scope

- Frontend source lives in `app/web`.
- Published public data lives in `app/web/data`.
- Private generation automation lives outside this repo in `../../automation/domains/rusty-art`.
- Old mixed-project names are historical backup naming only.

## Working Style

1. Keep changes minimal and static-site compatible.
2. Do not add private automation, secrets, run diagnostics, or debug payloads to this repo.
3. Preserve public archive contracts: `app/web/data/manifest.json`, `app/web/data/latest.json`, and `app/web/data/artworks/*.json`.
4. Verify frontend changes with `pnpm run web:build`.
