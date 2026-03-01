# Fix Cross-Tab Filter Navigation (Director/Actor/Genre/Keyword from Saved/Matches)

## Problem
Clicking a director, actor, genre, or keyword badge on the Saved or Matches tab navigates to Discover but the filter isn't applied — it shows the default unfiltered movie list.

## Root Cause
In the cross-tab filter effect in MoviesTab, `onFiltersApplied?.()` is called **synchronously** after `setFilters(newFilters)`. 

`onFiltersApplied` calls `navigate('/discover', { replace: true, state: null })`, which clears the route state. This causes DiscoverPage to re-render with `initialGenre=null`, `initialDirector=null`, etc. If React Router triggers a remount of MoviesTab (or if the re-render happens before the filters fetch effect fires), the filter state is lost.

The fix: use a `requestAnimationFrame` or `setTimeout` to defer clearing the route state until after React has committed the filter state and the fetch effect has had a chance to fire.

## Changes

### File: `src/app/components/MoviesTab.tsx`

Find the cross-tab filter effect (~line 427–446):

```typescript
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
      onFiltersApplied?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGenre, initialDirector, initialActor, initialYear, initialKeyword, initialKeywordName]);
```

Replace with:

```typescript
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

The only change is wrapping `onFiltersApplied?.()` in `setTimeout(() => ..., 0)`. This defers the route state clearing to the next tick, giving React time to commit the filter state update and trigger the fetch effect first.

## Testing Checklist

- [ ] On Saved tab, click a **director** badge → navigates to Discover, shows movies by that director, "Director: X" chip visible
- [ ] On Saved tab, click a **genre** badge → navigates to Discover, filtered by genre
- [ ] On Saved tab, click a **keyword** tag → navigates to Discover, filtered by keyword, "Keyword: X" chip visible
- [ ] On Matches tab, click a **director** badge → same, filtered by director
- [ ] On Matches tab, click an **actor** badge → same, filtered by actor
- [ ] On Discover tab, click a director/genre/keyword in a modal → filters inline without navigation (this should still work as before)
- [ ] After cross-tab filter applies, pressing browser Back does NOT re-apply the filter (route state was cleared)

## Summary Table

| What | Before | After |
|------|--------|-------|
| Cross-tab filter (director/genre/actor/keyword) | Navigates to Discover but shows unfiltered results | Navigates to Discover with filter correctly applied |
| Route state clearing | Synchronous (race condition) | Deferred via setTimeout(0) |
| Back button behavior | No change | No change — state still cleared after filter applies |