# Fix: Partner's List IMDb ratings never fetched

## Root cause

In `SavedMoviesTab.tsx`, the `fetchRatings` useEffect hardcodes `filteredLikedMovies`
(My List) regardless of which tab (`viewMode`) is active. Partner's List movies
are never passed to the rating fetcher. Additionally, the `onRatingFetched`
listener only looks up IMDb IDs in `likedMovies`, so globalImdbCache updates
silently fail for partner movies too.

## Fix — one file: `src/app/components/SavedMoviesTab.tsx`

### Change 1 — fetch ratings for the active list, not always My List

Find:
```tsx
  useEffect(() => {
    if (likedMovies.length === 0) return;

    const fetchRatings = async () => {
      // Only fetch for the movies currently rendered on screen.
      // visibleLikedMovies is already computed as filteredLikedMovies.slice(0, visibleCount)
      // but at this point in the component, we need to derive it from the base list
      // because visibleLikedMovies is defined below in the render section.
      // Re-derive it here using the same logic: apply sort → filter → slice.
      const currentlyVisible = filteredLikedMovies.slice(0, visibleCount);

      if (currentlyVisible.length === 0) return;

      // Only request IDs we don't already have ratings for — avoids re-fetching
      // on every scroll when most ratings are already loaded.
      const tmdbIdsToFetch = currentlyVisible
        .filter(m => !imdbRatings.has(m.id))
        .map(m => m.id);

      if (tmdbIdsToFetch.length === 0) return; // All visible ratings already loaded

      const cached = await bulkFetchCachedRatings(tmdbIdsToFetch, projectId, publicAnonKey);

      if (cached.size > 0) {
        setImdbRatings(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            if (value.rating) updated.set(tmdbId, value.rating);
          });
          return updated;
        });
        setGlobalImdbCache(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            const imdbId = likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
            if (imdbId && value.rating) updated.set(imdbId, value.rating);
          });
          return updated;
        });
      }

      // Background-fetch any that weren't in the cache
      const moviesNeedingRatings = currentlyVisible.filter(
        m => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id)
      );

      if (moviesNeedingRatings.length > 0) {
        const visibleIds = new Set(currentlyVisible.slice(0, 8).map(m => m.id));
        fetchMissingRatings(moviesNeedingRatings, visibleIds, projectId, publicAnonKey);
      }
    };

    fetchRatings();
  }, [likedMovies.length, visibleCount, filterBy, sortBy]);
```

Replace with:
```tsx
  useEffect(() => {
    const activeMovies = viewMode === 'mine' ? filteredLikedMovies : filteredPartnerMovies;
    if (activeMovies.length === 0) return;

    const fetchRatings = async () => {
      const currentlyVisible = activeMovies.slice(0, visibleCount);
      if (currentlyVisible.length === 0) return;

      const tmdbIdsToFetch = currentlyVisible
        .filter(m => !imdbRatings.has(m.id))
        .map(m => m.id);

      if (tmdbIdsToFetch.length === 0) return;

      const cached = await bulkFetchCachedRatings(tmdbIdsToFetch, projectId, publicAnonKey);

      if (cached.size > 0) {
        setImdbRatings(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            if (value.rating) updated.set(tmdbId, value.rating);
          });
          return updated;
        });
        setGlobalImdbCache(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            // Look up IMDb ID from either list
            const imdbId =
              likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id ||
              partnerLikedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
            if (imdbId && value.rating) updated.set(imdbId, value.rating);
          });
          return updated;
        });
      }

      const moviesNeedingRatings = currentlyVisible.filter(
        m => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id)
      );

      if (moviesNeedingRatings.length > 0) {
        const visibleIds = new Set(currentlyVisible.slice(0, 8).map(m => m.id));
        fetchMissingRatings(moviesNeedingRatings, visibleIds, projectId, publicAnonKey);
      }
    };

    fetchRatings();
  }, [likedMovies.length, partnerLikedMovies.length, visibleCount, filterBy, sortBy, viewMode]);
```

Key changes:
- `activeMovies` switches between `filteredLikedMovies` / `filteredPartnerMovies` based on `viewMode`
- `globalImdbCache` update searches both lists for the IMDb ID
- Added `partnerLikedMovies.length` and `viewMode` to dependencies so it re-fires
  when switching to Partner's List or when partner data loads

### Change 2 — fix onRatingFetched listener to also search partner movies

Find:
```tsx
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      setImdbRatings(prev => new Map(prev).set(tmdbId, rating));
      const imdbId = likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) setGlobalImdbCache(prev => new Map(prev).set(imdbId, rating));
    });
    return unsubscribe;
  }, [likedMovies]);
```

Replace with:
```tsx
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      setImdbRatings(prev => new Map(prev).set(tmdbId, rating));
      const imdbId =
        likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id ||
        partnerLikedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) setGlobalImdbCache(prev => new Map(prev).set(imdbId, rating));
    });
    return unsubscribe;
  }, [likedMovies, partnerLikedMovies]);
```

---

## Testing checklist
- [ ] Switch to Saved → Partner's List → IMDb badges load for the first 40 cards
- [ ] Scroll down → next 40 cards get their IMDb ratings fetched
- [ ] Switch back to My List → ratings still work as before
- [ ] IMDb spinner on partner cards resolves, not stuck indefinitely