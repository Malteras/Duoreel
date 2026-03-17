# Hooks — Claude Code Context

## Hook Inventory

| Hook                   | Purpose                                                                                                      | Used By                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `useEnrichMovies.ts`   | Fetches director/actors/genres/runtime/providers for un-enriched movies. Also handles IMDb ratings via OMDb. | MoviesTab, SavedMoviesTab, MatchesTab |
| `useWatchedActions.ts` | Mark watched / unmark watched with optimistic UI + revert                                                    | All three tabs via MovieDetailModal   |
| `useMovieModal.ts`     | Modal open/close state + movie data                                                                          | All three tabs                        |
| `useTabCache.ts`       | Per-tab scroll position + filter persistence                                                                 | AppLayout                             |
| `useCSVImport.ts`      | Letterboxd CSV parse + batched import logic                                                                  | ImportContext                         |

## Rules

### useEnrichMovies is the ONLY enrichment path

Never write inline enrichment logic in a tab component. Always import and use
`useEnrichMovies`. Adding a second enrichment code path causes duplicate API calls
and divergent state.

Detection logic for un-enriched movies (inside the hook):

```typescript
(!m.genres || m.genres.length === 0) && !m.director;
```

Un-enriched movies come from Letterboxd CSV imports — they only have TMDB search fields
(`genre_ids` as numbers, no `genres` as objects, no `director`, no `actors`).

### OMDb rate limits

`useEnrichMovies` manages the OMDb fetch path. Free tier: 1,000 req/day, 100/min.

- Batch size: 5 concurrent
- Delay between batches: 1,200ms
- Always check KV cache before calling OMDb (`imdb_rating:{tmdbId}`)
- Never add OMDb calls outside this hook

### Optimistic UI pattern (useWatchedActions)

```typescript
// 1. Save previous state
// 2. Apply optimistic update immediately
// 3. Persist to backend
// 4. On failure: revert + toast
```

### Tab cache

`useTabCache` persists per-tab state (scroll, filters, view mode) across navigation.
Uses React state + sessionStorage — NOT localStorage. Do not change the storage target.
