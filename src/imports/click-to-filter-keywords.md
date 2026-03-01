# Click-to-Filter by TMDB Keywords

## Problem
Keywords now display in the movie detail modal but they're not interactive. Users should be able to click a keyword like "heist" or "dystopia" and see all movies matching that keyword in the Discover tab — the same pattern that already works for genres, directors, and actors.

## Approach
Follow the exact same click-to-filter pattern used by genres, directors, and actors:
- On the Discover tab: clicking a keyword sets the filter inline via `updateFilter`
- On Saved/Matches tabs: clicking a keyword triggers `navigateToDiscoverWithFilter` to switch to Discover with the keyword filter applied
- The server passes the keyword ID to TMDB's `with_keywords` param in the Discover endpoint

Since keyword IDs are already available from enrichment (each keyword has `{ id, name }`), no name→ID resolution is needed (unlike directors/actors which require a TMDB person search). We pass the keyword ID directly.

## Changes

### File: `src/utils/filters.ts`

#### Step 1: Add `keyword` to the Filters interface and defaults

Find:
```typescript
export interface Filters {
  genre: string;
  decade: string;
  rating: string;
  year: string;
  director: string | null;
  actor: string | null;
  language: string | null;
  duration: string;
  streamingServices: string[];
}

export const DEFAULT_FILTERS: Filters = {
  genre: "all",
  decade: "all",
  rating: "all",
  year: "all",
  director: null,
  actor: null,
  language: null,
  duration: "all",
  streamingServices: [],
};
```

Replace with:
```typescript
export interface Filters {
  genre: string;
  decade: string;
  rating: string;
  year: string;
  director: string | null;
  actor: string | null;
  language: string | null;
  duration: string;
  streamingServices: string[];
  keyword: string | null;
}

export const DEFAULT_FILTERS: Filters = {
  genre: "all",
  decade: "all",
  rating: "all",
  year: "all",
  director: null,
  actor: null,
  language: null,
  duration: "all",
  streamingServices: [],
  keyword: null,
};
```

---

### File: `supabase/functions/server/index.tsx`

#### Step 2: Add `keyword` query param to the discover-filtered endpoint

In the `discover-filtered` route, find the query parameter extraction block (~line 2670):
```typescript
    const sortBy = c.req.query('sortBy') || 'popularity.desc';
    const includeWatched = c.req.query('includeWatched') === 'true';
```

Replace with:
```typescript
    const sortBy = c.req.query('sortBy') || 'popularity.desc';
    const keyword = c.req.query('keyword');
    const includeWatched = c.req.query('includeWatched') === 'true';
```

#### Step 3: Pass keyword ID to TMDB in the URL builder

In the `buildTmdbUrl` function, find (~line 2768):
```typescript
      if (withCast) params.append('with_cast', withCast);
```

Add after it:
```typescript
      if (withCast) params.append('with_cast', withCast);
      if (keyword) params.append('with_keywords', keyword);
```

---

### File: `src/app/components/MoviesTab.tsx`

#### Step 4: Add `initialKeyword` prop

Find the MoviesTabProps interface (~line 54–57):
```typescript
  initialGenre?: string | null;
  initialDirector?: string | null;
  initialActor?: string | null;
  initialYear?: number | null;
```

Replace with:
```typescript
  initialGenre?: string | null;
  initialDirector?: string | null;
  initialActor?: string | null;
  initialYear?: number | null;
  initialKeyword?: string | null;
```

#### Step 5: Destructure `initialKeyword` from props

Find (~line 98–101):
```typescript
  initialGenre,
  initialDirector,
  initialActor,
  initialYear,
```

Replace with:
```typescript
  initialGenre,
  initialDirector,
  initialActor,
  initialYear,
  initialKeyword,
```

#### Step 6: Include `initialKeyword` in `hasCrossTabFilter`

Find (~line 113):
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear);
```

Replace with:
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear || initialKeyword);
```

#### Step 7: Include `initialKeyword` in the skipNextFetchRef guard

Find (~line 206):
```typescript
  const skipNextFetchRef = useRef(!!discoverCache && !initialGenre && !initialDirector && !initialActor && !initialYear);
```

Replace with:
```typescript
  const skipNextFetchRef = useRef(!!discoverCache && !initialGenre && !initialDirector && !initialActor && !initialYear && !initialKeyword);
```

#### Step 8: Send keyword filter param to the API

Find in the fetch function where params are built (~line 293–304). After the language param:
```typescript
        if (filters.language)
          params.append("language", filters.language);
```

Add after it:
```typescript
        if (filters.language)
          params.append("language", filters.language);
        if (filters.keyword)
          params.append("keyword", filters.keyword);
```

#### Step 9: Include keyword in the active filter count

Find (~line 246–254):
```typescript
    if (filters.genre !== "all") count++;
    if (filters.decade !== "all") count++;
    if (filters.rating !== "all") count++;
    if (filters.year !== "all") count++;
    if (filters.director) count++;
    if (filters.actor) count++;
    if (filters.language) count++;
    if (filters.duration !== "all") count++;
    if (filters.streamingServices.length > 0) count++;
```

Replace with:
```typescript
    if (filters.genre !== "all") count++;
    if (filters.decade !== "all") count++;
    if (filters.rating !== "all") count++;
    if (filters.year !== "all") count++;
    if (filters.director) count++;
    if (filters.actor) count++;
    if (filters.language) count++;
    if (filters.duration !== "all") count++;
    if (filters.streamingServices.length > 0) count++;
    if (filters.keyword) count++;
```

#### Step 10: Apply initialKeyword in the cross-tab filter effect

Find (~line 403–408):
```typescript
    if (initialGenre || initialDirector || initialActor || initialYear) {
      const newFilters = { ...DEFAULT_FILTERS };
      if (initialGenre) newFilters.genre = initialGenre;
      if (initialDirector) newFilters.director = initialDirector;
      if (initialActor) newFilters.actor = initialActor;
      if (initialYear) newFilters.year = initialYear.toString();
```

Replace with:
```typescript
    if (initialGenre || initialDirector || initialActor || initialYear || initialKeyword) {
      const newFilters = { ...DEFAULT_FILTERS };
      if (initialGenre) newFilters.genre = initialGenre;
      if (initialDirector) newFilters.director = initialDirector;
      if (initialActor) newFilters.actor = initialActor;
      if (initialYear) newFilters.year = initialYear.toString();
      if (initialKeyword) newFilters.keyword = initialKeyword;
```

#### Step 11: Update the useEffect dependency array

Find (~line 417):
```typescript
  }, [initialGenre, initialDirector, initialActor, initialYear]);
```

Replace with:
```typescript
  }, [initialGenre, initialDirector, initialActor, initialYear, initialKeyword]);
```

#### Step 12: Add `onKeywordClick` to MovieDetailModal usage in Discover tab

Find the MovieDetailModal in the Discover tab MovieCard grid (~line 1326–1329):
```typescript
                    onDirectorClick={(director) => updateFilter("director", director)}
                    onGenreClick={(genreId) => updateFilter("genre", genreId.toString())}
```

Add after `onGenreClick`:
```typescript
                    onDirectorClick={(director) => updateFilter("director", director)}
                    onGenreClick={(genreId) => updateFilter("genre", genreId.toString())}
                    onKeywordClick={(keywordId) => updateFilter("keyword", keywordId.toString())}
```

Also find the standalone MovieDetailModal at the bottom of the component (~line 1614–1622) and add `onKeywordClick` there too:
```typescript
        onGenreClick={(genreId) => {
          updateFilter("genre", genreId.toString());
        }}
```

Add after:
```typescript
        onKeywordClick={(keywordId) => {
          updateFilter("keyword", keywordId.toString());
        }}
```

---

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 13: Add `onKeywordClick` prop

Find in the interface (~line 24):
```typescript
  onGenreClick?: (genreId: number) => void;
  onDirectorClick?: (director: string) => void;
```

Add after `onGenreClick`:
```typescript
  onGenreClick?: (genreId: number) => void;
  onKeywordClick?: (keywordId: number) => void;
  onDirectorClick?: (director: string) => void;
```

#### Step 14: Destructure `onKeywordClick`

Find in the destructured props (~line 50):
```typescript
  onGenreClick,
  onDirectorClick,
```

Add after `onGenreClick`:
```typescript
  onGenreClick,
  onKeywordClick,
  onDirectorClick,
```

#### Step 15: Make keyword badges clickable

Find the keywords section:
```tsx
              {/* Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.keywords.slice(0, 8).map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="secondary"
                      className="rounded-full bg-slate-700/80 text-slate-300 border-slate-600 text-xs font-normal"
                    >
                      {kw.name}
                    </Badge>
                  ))}
                </div>
              )}
```

Replace with:
```tsx
              {/* Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.keywords.slice(0, 8).map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="secondary"
                      className="rounded-full bg-slate-700/80 text-slate-300 border-slate-600 text-xs font-normal cursor-pointer hover:bg-slate-600 hover:text-slate-200 hover:border-slate-500 transition-colors"
                      onClick={() => {
                        onKeywordClick?.(kw.id);
                        onClose();
                      }}
                    >
                      {kw.name}
                    </Badge>
                  ))}
                </div>
              )}
```

---

### File: `src/app/components/AppLayout.tsx`

#### Step 16: Add `'keyword'` to the navigateToDiscoverWithFilter type

Find (~line 26–28):
```typescript
  navigateToDiscoverWithFilter: (
    filterType: 'genre' | 'director' | 'actor' | 'year',
    value: string | number
  ) => void;
```

Replace with:
```typescript
  navigateToDiscoverWithFilter: (
    filterType: 'genre' | 'director' | 'actor' | 'year' | 'keyword',
    value: string | number
  ) => void;
```

#### Step 17: Handle `keyword` in the MoviesTab route

Find where `initialGenre`, `initialDirector`, etc. are passed to MoviesTab. Search for where `filterType` and `filterValue` from `location.state` are mapped to props. Add `initialKeyword` alongside the others. The exact location depends on how the route renders MoviesTab — look for something like:

```typescript
initialGenre={state?.filterType === 'genre' ? state.filterValue : null}
```

Add:
```typescript
initialKeyword={state?.filterType === 'keyword' ? String(state.filterValue) : null}
```

---

### File: `src/app/components/SavedMoviesTab.tsx`

#### Step 18: Add `onKeywordClick` to all MovieDetailModal usages

Find every `onGenreClick` line in this file and add `onKeywordClick` after each one. The pattern is:
```typescript
onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
```

Add after each:
```typescript
onKeywordClick={(keywordId) => navigateToDiscoverWithFilter('keyword', keywordId)}
```

Also update the `navigateToDiscoverWithFilter` prop type in the component's interface:
```typescript
navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
```

Replace with:
```typescript
navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year' | 'keyword', value: string | number) => void;
```

---

### File: `src/app/components/MatchesTab.tsx`

#### Step 19: Add `onKeywordClick` to all MovieDetailModal usages

Same pattern as SavedMoviesTab. Find every `onGenreClick` line and add `onKeywordClick` after each:
```typescript
onKeywordClick={(keywordId) => navigateToDiscoverWithFilter('keyword', keywordId)}
```

Also update the `navigateToDiscoverWithFilter` prop type in this component's interface to include `'keyword'`.

---

## Impact Assessment

- **Risk: Low** — follows the exact same pattern as genre/director/actor filtering. No new patterns introduced.
- **Performance: Minimal overhead** — keyword ID is passed directly to TMDB's `with_keywords` param, no extra API calls needed (unlike directors/actors which require person search).
- **Backwards compatible** — `keyword` defaults to `null` in `DEFAULT_FILTERS`, so existing behavior is unchanged.
- **Files touched:** 8 files across server and frontend.

## UX Flow

```
User opens movie detail modal
  → Sees keyword badges below genres (e.g. "heist", "dark comedy")
  → Clicks "heist"
  → Modal closes
  → [On Discover tab]: filter updates inline, movies refresh to show heist movies
  → [On Saved/Matches tab]: navigates to Discover tab with keyword filter pre-applied
  → User sees Discover results filtered by the "heist" keyword
  → Filter badge count increases by 1 (keyword counts as active filter)
  → User can clear filters to return to normal browsing
```

## Testing Checklist

- [ ] Click a keyword on the **Discover tab** → modal closes, movies refresh showing only movies with that keyword
- [ ] Click a keyword on the **Saved tab** → navigates to Discover with keyword filter applied
- [ ] Click a keyword on the **Matches tab** → navigates to Discover with keyword filter applied
- [ ] Active filter count badge increments when keyword is active
- [ ] "Clear filters" resets keyword filter back to null
- [ ] Keyword filter combines correctly with other filters (e.g. genre + keyword)
- [ ] Keyword badges show hover state (lighter slate) indicating they're clickable
- [ ] Keywords still display correctly for movies with no click handler (edge case)
- [ ] Verify the TMDB discover API returns relevant results when `with_keywords` is passed

## Summary Table

| What | Before | After |
|------|--------|-------|
| Keyword badges | Static, non-interactive | Clickable with hover states |
| Keyword filtering | Not available | Click keyword → filter Discover by TMDB keyword ID |
| Cross-tab keyword filter | Not available | Saved/Matches → Discover with keyword pre-applied |
| Filter count | Doesn't include keywords | Includes keywords in active filter count |
| Server `with_keywords` | Not passed to TMDB | Passed when keyword filter is active |