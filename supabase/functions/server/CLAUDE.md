# Server (Edge Function) — Claude Code Context

## Overview

Single Deno/Hono file: `index.tsx`. This IS the entire backend.

- **Function name:** `make-server-5623fde1` (NOT "server" — deploy script depends on this)
- **Supabase project:** `xycuaqjmebzurygsxovt`
- **All routes prefixed:** `/make-server-5623fde1/` in the function, but frontend's
  `baseUrl` already includes this — document routes without the prefix.

## Deploy (Windows / Git Bash only)

```bash
npm run deploy:functions:win
```

NEVER use `deploy:functions` — that's Linux/macOS only. The win script uses bash `cp`
syntax to copy files into a `.temp/make-server-5623fde1/` folder before deploying.

## KV Store — Critical Rules

```typescript
import * as kv from "./kv_store.tsx";
import { getByPrefixPaginated, getByPrefixPaginatedWithKeys } from "./kv_paginated.tsx";
```

| Operation                            | Safe to use       | Why                                    |
| ------------------------------------ | ----------------- | -------------------------------------- |
| `kv.set / get / delete`              | ✅                | Simple operations                      |
| `kv.getByPrefix(prefix)`             | ❌ for user lists | Silently truncates at 1000 rows        |
| `getByPrefixPaginated(prefix)`       | ✅                | Handles all row counts                 |
| `.in("key", keys)` with large arrays | ❌                | URL length overflow with 1000s of keys |

**Always use `getByPrefixPaginated` for:** watched movies, liked movies, notifications,
any list that grows with user activity.

## KV Key Patterns (do not invent new prefixes without documenting in DUOREEL_ARCHITECTURE.md)

```
user:{userId}                        — profile
liked:{userId}:{tmdbId}              — saved movie
watched:{userId}:{tmdbId}            — watched movie
match:{userId}:{tmdbId}              — match
notification:{userId}:{notifId}      — notification
notifications:unread:{userId}        — fast badge count (number)
imdb_rating:{tmdbId}                 — cached IMDb rating by TMDB ID
```

## Auth Pattern (every protected route)

```typescript
const accessToken = c.req.header("Authorization")?.split(" ")[1];
if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

const {
    data: { user },
    error: authError,
} = await supabase.auth.getUser(accessToken);
if (authError || !user?.id) return c.json({ error: "Unauthorized" }, 401);
```

Never skip this. Never trust userId from the request body.

## Notification Types (createNotification helper)

```
'partnership_request' | 'partnership_accepted' | 'movie_match' | 'match_milestone' | 'import_complete'
```

Adding a new type: update the union type in `createNotification` AND in
`NotificationBell.tsx` on the frontend.

## OMDb / IMDb

- Always check `imdb_rating:{tmdbId}` KV cache before calling OMDb
- Cache freshness: 7 days for movies < 6 months old, 30 days for older
- Free tier limits: 1,000 req/day, 100/min
- Do NOT add new OMDb call sites outside the existing `/imdb-ratings/` routes

## Letterboxd Import

`POST /movies/import` stores only the TMDB **search result** — it does NOT include
enriched fields (genres as objects, director, actors, runtime, watch/providers).
Client-side enrichment in SavedMoviesTab fills these in progressively.
This is intentional — enriching at import time would be too slow for large lists.
