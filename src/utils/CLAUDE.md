# Utils — Claude Code Context

## File Overview

| File             | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `filters.ts`     | Client-side movie filtering logic used by all three tabs |
| `imdbRatings.ts` | `globalImdbCache` Map + `onRatingFetched` event bus      |
| `api.ts`         | Base URL construction + typed fetch helpers              |

## filters.ts

Single source of truth for filtering logic. If a tab needs to filter movies by
genre / decade / provider / watched status / keyword — call these functions.
Do NOT reimplement filtering inline in a tab component.

## imdbRatings.ts — Shared Cache

`globalImdbCache: Map<string, string>` — keyed by **IMDb ID** (e.g. `"tt0111161"`).

```typescript
import {
    globalImdbCache,
    onRatingFetched,
    emitRatingFetched,
} from "../utils/imdbRatings";
```

- `onRatingFetched(cb)` — subscribe; returns unsubscribe function. Always clean up in useEffect return.
- `emitRatingFetched(tmdbId, rating)` — called by useEnrichMovies when a new rating arrives.
- Purpose: prevents duplicate OMDb fetches when the same movie appears in multiple tabs.

### Cache key note

`globalImdbCache` is keyed by IMDb ID. `imdbRatings` state in MoviesTab is keyed by
TMDB ID. `MovieCard` receives the rating as a prop — it does NOT look up the cache directly.

## api.ts

Contains `baseUrl` (constructed from Supabase project ref + edge function name) and
fetch wrappers. Import `baseUrl` from here rather than constructing it inline.

Edge function name is `make-server-5623fde1` — NOT `server`.
