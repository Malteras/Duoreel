# DuoReel — Claude Code Context

## Stack

- Next.js / React / TypeScript / Tailwind CSS
- Supabase (KV store + edge functions + auth)
- TMDB API (movie data), OMDb API (IMDb ratings)
- Letterboxd RSS sync (live); official API access pending

## Key Files

- `src/app/components/LandingPage.tsx` — monolithic landing page
- `src/app/components/MoviesTab.tsx` — Discover tab
- `src/app/components/SavedMoviesTab.tsx` — Saved tab
- `src/app/components/MatchesTab.tsx` — Matches tab
- `src/app/components/MovieDetailModal.tsx` — shared modal (see critical rule below)
- `supabase/functions/server/index.tsx` — all server-side TMDB/KV logic
- `src/styles/theme.css` — design tokens, animation classes
- `guidelines/Guidelines.md` — design system rules

## Critical Architecture Rules

### MovieDetailModal is shared across ALL tabs

Any change to `MovieDetailModal` (new props, new fields, UI changes) MUST be wired
in all three tabs: `MoviesTab`, `SavedMoviesTab`, `MatchesTab`. Never assume a change
in one tab propagates automatically.

### No copy-paste JSX across tabs

Shared UI must be single components reused with props. Duplication is a recurring
drift problem in this codebase.

### Surgical changes only

Never change things not explicitly requested. If only mobile is mentioned, don't
touch desktop layout, and vice versa.

### MatchesTab inline enrichMovies (pending cleanup)

`MatchesTab` still contains inline `enrichMovies` logic that should use the existing
`useEnrichMovies` hook. Don't add more inline logic here — use the hook.

## Known Gotchas

### Supabase 1000-row limit

Supabase default row limit silently truncates results at 1000. Use paginated queries
(`getByPrefixPaginated`) for any list that could exceed this. Already hit with the
watched movies list.

### kv.mget URL-too-long bug

`kv.mget(keys)` uses `.in("key", keys)` which appends all keys to the query URL.
With thousands of watched movies this exceeds URL length limits → `TypeError: Invalid URL`.
Fix: use `getByPrefixPaginated` instead of the two-step key+mget pattern.

### OMDb rate limits

Free tier: 1,000 requests/day, 100/minute. IMDb ratings use shared KV cache to
avoid burning the quota.

### TMDB watch providers link field

`watch/providers` `link` field points to `themoviedb.org/movie/{id}/watch?locale=US`,
NOT a JustWatch deep-link.

### Movie card vs modal images

- Movie cards use `poster_path` (portrait)
- Modal uses `backdrop_path` (landscape)

## Design System

- Dark slate theme
- Tokens in `src/styles/theme.css`
- Animation: `animate-fade-in-up` class; staggered `fadeInUp` delays: 0s, 0.1s, 0.25s, 0.4s
- `cursor-pointer` expected on all interactive elements
- Button variants and ghost hover states in `guidelines/Guidelines.md`

## API / Data Notes

- TMDB: use `append_to_response` for videos + watch providers in one request
- Supabase KV keys follow `prefix:id` pattern (e.g. `watched:123`, `liked:456`)
- `supabase/functions/server/index.tsx` is authoritative for all server-side fetch logic
