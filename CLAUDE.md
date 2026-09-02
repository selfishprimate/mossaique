# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # nodemon README watcher + Vite dev server on port 4000 (concurrently)
npm run build            # parse-readme → fetch-github-data → generate-sitemap → vite build
npm run lint             # ESLint (flat config, eslint.config.js)
npm run preview          # Serve the production build
npm run parse-readme     # Regenerate src/data/*.json from README.md
npm run fetch-github-data # Refresh src/data/github-stats.json from the GitHub API
npm run fetch-logos      # Download resource logos into public/logos/ (Clearbit; not part of build)
npm run generate-sitemap # Rewrite public/sitemap.xml
```

There is no test framework in this project — no test runner, no test files. Do not invent test commands; verify changes with `npm run lint` and the dev server.

## Architecture

### README.md is the single source of truth

`README.md` is not just documentation — it is the content database. `scripts/parse-readme.js` splits it on `##` headers and emits one JSON file per category into `src/data/`, plus `categories-index.json`. All resource content flows one way:

```
README.md → scripts/parse-readme.js → src/data/<category>.json → src/data/categories.js → React app
```

Never hand-edit `src/data/*.json` for content — the next parse overwrites it. Edit `README.md` instead. Entries must follow `- [Title](URL): Description` and stay alphabetically ordered within their section (the parser also sorts, but the README convention matters for review).

The `.github/workflows/parse-readme.yml` workflow re-runs the parser and auto-commits `src/data/*.json` on every push to `master` (or merged PR) that touches `README.md`, so contributors commit only `README.md`.

### Adding a new category touches five files

`src/data/categories.js` is a hand-maintained barrel of JSON imports — it is **not** generated. A new `##` section in README.md silently produces an orphan JSON file unless you also update:

1. `README.md` — the `## Section` plus its italic `_description_` (the parser reads that as the category description)
2. `scripts/parse-readme.js` — `iconMap` (lowercase category name → lucide icon name; falls back to `Circle`)
3. `src/data/categories.js` — import + array entry
4. `scripts/generate-sitemap.js` — the hardcoded `categoryFiles` array
5. `seo-config.js` — `categoryMetadata[<id>]` for title/description/keywords

Category IDs are kebab-cased section titles and become the route (`/:id`) directly.

### Data enrichment at parse time

The parser layers extra fields onto each resource:

- `globalIndex` — the resource's position in README order. This is what "Recent" sorting uses (`src/utils/sorting.js`), so README ordering is functionally significant, not cosmetic.
- `pricing` — looked up in `src/data/pricing.json` by a slug derived from the resource title (lowercased, non-alphanumerics → `-`). A title change breaks its pricing entry unless the key is updated too. Drives the free/freemium/paid filter.

Popularity ranking is computed client-side in `calculatePopularity()` — a heuristic over hardcoded domain and keyword score tables, not real metrics.

### App shape

React 19 + Vite + React Router, only two routes: `/` (Home) and `/:id` (Category). `@/` aliases `./src` (configured in both `vite.config.js` and `jsconfig.json`). Home flattens every category into one list at module scope and paginates 20 at a time via IntersectionObserver.

- **Search** — `src/utils/search.js` builds a single memoized Fuse.js instance over `getAllResources()` (`resourceAggregator.js`), weighted title 0.5 / description 0.3 / category 0.2. `SearchCommand.jsx` (cmdk) is the ⌘K palette; `flows/search.md` documents its intended keyboard/mouse behavior in detail — read it before changing that component.
- **Logos** — `ResourceCard` resolves `/logos/<domain>.png` from the resource URL's hostname, with an `onError` fallback. Those files are committed under `public/logos/` and refreshed only by manually running `npm run fetch-logos`.
- **SEO** — `seo-config.js` (repo root, imported as `../../seo-config`) holds site defaults and per-category metadata; `SEO.jsx` renders it through react-helmet-async.
- **localStorage keys** — `theme` (Navigation.jsx), `sidebarCollapsed` (App.jsx), `mossaique_visited_categories` (visitedCategories.js, which also dispatches a `categoryVisited` window event).
- `src/utils/newResources.js` reads a `resource.new` flag that the parser does not currently emit — that path is effectively dormant.

### Styling

Tailwind with `darkMode: 'class'` and custom breakpoints beyond the defaults: `xl5` (1500px), `xxl` (1640px), `3xl` (2400px). Because grid-column classes at those breakpoints are composed dynamically, they are pinned in `tailwind.config.js` `safelist` — new dynamic Tailwind classes need to be added there or they get purged. shadcn/ui is configured (`components.json`, JSX not TSX, lucide icons, aceternity registry); primitives live in `src/components/ui/`.

### Deployment and submissions

Netlify builds with `npm run parse-readme && npm run build` and publishes `dist`, with an SPA catch-all redirect (`netlify.toml`). The in-app "Submit" modal POSTs to `netlify/functions/submit-resource.js`, which uses a `GITHUB_TOKEN` env var to branch, edit README.md, and open a PR on the repo — see `SUBMIT_SETUP.md`. Production builds strip `console.*` via terser (`vite.config.js`), so console-based debugging only works in dev.

`.github/workflows/fetch-github-stats.yml` refreshes `src/data/github-stats.json` daily and auto-commits it.

## Reference docs in-repo

`CONTRIBUTING.md` (README entry format and contributor flow), `DEPLOYMENT.md`, `SUBMIT_SETUP.md`, `flows/search.md` (search modal spec), `wiki/responsive-breakpoints.md`. `reports/` holds historical implementation write-ups — useful background, but they describe past work and may not match current code.
