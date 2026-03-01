# Fix Cross-Tab Filter Navigation (PROPER FIX)

## Problem
Clicking a director, actor, genre, or keyword badge on the Saved/Matches tab navigates to Discover but the filter is NOT applied. The page shows the default unfiltered movie list.

## Root Cause
The cross-tab filter flow has a fatal race condition:

1. `navigateToDiscoverWithFilter` calls `navigate('/discover', { state: { filterType, filterValue } })`
2. DiscoverPage reads state → passes `initialDirector="Sion Sono"` to MoviesTab
3. MoviesTab mounts → `filters` initialized to `DEFAULT_FILTERS` (empty)
4. Cross-tab useEffect fires → `setFilters({ director: "Sion Sono" })` 
5. Same effect calls `onFiltersApplied?.()` → which calls `navigate('/discover', { replace: true, state: null })`
6. This navigation causes DiscoverPage to re-render with null state → `initialDirector=null`
7. MoviesTab **remounts** with default filters → the `setFilters` from step 4 is lost

The `setTimeout(0)` attempted fix didn't help because even a deferred navigate still causes a remount before the fetch effect fires.

## Solution
**Initialize filters with cross-tab values directly in `useState`**, eliminating the need for the cross-tab useEffect and `onFiltersApplied` entirely.

Instead of:
- `useState(DEFAULT_FILTERS)` → then useEffect sets the real filters → then onFiltersApplied navigates → remount loses state

Do:
- Build the cross-tab filters **once** at component init → `useState(crossTabFilters)` → fetch effect fires on mount with correct filters → done

Since the filters are already baked into the initial state, there's no need to clear route state (it becomes harmless — if the user navigates back, `hasCrossTabFilter` will be false because the state is cleared naturally).

## Changes

### File: `src/app/components/MoviesTab.tsx`

#### Step 1: Build initial filters at the top level

Find:
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear || initialKeyword);
  const [movies, setMovies] = useState<Movie[]>(hasCrossTabFilter ? [] : (discoverCache?.movies ?? []));
  const [loading, setLoading] = useState(hasCrossTabFilter ? true : !discoverCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(discoverCache?.page ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<
    { id: number; name: string }[]
  >([]);

  // Filter state — restored from cache if available
  const [filters, setFilters] = useState(hasCrossTabFilter ? DEFAULT_FILTERS : (discoverCache?.filters ?? DEFAULT_FILTERS));
```

Replace with:
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear || initialKeyword);

  // Build cross-tab filters once at mount — no effect/navigate race condition.
  const crossTabFilters = useMemo(() => {
    if (!hasCrossTabFilter) return null;
    const f = { ...DEFAULT_FILTERS };
    if (initialGenre) f.genre = initialGenre;
    if (initialDirector) f.director = initialDirector;
    if (initialActor) f.actor = initialActor;
    if (initialYear) f.year = initialYear.toString();
    if (initialKeyword) {
      f.keyword = initialKeyword;
      f.keywordName = initialKeywordName || null;
    }
    return f;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — only compute on first mount

  const [movies, setMovies] = useState<Movie[]>(hasCrossTabFilter ? [] : (discoverCache?.movies ?? []));
  const [loading, setLoading] = useState(hasCrossTabFilter ? true : !discoverCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(discoverCache?.page ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<
    { id: number; name: string }[]
  >([]);

  // Filter state — restored from cache if available.
  // When arriving via cross-tab navigation, use the pre-built crossTabFilters.
  const [filters, setFilters] = useState(crossTabFilters ?? (discoverCache?.filters ?? DEFAULT_FILTERS));
```

Note: `useMemo` with empty deps ensures `crossTabFilters` is computed once on mount using the initial props, and never recomputed (even if DiscoverPage re-renders with null props later).

#### Step 2: Replace the cross-tab useEffect

Find the entire cross-tab effect:
```typescript
  // ──────────────── Apply initial filters from cross-tab navigation ────────────────
  useEffect(() => {
    if (initialGenre || initialDirector || initialActor || initialYear || initialKeyword) {
      const newFilters = { ...DEFAULT_FILTERS };
      if (initialGenre) newFilters.genre = initialGenre;
      if (initialDirector) newFilters.director = initialDirector;
      if (initialActor) newFilters.actor = initialActor;
      if (initialYear) newFilters.year = initialYear.toString();
      if (initialKeyword) {
        newFilters.keyword = initialKeyword;
        newFilters.keywordName = initialKeywordName || null;
      }
      // Bust cache so next mount doesn't restore stale filtered results.
      // skipNextFetchRef is already false at mount when initial* props are set,
      // so the [filters] fetch effect will fire normally with the new filters.
      setDiscoverCache(null);
      setFilters(newFilters);
      // Defer clearing route state — if we call onFiltersApplied() synchronously,
      // the navigate('/discover', { state: null }) can cause a re-render that
      // remounts MoviesTab before the fetch effect fires, losing the filter state.
      setTimeout(() => onFiltersApplied?.(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGenre, initialDirector, initialActor, initialYear, initialKeyword, initialKeywordName]);
```

Replace with:
```typescript
  // ──────────────── Cross-tab navigation: bust cache + clear route state ────────────────
  // Filters are already baked into initial state via crossTabFilters (no setFilters needed).
  // We just need to clear the discover cache so it doesn't restore stale results on next visit,
  // and clear route state so browser Back doesn't re-trigger the filter.
  useEffect(() => {
    if (crossTabFilters) {
      setDiscoverCache(null);
      onFiltersApplied?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only
```

This is safe because:
- `crossTabFilters` is computed once on mount and never changes
- `setDiscoverCache(null)` just clears the cache (doesn't affect current render)
- `onFiltersApplied?.()` clears route state — but since filters are already in React state (from `useState(crossTabFilters)`), a re-render can't lose them
- The fetch effect fires on mount with the correct `filters` state (which already includes the cross-tab filter values)

## Testing Checklist

- [ ] On **Saved** tab, click a **director** badge → navigates to Discover, "Director: X" chip visible, movies filtered
- [ ] On **Saved** tab, click a **genre** badge → navigates to Discover, filtered by genre
- [ ] On **Saved** tab, click a **keyword** tag → navigates to Discover, "Keyword: X" chip visible, movies filtered
- [ ] On **Matches** tab, click an **actor** badge → navigates to Discover, "Actor: X" chip visible, filtered
- [ ] On **Discover** tab, click director/genre/keyword in modal → filters inline (no navigation — this should still work)
- [ ] After cross-tab navigation, pressing browser **Back** does NOT re-apply the filter
- [ ] Normal Discover usage (no cross-tab) still works — cache restoration, filters, pagination all unaffected

## Why This Works
The key insight: **don't set filters in an effect that also triggers navigation**. Instead, compute the cross-tab filters synchronously during initialization. The `useState` call receives the correct filter values from the start, so the fetch effect (which depends on `[filters]`) fires on mount with the right params. No race condition possible.