# DuoReel — Claude Code Context

## Stack

- Vite / React / TypeScript / Tailwind CSS
- Supabase (KV store + edge functions + auth)
- TMDB API (movie data), OMDb API (IMDb ratings)
- Letterboxd RSS sync (live); official API access pending
- Vercel (hosting, SPA rewrites via `vercel.json`)

## Key Files

```
src/app/components/
  LandingPage.tsx             — marketing/onboarding (monolithic)
  MoviesTab.tsx               — Discover tab
  SavedMoviesTab.tsx          — Saved tab
  MatchesTab.tsx              — Matches tab
  MovieDetailModal.tsx        — shared modal (see critical rule below)
  MovieCard.tsx               — large card (Discover)
  CompactMovieCard.tsx        — small card (Saved / Matches)
  AppLayout.tsx               — app shell
  UserInteractionsContext.tsx — global watched/liked/partner state
  ProfilePage.tsx             — user profile

src/app/hooks/
  useEnrichMovies.ts          — IMDb ratings + streaming providers
  useWatchedActions.ts        — mark watched/unwatched
  useMovieModal.ts            — modal open/close/data state
  useTabCache.ts              — per-tab scroll/filter persistence
  useCSVImport.ts             — Letterboxd CSV import

supabase/functions/server/
  index.tsx                   — all server-side logic (authoritative)
  kv_store.tsx                — KV read/write helpers
  kv_paginated.tsx            — paginated KV queries (prefer over raw .in())

src/utils/filters.ts          — client-side movie filtering
src/styles/theme.css          — design tokens, animation classes
guidelines/Guidelines.md      — UI design system (source of truth for UI)
DESIGN_SYSTEM.md              — extended design system reference
vercel.json                   — SPA rewrite rules
```

## Infrastructure IDs

- **Supabase project ref:** `xycuaqjmebzurygsxovt`
- **Edge function name:** `make-server-5623fde1` (NOT "server")
- **KV table:** `kv_store_5623fde1`

## Deploy Edge Function (Windows / Git Bash)

```bash
# One-time setup (not committed — .temp is gitignored):
supabase link --project-ref xycuaqjmebzurygsxovt

# Deploy:
npm run deploy:functions:win
```

Do NOT use `deploy:functions` (Linux/macOS only). Use `deploy:functions:win` on Windows.

---

## Critical Architecture Rules

### 1. MovieDetailModal is shared across ALL tabs — always wire all three

Any change to `MovieDetailModal` (new props, new fields, UI changes, click handlers)
**MUST** be wired in all three tabs: `MoviesTab`, `SavedMoviesTab`, `MatchesTab`.
Changes do NOT propagate automatically. If touching the modal, explicitly update all
three tab files.

### 2. No copy-paste JSX across tabs

Shared UI must be a single component reused with props. Duplication is a recurring
drift problem in this codebase. If you find yourself writing the same JSX in two tab
files, extract it into a component.

### 3. Surgical changes only

Never change things not explicitly requested.

- Mobile-only change → don't touch desktop layout
- One tab mentioned → don't refactor adjacent tabs
- One bug to fix → don't improve nearby code

### 4. MovieCard scope — same card type, all three tabs

All three tabs (Discover, Saved, Matches) have both a **large card** (`MovieCard`) and
a **compact card** (`CompactMovieCard`) view, switchable via the ViewToggle. All three
tabs also have a **preview modal** (`MovieDetailModal`).

Default scope rules:

- A change to a card surface (large, compact, or modal) applies to **all three tabs**
  unless explicitly scoped otherwise.
- Some intentional per-tab differences exist — do NOT flatten those differences, only
  apply what is explicitly requested.
- If a request is ambiguous about which card surface(s) to change (large vs compact vs
  modal), ask before implementing.

#### Intentional prop differences per tab (do not flatten)

| Prop                        | Discover              | Saved (My List)  | Saved (Partner's)         | Matches                    |
| --------------------------- | --------------------- | ---------------- | ------------------------- | -------------------------- |
| `isWatched`                 | ✅                    | ✅               | ✅ your own watch history | ✅ movies watched together |
| `isLiked`                   | ✅ from Set           | ✅ always `true` | ✅ checks your own list   | ✅ from Set                |
| `isMatch`                   | ❌                    | ❌               | ❌                        | ✅ always `true`           |
| `onNotInterested`           | ✅ ban button on card | ❌ already saved | ❌                        | ❌                         |
| `onWatched` / `onUnwatched` | ✅ modal only         | ✅ modal only    | ✅ modal only             | ✅ modal only              |
| `imdbRating`                | ✅ from Map           | ✅ from Map      | ✅ from Map               | ✅ from Map                |

The only props that are genuinely tab-specific: `isMatch` (Matches only) and
`onNotInterested` (Discover only). Everything else is consistent.

### 5. useEnrichMovies is the hook for enrichment

Do not write inline enrichment logic. `useEnrichMovies` in `src/app/hooks/useEnrichMovies.ts`
is the single implementation. Use it everywhere.

### 6. Context management for large tasks

If a task touches 3+ files, break it into focused sub-tasks rather than one large
change. This reduces drift and makes diffs reviewable.

---

## Known Gotchas

### Supabase 1000-row limit

Default Supabase queries silently truncate at 1000 rows. **Always use paginated
queries** (`getByPrefixPaginated` from `kv_paginated.tsx`) for any list that could
grow — watched movies, liked movies, etc. This has already caused a production bug.

### kv.mget URL-too-long bug

`kv.mget(keys)` uses `.in("key", keys)` which appends all keys to the query URL.
With thousands of entries this hits URL length limits → `TypeError: Invalid URL`.
Fix: use `getByPrefixPaginated` instead of the two-step "fetch keys then mget" pattern.

### OMDb rate limits

Free tier: 1,000 req/day, 100/min. IMDb ratings use shared KV cache to avoid burning
the quota. Do not add OMDb calls outside the existing enrichment path.

### TMDB watch providers link field

The `link` field from `watch/providers` points to `themoviedb.org/movie/{id}/watch?locale=US`
— NOT a JustWatch deep-link.

### Movie card vs modal images

- Movie cards: `poster_path` (portrait)
- Modal: `backdrop_path` (landscape)

### Figma Make false positives

Figma Make sometimes claims a change is "already applied" without committing.
Always verify with `git diff` before trusting its output.

---

## Design System

Source of truth: `guidelines/Guidelines.md` — read it before touching any UI.

Quick reference:

- Background: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- Cards: `bg-gradient-to-b from-slate-800/50 to-slate-900/80 border border-slate-700/50`
- Pink accent: `text-pink-500` / `bg-pink-600` / `hover:bg-pink-700`
- Muted text: `text-slate-400` (**not** `text-slate-500` — fails WCAG AA contrast)
- Body text: `text-slate-300`
- Headings: `text-white`
- Active tab Discover/Saved: `bg-blue-600 text-white`
- Active tab Matches: `bg-pink-600 text-white`
- All interactive elements: `cursor-pointer`
- Animations: `animate-fade-in-up` class; staggered delays 0s / 0.1s / 0.25s / 0.4s
- Loading: `Loader2` from lucide-react + `animate-spin`

---

## API / Data Notes

- TMDB: use `append_to_response` for videos + watch providers in a single request
- Supabase KV keys follow `prefix:id` pattern (e.g. `watched:123`, `liked:456`)
- `supabase/functions/server/index.tsx` is the authoritative source for all
  server-side fetch, auth, and KV logic — don't duplicate routes elsewhere

---

## Pending Tech Debt (do not regress)

- **MatchesTab enrichMovies** — imports `useEnrichMovies` correctly. Do not add
  any new inline enrichment logic here.
- **Letterboxd official API** — access pending. RSS sync is the current live path.
  Do not build against an API that isn't available yet.
- **`onDislike` removal** — QUI-147. Dead prop on `MovieCard`, to be removed.
