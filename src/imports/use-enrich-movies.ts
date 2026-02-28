# Consolidate Movie Enrichment: Use `useEnrichMovies` Hook Across All Tabs

## Problem
Movie enrichment (fetching detail data like director, actors, genres, providers, keywords from `/movies/{id}`) is implemented **three separate times**:

1. `src/app/components/MoviesTab.tsx` (~line 443–546) — inline useEffect for Discover
2. `src/app/hooks/useEnrichMovies.ts` — shared hook used by SavedMoviesTab
3. `src/app/components/MatchesTab.tsx` (~line 229–279) — inline useEffect for Matches

All three do the same thing but with slightly different field extraction, batch sizes, and filter conditions. This causes bugs when adding new fields (like keywords — added to all 3 but Saved's filter condition blocked it).

**Goal:** Make `useEnrichMovies` the single source of truth. Remove inline enrichment from MoviesTab and MatchesTab. One place to add fields, one place to maintain.

## Changes

### File: `src/app/hooks/useEnrichMovies.ts`

#### Step 1: Upgrade the hook to support all tabs

The hook needs:
- All fields from Discover's enrichment (adds `tagline`, `budget`, `revenue`, `original_language`, `status`, `vote_count`)
- A configurable batch size (Discover uses 5, others use 3)
- An `onEnriched` callback so MoviesTab can sync its discover cache
- A `reset()` function so tabs can clear enrichment state on filter/search/refresh
- No genres/director gate — just check enrichedIds like Discover does

Replace the **entire file** with:

```typescript
import { useRef, useState, useEffect, useCallback } from 'react';
import type { Movie } from '../../types/movie';

interface UseEnrichMoviesOptions {
  movies: Movie[];
  setMovies: (updater: (prev: Movie[]) => Movie[]) => void;
  publicAnonKey: string | null;
  baseUrl: string;
  /** Batch size for parallel fetches (default: 5) */
  batchSize?: number;
  /** Called after each batch is merged — use to sync external caches */
  onEnriched?: (updatedMovies: Movie[]) => void;
  /** Extra dependency to trigger re-enrichment (e.g. accessToken) */
  dep?: unknown;
}

/**
 * Shared hook that enriches movies with detail data from /movies/{id}.
 * Extracts: director, actors, genres, runtime, external_ids, homepage,
 * watch/providers, keywords, tagline, budget, revenue, original_language,
 * status, vote_count.
 *
 * Used by all tabs (Discover, Saved, Matches) — single source of truth
 * for the field extraction logic.
 */
export function useEnrichMovies({
  movies,
  setMovies,
  publicAnonKey,
  baseUrl,
  batchSize = 5,
  onEnriched,
  dep,
}: UseEnrichMoviesOptions) {
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  /** Reset enrichment tracking — call on filter change, search, or refresh */
  const resetEnrichment = useCallback(() => {
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
  }, []);

  useEffect(() => {
    if (movies.length === 0 || !publicAnonKey) return;

    const enrich = async () => {
      const toEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id)
      );
      if (toEnrich.length === 0) return;

      toEnrich.forEach((m) => enrichingRef.current.add(m.id));

      for (let i = 0; i < toEnrich.length; i += batchSize) {
        const batch = toEnrich.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (movie) => {
            try {
              const res = await fetch(`${baseUrl}/movies/${movie.id}`, {
                headers: { Authorization: `Bearer ${publicAnonKey}` },
              });
              if (!res.ok) return null;
              return res.json();
            } catch {
              return null;
            }
          })
        );

        let updatedMovies: Movie[] = [];

        setMovies((prev) => {
          updatedMovies = prev.map((movie) => {
            const idx = batch.findIndex((b) => b.id === movie.id);
            if (idx === -1) return movie;
            const result = results[idx];
            if (result.status !== 'fulfilled' || !result.value) return movie;
            const d = result.value;

            const director =
              d.credits?.crew?.find(
                (c: { job: string; name: string }) => c.job === 'Director'
              )?.name || movie.director;
            const actors =
              d.credits?.cast?.slice(0, 5).map((a: { name: string }) => a.name) ||
              movie.actors;

            return {
              ...movie,
              runtime: d.runtime || movie.runtime,
              director,
              actors,
              genres: d.genres || movie.genres,
              external_ids: d.external_ids || movie.external_ids,
              homepage: d.homepage || movie.homepage,
              'watch/providers': d['watch/providers'] || movie['watch/providers'],
              keywords: d.keywords?.keywords || movie.keywords,
              tagline: d.tagline ?? movie.tagline,
              budget: d.budget ?? movie.budget,
              revenue: d.revenue ?? movie.revenue,
              original_language: d.original_language || movie.original_language,
              status: d.status ?? movie.status,
              vote_count: d.vote_count || movie.vote_count,
            };
          });
          return updatedMovies;
        });

        // Notify caller so they can sync external caches
        if (onEnriched && updatedMovies.length > 0) {
          onEnriched(updatedMovies);
        }

        setEnrichedIds((prev) => {
          const s = new Set(prev);
          batch.forEach((m) => s.add(m.id));
          return s;
        });

        if (i + batchSize < toEnrich.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies.length, publicAnonKey, dep]);

  return { enrichedIds, setEnrichedIds, enrichingRef, resetEnrichment };
}
```

Key changes from the old version:
- **No genres/director/keywords gate** — enriches any unenriched movie (same as Discover's approach)
- **All fields extracted** — includes `tagline`, `budget`, `revenue`, `original_language`, `status`, `vote_count` that were previously Discover-only
- **Configurable `batchSize`** — defaults to 5 (Discover's value)
- **`onEnriched` callback** — called with the updated movies array after each batch, so MoviesTab can sync `discoverCache`
- **`resetEnrichment()` function** — exposed so tabs can clear state on filter/search/refresh
- **Returns `setEnrichedIds`** — needed by MoviesTab for cache restoration
- Uses `??` for fields like `tagline`/`budget`/`revenue`/`status` because they can be falsy (0 budget, empty string tagline)

---

### File: `src/app/components/MoviesTab.tsx`

#### Step 2: Import the hook

Find the imports at the top of the file. Add the import (if not already present):

```typescript
import { useEnrichMovies } from "../hooks/useEnrichMovies";
```

If this import line already exists from a prior version, keep it.

#### Step 3: Remove local enrichedIds/enrichingRef state declarations

Find (~line 197–200):
```typescript
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(
    discoverCache?.enrichedIds ?? new Set(),
  );
  const enrichingRef = useRef<Set<number>>(discoverCache?.enrichedIds ? new Set(discoverCache.enrichedIds) : new Set());
```

Replace with the hook call:
```typescript
  const { enrichedIds, setEnrichedIds, enrichingRef, resetEnrichment } = useEnrichMovies({
    movies,
    setMovies,
    publicAnonKey,
    baseUrl,
    batchSize: 5,
    onEnriched: (updatedMovies) => {
      setDiscoverCache(c => c ? { ...c, movies: updatedMovies } : null);
    },
  });
```

**Important:** The hook's `enrichedIds` starts as an empty `Set`. But when restoring from cache, MoviesTab needs to also restore `enrichedIds` so it doesn't re-enrich cached movies. Add this right after the hook call:

```typescript
  // Restore enrichedIds from cache on mount (only once)
  const restoredEnrichRef = useRef(false);
  useEffect(() => {
    if (!restoredEnrichRef.current && discoverCache?.enrichedIds && discoverCache.enrichedIds.size > 0) {
      setEnrichedIds(discoverCache.enrichedIds);
      enrichingRef.current = new Set(discoverCache.enrichedIds);
      restoredEnrichRef.current = true;
    }
  }, [discoverCache?.enrichedIds]);
```

#### Step 4: Delete the entire inline enrichment useEffect

Delete the block from `// ──────────────── Enrich movies with details` through the closing of that `useEffect` (~line 443 to ~line 546). This is the large block that starts with:

```typescript
  // ──────────────── Enrich movies with details (director, actors, providers) ────────────────
  useEffect(() => {
    if (movies.length === 0) return;

    const enrichMovies = async () => {
```

And ends with:
```typescript
    enrichMovies();
  }, [movies.length, enrichedIds.size]);
```

Delete this entire block — the hook now handles it.

#### Step 5: Replace enrichment reset calls with `resetEnrichment()`

There are 3 places where `setEnrichedIds(new Set())` and `enrichingRef.current = new Set()` appear. Replace each pair with `resetEnrichment()`.

**Location 1** — Filter/sort change effect (~line 434–435):

Find:
```typescript
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
```

Replace with:
```typescript
    resetEnrichment();
```

**Location 2** — Search handler (~line 686–687):

Find:
```typescript
          setEnrichedIds(new Set());
          enrichingRef.current = new Set();
```

Replace with:
```typescript
          resetEnrichment();
```

**Location 3** — Refresh handler (~line 933–934):

Find:
```typescript
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
```

Replace with:
```typescript
    resetEnrichment();
```

#### Step 6: Keep the enrichedIds → discoverCache sync effect as-is

The existing effect (~line 653–658) that syncs `enrichedIds` to `discoverCache` should remain:
```typescript
  useEffect(() => {
    setDiscoverCache(c => c ? { ...c, enrichedIds } : null);
  }, [enrichedIds]);
```

This still works because the hook now returns `enrichedIds` as state.

---

### File: `src/app/components/MatchesTab.tsx`

#### Step 7: Import the hook

Add the import at the top (if not already present):
```typescript
import { useEnrichMovies } from "../hooks/useEnrichMovies";
```

#### Step 8: Remove local enrichedIds/enrichingRef state

Find (~line 83–84):
```typescript
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());
```

Replace with the hook call:
```typescript
  const { resetEnrichment } = useEnrichMovies({
    movies: matchedMovies,
    setMovies: setMatchedMovies as (updater: (prev: Movie[]) => Movie[]) => void,
    publicAnonKey,
    baseUrl,
    batchSize: 3,
    dep: accessToken,
  });
```

Note: MatchesTab doesn't need `enrichedIds` or `enrichingRef` directly — it only resets them. The hook handles everything internally.

#### Step 9: Replace the enrichment reset with `resetEnrichment()`

Find (~line 128–129):
```typescript
        setEnrichedIds(new Set());
        enrichingRef.current = new Set();
```

Replace with:
```typescript
        resetEnrichment();
```

#### Step 10: Delete the entire inline enrichment useEffect

Delete the block from `// ── Provider enrichment ──` through its useEffect closing (~line 228–279). This is the block that starts with:

```typescript
  // ── Provider enrichment ────────────────────────────────────────────────────
  useEffect(() => {
    if (matchedMovies.length === 0 || !accessToken) return;
    const enrichMovies = async () => {
```

And ends with:
```typescript
    enrichMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedMovies.length, accessToken]);
```

Delete this entire block — the hook now handles it.

---

### File: `src/app/components/SavedMoviesTab.tsx`

No changes needed — SavedMoviesTab already uses `useEnrichMovies`. It will automatically get all the new fields (tagline, budget, revenue, etc.) and the fixed filter condition from the updated hook.

---

## Impact Assessment

- **Risk: Medium** — touching enrichment in 2 core tabs. But the logic is identical, so this is a safe deduplication.
- **Performance: Identical** — same fetch pattern, same batching, same deduplication via enrichedIds.
- **Backwards compatible** — no API changes, no data model changes. The hook extracts a superset of what each tab previously extracted.
- **Files changed:** 3 (`useEnrichMovies.ts`, `MoviesTab.tsx`, `MatchesTab.tsx`)
- **Lines removed:** ~100 lines of duplicated enrichment code across MoviesTab and MatchesTab
- **Future-proof:** Adding a new field means updating ONE place — the hook's extraction block.

## Testing Checklist

- [ ] **Discover tab**: Movies load → enrichment fires → open modal → all fields present (director, cast, genres, keywords, tagline, budget, revenue, providers)
- [ ] **Saved tab**: Movies load → enrichment fires → open modal → all fields present including keywords
- [ ] **Matches tab**: Movies load → enrichment fires → open modal → all fields present including keywords
- [ ] **Discover filter change**: Change genre filter → movies refresh → enrichment resets and re-enriches new movies
- [ ] **Discover search**: Search for a movie → enrichment resets → results get enriched
- [ ] **Discover refresh**: Click refresh → enrichment resets → movies re-enriched
- [ ] **Discover cache restore**: Navigate away from Discover → return → movies and enrichedIds restored from cache, no re-enrichment flicker
- [ ] **Matches refresh**: Fresh load of Matches → enrichment fires → all data populated
- [ ] **Network tab**: Verify `/movies/{id}` calls still happen in batches, no duplicate calls for the same movie
- [ ] **No regressions**: Compare a movie modal on each tab with the current live version — same fields visible

## Summary Table

| What | Before | After |
|------|--------|-------|
| Enrichment implementations | 3 (MoviesTab inline, useEnrichMovies hook, MatchesTab inline) | 1 (useEnrichMovies hook) |
| Place to add new fields | 3 files | 1 file (`useEnrichMovies.ts`) |
| Saved tab fields | runtime, director, actors, genres, external_ids, homepage, providers, keywords | + tagline, budget, revenue, original_language, status, vote_count |
| Matches tab fields | runtime, director, actors, genres, providers, external_ids, keywords | + tagline, budget, revenue, original_language, status, vote_count, homepage |
| Duplicated enrichment code | ~100 lines across 2 files | 0 lines — deleted |
| Reset mechanism | Manual `setEnrichedIds(new Set())` + `enrichingRef.current = new Set()` in each tab | Single `resetEnrichment()` call |