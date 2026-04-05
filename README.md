# Rusty Art

Public static website for the Rusty Art project.

This repository contains only the website-facing subset:

- `app/web` frontend source
- published artwork archive in `app/web/data`
- Vite build config

The private generation workflow lives elsewhere and syncs this repo automatically after successful daily runs.
Cloudflare Pages deploys this repo directly from GitHub.

## Development

```bash
npm install
npm run web:dev
```

## Build

```bash
npm run web:build
```

Build output goes to `app/web-dist`.
