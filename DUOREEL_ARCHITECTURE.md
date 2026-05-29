# DuoReel — Architecture Reference

> **Purpose**: Single source of truth for DuoReel's architecture, conventions, and
> constraints. Follow these patterns when suggesting code, debugging, or planning features.

---

## Platform & Stack

| Layer         | Technology                                                                              |
| ------------- | --------------------------------------------------------------------------------------- |
| Frontend      | Vite + React 18, TypeScript, Tailwind CSS                                               |
| Backend       | Supabase Edge Functions (Deno/Hono), single file: `supabase/functions/server/index.tsx` |
| Storage       | Supabase Postgres table `kv_store_5623fde1` — accessed via `kv_store.tsx` helpers       |
| External APIs | TMDB API (movie data), OMDb API (IMDb ratings)                                          |
| Auth          | Supabase Auth — email/password + Google OAuth (PKCE flow)                               |
| Deployment    | Vercel (frontend), Supabase (edge functions)                                            |

**Edge function name:** `make-server-5623fde1`
**Supabase project ref:** `xycuaqjmebzurygsxovt`
**KV table:** `kv_store_5623fde1`

---

## KV Store API

The KV store is a Postgres table wrapped with helpers in `kv_store.tsx` and
`kv_paginated.tsx`. This is the only persistence layer — no other tables exist.

```typescript
// kv_store.tsx — basic operations
import * as kv from "./kv_store.tsx";

await kv.set(key, value); // upsert
await kv.get(key); // returns value or null
await kv.delete(key);
await kv.getByPrefix(prefix); // ⚠️ hits 1000-row Supabase limit

// kv_paginated.tsx — use for any list that could be large
import { getByPrefixPaginated, getByPrefixPaginatedWithKeys } from "./kv_paginated.tsx";

await getByPrefixPaginated(prefix); // returns all values, paginated
await getByPrefixPaginatedWithKeys(prefix); // returns { key, value }[] pairs
```

⚠️ **Never use `kv.getByPrefix` for user data** — it silently truncates at 1000 rows.
Always use `getByPrefixPaginated` for watched movies, liked movies, notifications, etc.

---

## KV Key Patterns

**Never invent new prefixes without documenting them here.**

### User / Auth Keys

| Key Pattern            | Value                                            | Purpose                    |
| ---------------------- | ------------------------------------------------ | -------------------------- |
| `user:{userId}`        | `{ id, email, name, photoUrl, partnerId?, ... }` | User profile               |
| `user:search:{email}`  | `{ userId, name }`                               | Email-based user lookup    |
| `user-invite:{userId}` | `{ code, createdAt }`                            | User's invite code         |
| `invite:{code}`        | `{ userId, ... }`                                | Invite code → user mapping |

### Movie Interaction Keys

| Key Pattern                       | Value                             | Purpose                     |
| --------------------------------- | --------------------------------- | --------------------------- |
| `liked:{userId}:{tmdbId}`         | `{ id, title, poster_path, ... }` | Liked/saved movie           |
| `disliked:{userId}:{tmdbId}`      | `{ tmdbId, ... }`                 | Not interested              |
| `watched:{userId}:{tmdbId}`       | `{ tmdbId, watchedAt, ... }`      | Watched movie               |
| `match:{userId}:{tmdbId}`         | `{ tmdbId, ... }`                 | Match (both partners liked) |
| `notinterested:{userId}:{tmdbId}` | `{ tmdbId, ... }`                 | Not interested (alt key)    |

### Partner Keys

| Key Pattern                               | Value                           | Purpose                 |
| ----------------------------------------- | ------------------------------- | ----------------------- |
| `partner_request:{toUserId}:{fromUserId}` | `{ fromUserId, toUserId, source, inviterName?, createdAt }` | Pending partner request. `source` is `"invite_link"` or absent (email flow). `inviterName` present only for invite-link records. |

### IMDb / OMDb Keys

| Key Pattern                  | Value                               | Purpose                       |
| ---------------------------- | ----------------------------------- | ----------------------------- |
| `imdb_rating:{tmdbId}`       | `{ rating, votes, fetchedAt, ... }` | Cached IMDb rating by TMDB ID |
| `imdb_rating_by_id:{imdbId}` | `{ rating, ... }`                   | Cached rating by IMDb ID      |

### Notification Keys

| Key Pattern                       | Value                                 | Purpose                 |
| --------------------------------- | ------------------------------------- | ----------------------- |
| `notification:{userId}:{notifId}` | `{ id, type, read, createdAt, data }` | Individual notification |
| `notifications:unread:{userId}`   | `number`                              | Fast unread badge count |

---

## Application Structure

### Three Main Tabs

| Tab      | Component            | Purpose                                                |
| -------- | -------------------- | ------------------------------------------------------ |
| Discover | `MoviesTab.tsx`      | Browse movies from TMDB, filtered by user interactions |
| Saved    | `SavedMoviesTab.tsx` | User's liked/saved movies                              |
| Matches  | `MatchesTab.tsx`     | Movies both user AND partner liked                     |

All three tabs have **large card** (`MovieCard.tsx`), **compact card**
(`CompactMovieCard.tsx`), and **modal** (`MovieDetailModal.tsx`) views.
ViewToggle switches between large and compact per-tab.

### Key Files

| File                                             | Responsibility                         |
| ------------------------------------------------ | -------------------------------------- |
| `supabase/functions/server/index.tsx`            | All backend routes — authoritative     |
| `supabase/functions/server/kv_store.tsx`         | KV CRUD helpers                        |
| `supabase/functions/server/kv_paginated.tsx`     | Paginated KV prefix queries            |
| `src/app/components/MoviesTab.tsx`               | Discover tab                           |
| `src/app/components/SavedMoviesTab.tsx`          | Saved tab                              |
| `src/app/components/MatchesTab.tsx`              | Matches tab                            |
| `src/app/components/MovieDetailModal.tsx`        | Shared modal — wired in ALL three tabs |
| `src/app/components/MovieCard.tsx`               | Large card                             |
| `src/app/components/CompactMovieCard.tsx`        | Compact card                           |
| `src/app/components/AppLayout.tsx`               | Shell — header, tabs, NotificationBell |
| `src/app/components/UserInteractionsContext.tsx` | Global watched/liked/partner state     |
| `src/app/hooks/useEnrichMovies.ts`               | IMDb ratings + streaming providers     |
| `src/app/hooks/useWatchedActions.ts`             | Mark watched/unwatched                 |
| `src/utils/filters.ts`                           | Client-side movie filtering            |

---

## API Endpoints

All routes are prefixed with `/make-server-5623fde1/` in the edge function but the
frontend uses a base URL that strips this — document them without the prefix below.

### Auth

| Method | Path                  | Purpose                                               |
| ------ | --------------------- | ----------------------------------------------------- |
| POST   | `/auth/signup`        | Email/password signup                                 |
| POST   | `/auth/signin`        | Email/password signin                                 |
| POST   | `/auth/signout`       | Sign out                                              |
| POST   | `/api/ensure-profile` | Create KV profile for Google OAuth users (idempotent) |

### Movies

| Method | Path                          | Purpose                                           |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/movies/discover`            | TMDB browse (paginated)                           |
| GET    | `/movies/discover-filtered`   | TMDB browse excluding user's interactions         |
| GET    | `/movies/liked`               | User's liked movies                               |
| POST   | `/movies/like`                | Like/save a movie                                 |
| DELETE | `/movies/like/:movieId`       | Unlike a movie                                    |
| POST   | `/movies/dislike`             | Mark not interested                               |
| GET    | `/movies/disliked`            | User's not-interested movies                      |
| POST   | `/movies/watched`             | Mark as watched                                   |
| GET    | `/movies/watched`             | User's watched movies                             |
| DELETE | `/movies/watched/:movieId`    | Unmark watched                                    |
| GET    | `/movies/matches`             | Movies both user + partner liked                  |
| GET    | `/movies/partner-liked`       | Partner's liked movies                            |
| GET    | `/movies/partner-watched-ids` | Partner's watched movie IDs                       |
| GET    | `/movies/interactions`        | Bulk interaction status for a list of IDs         |
| GET    | `/movies/interactions/all`    | All of user's interactions (paginated internally) |
| GET    | `/movies/excluded-ids`        | IDs to exclude from Discover                      |
| GET    | `/movies/:id`                 | Single movie details                              |
| GET    | `/movies/search`              | Movie search                                      |

### IMDb / OMDb

| Method | Path                            | Purpose                            |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/movies/:movieId/imdb`         | IMDb rating for one movie (cached) |
| GET    | `/imdb-ratings/bulk`            | Bulk fetch cached ratings          |
| POST   | `/imdb-ratings/store`           | Store a fetched rating             |
| POST   | `/imdb-ratings/fetch-and-store` | Fetch from OMDb + cache            |
| GET    | `/omdb/rating/:imdbId`          | Direct OMDb lookup by IMDb ID      |

### Partner

| Method | Path                         | Purpose                |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/partner`                   | Get current partner    |
| POST   | `/partner/connect`           | Send partner request   |
| POST   | `/partner/accept`            | Accept request         |
| POST   | `/partner/reject`            | Reject request         |
| POST   | `/partner/remove`            | Remove partner         |
| GET    | `/partner/requests/incoming` | Incoming requests      |
| GET    | `/partner/requests/outgoing` | Outgoing requests      |
| GET    | `/partner/invite-code`       | Get/create invite code |
| POST   | `/partner/accept-invite`     | Accept invite by code  |

### Notifications

| Method | Path                           | Purpose                       |
| ------ | ------------------------------ | ----------------------------- |
| GET    | `/notifications`               | Fetch latest 50 notifications |
| GET    | `/notifications/unread-count`  | Badge count (single KV read)  |
| POST   | `/notifications/mark-read`     | Mark one notification read    |
| POST   | `/notifications/mark-all-read` | Clear unread count            |
| GET    | `/notifications/matches`       | Match notifications           |

### Other

| Method | Path               | Purpose                            |
| ------ | ------------------ | ---------------------------------- |
| GET    | `/profile`         | Get user profile                   |
| POST   | `/profile`         | Update user profile                |
| GET    | `/users/search`    | Search users by email              |
| POST   | `/letterboxd/sync` | Sync Letterboxd RSS watched movies |
| POST   | `/movies/import`   | Import Letterboxd CSV              |
| GET    | `/genres`          | TMDB genre list                    |
| GET    | `/search/people`   | TMDB people search                 |
| GET    | `/search/keywords` | TMDB keyword search                |

---

## Notification Types

| Type                   | Trigger                              |
| ---------------------- | ------------------------------------ |
| `partnership_request`  | Someone sends a partner request (email-based flow only) |
| `partnership_accepted` | Your email-based request was accepted |
| `invite_accepted`      | Someone accepted your invite link (invite-link flow) |
| `movie_match`          | Partner liked a movie you also liked |
| `match_milestone`      | Hit 5 / 10 / 25 matches              |
| `import_complete`      | Letterboxd import finished           |

All created via `createNotification(userId, type, data)` helper in `server/index.tsx`.

---

## Frontend Patterns

### Optimistic UI

All user actions update UI immediately, persist to backend in background, revert on failure.

```typescript
async function handleAction(movieId: number) {
    setMovies((prev) => prev.map((m) => (m.id === movieId ? { ...m, flag: true } : m)));
    try {
        await fetch("/api/endpoint", {
            method: "POST",
            body: JSON.stringify({ movieId }),
        });
    } catch {
        setMovies((prev) =>
            prev.map((m) => (m.id === movieId ? { ...m, flag: false } : m)),
        );
        showErrorToast("Failed to save");
    }
}
```

### Polling

Frontend polls every **30 seconds** for:

- `GET /notifications/unread-count` — bell badge
- Match count updates

---

## Rate Limits & Throttling

### OMDb API

| Constraint            | Value          |
| --------------------- | -------------- |
| Daily limit (free)    | 1,000 requests |
| Per-minute limit      | 100 requests   |
| Frontend batch size   | 5 concurrent   |
| Delay between batches | 1,200ms        |

Cache freshness: 7 days for movies < 6 months old, 30 days for older.

---

## Common Pitfalls — What NOT to Do

| Don't                                      | Do Instead                                               |
| ------------------------------------------ | -------------------------------------------------------- |
| Use `kv.getByPrefix` for large lists       | Use `getByPrefixPaginated` — default hits 1000-row limit |
| Use `.in("key", keys)` with many keys      | URL overflows with thousands of keys — use prefix scan   |
| Fetch IMDb ratings one-at-a-time           | Bulk fetch from cache first, then batch-fetch missing    |
| Call OMDb without checking cache first     | Always check `imdb_rating:{tmdbId}` before calling OMDb  |
| Create new tabs for watched/not-interested | Use filter toggles within the existing 3 tabs            |
| Add Redux, Zustand, or other state libs    | React state + context only                               |
| Use localStorage for cross-session data    | Use KV store — localStorage doesn't survive logout       |
| Touch MovieDetailModal in one tab only     | Wire changes in ALL THREE tabs: Discover, Saved, Matches |
| Write inline enrichment logic              | Use `useEnrichMovies` hook                               |

---

## Source Code & Project Links

- **GitHub:** https://github.com/Malteras/Duoreel — always fetch latest before suggesting changes
- **Figma Make:** https://www.figma.com/make/JEzLmEE0PANM7y9S7PQrwP/Movie-Discovery-App
- **Supabase dashboard:** https://supabase.com/dashboard/project/xycuaqjmebzurygsxovt

_Last updated: March 2026_
