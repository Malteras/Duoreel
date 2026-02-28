# Fix Keywords Not Showing in Saved Tab + Consolidate Enrichment Logic

## Problem
Keywords display correctly in Discover tab movie modals but are **missing** in Saved tab modals. The same `MovieDetailModal` component is used across all tabs (good!), but the enrichment logic that populates movie data before it reaches the modal is **duplicated across 3 places** with different filter conditions — and the Saved tab's version skips movies that already have genres, meaning the detail API call (which includes keywords) never fires.

Additionally, having 3 separate enrichment implementations means every new field requires updates in 3 places, which is error-prone and exactly what caused this bug.

## Root Cause

In `src/app/hooks/useEnrichMovies.ts` (used by SavedMoviesTab), line 32:

```typescript
const toEnrich = movies.filter(
  (m) =>
    !enrichedIds.has(m.id) &&
    !enrichingRef.current.has(m.id) &&
    (!m.genres || m.genres.length === 0) &&  // ← THIS skips saved movies that already have genres
    !m.director                               // ← AND this skips if director already exists
);
```

Saved movies already have `genres` and `director` from the initial list fetch, so `useEnrichMovies` skips them entirely. They never get the individual `/movies/{id}` detail call that returns `keywords` via `append_to_response`.

Compare with:
- **Discover (MoviesTab.tsx line 449)**: Only checks `!enrichedIds.has(m.id)` — enriches ALL movies → keywords work ✅
- **Matches (MatchesTab.tsx line 232)**: Only checks `!enrichedIds.has(m.id)` — enriches ALL movies → keywords work ✅
- **Saved (useEnrichMovies.ts line 32)**: Also checks `(!m.genres || m.genres.length === 0) && !m.director` — skips most movies → keywords missing ❌

## Changes

### File: `src/app/hooks/useEnrichMovies.ts`

#### Step 1: Fix the enrichment filter — also enrich movies missing keywords

The genres/director gate was an optimization to avoid re-fetching movies that already had detail data. But now that we have `keywords` (which aren't present in list responses), we need to also check for missing keywords.

Find (~line 30–35):
```typescript
      const toEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id) &&
          (!m.genres || m.genres.length === 0) &&
          !m.director
      );
```

Replace with:
```typescript
      const toEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id) &&
          ((!m.genres || m.genres.length === 0) || !m.director || !m.keywords)
      );
```

This means: enrich any movie that is missing genres OR director OR keywords. Once enriched, the movie's ID gets added to `enrichedIds` so it won't be re-enriched.

This is a minimal, surgical fix that makes keywords work on the Saved tab immediately.

## Testing Checklist

- [ ] Open a movie modal on the **Discover tab** → keywords appear (confirm still works)
- [ ] Open a movie modal on the **Saved tab** → keywords now appear below genres in slate badges
- [ ] Open a movie modal on the **Matches tab** → keywords appear (confirm still works)
- [ ] On the Saved tab, wait for movies to load fully → open modal → keywords should be present (enrichment runs in background)
- [ ] Verify in DevTools Network tab that Saved tab movies are making `/movies/{id}` calls (they weren't before for movies that already had genres)
- [ ] Check that enrichment doesn't re-fetch movies that were already enriched (enrichedIds tracking still works)
- [ ] Verify no performance regression — enrichment should still batch in groups of 3

## Summary Table

| What | Before | After |
|------|--------|-------|
| Keywords in Discover modal | ✅ Shown | ✅ Shown |
| Keywords in Saved modal | ❌ Missing | ✅ Shown |
| Keywords in Matches modal | ✅ Shown | ✅ Shown |
| useEnrichMovies filter | Skips movies with genres+director | Enriches any movie missing genres, director, OR keywords |
| Files changed | 1 | 1 |

## Note on Enrichment Duplication

There are currently 3 separate enrichment implementations:
1. `MoviesTab.tsx` (~line 444–534) — inline enrichment for Discover
2. `useEnrichMovies.ts` — shared hook used by SavedMoviesTab
3. `MatchesTab.tsx` (~line 230–280) — inline enrichment for Matches

All three do the same thing: fetch `/movies/{id}`, extract director/actors/genres/providers/keywords, merge into movie state. This is the reason keywords broke on Saved — the field extraction was added to all 3 but the filter condition differed.

Ideally, MoviesTab and MatchesTab should also use `useEnrichMovies` instead of their own inline implementations, so there's ONE place to update when adding new fields. But that's a larger refactor — this prompt fixes the immediate keyword bug with a one-line change.