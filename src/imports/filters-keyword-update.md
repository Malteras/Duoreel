# Click-to-Filter by TMDB Keywords + Advanced Filters UI

## Problem
Keywords display in the movie detail modal but they're static — not clickable. Users should be able to click a keyword like "heist" or "dystopia" and see all movies matching that keyword in the Discover tab. Additionally, when a keyword filter is active, the Advanced Filters modal needs to show which keyword is selected and allow clearing it.

## Approach
Follow the exact click-to-filter pattern used by genres, directors, and actors. Keywords are set by clicking tags in the movie modal (not by typing/searching), so the Advanced Filters modal shows the active keyword as a read-only display with a Clear button — same pattern as the selected director/actor display.

Since keyword IDs are already available from enrichment (each keyword has `{ id, name }`), no name→ID resolution is needed on the server (unlike directors/actors which require a TMDB person search). We pass the keyword ID directly to TMDB's `with_keywords` param.

To display the keyword name in the Advanced Filters modal, we store both `keyword` (ID) and `keywordName` (display name) in the Filters interface.

## Changes

### File: `src/utils/filters.ts`

#### Step 1: Add keyword fields to Filters

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
  keywordName: string | null;
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
  keywordName: null,
};
```

---

### File: `supabase/functions/server/index.tsx`

#### Step 2: Add `keyword` query param to discover-filtered

In the discover-filtered route, find the query parameter extraction block:
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

In the `buildTmdbUrl` function, find:
```typescript
      if (withCast) params.append('with_cast', withCast);
```

Add after it:
```typescript
      if (withCast) params.append('with_cast', withCast);
      if (keyword) params.append('with_keywords', keyword);
```

---

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 4: Add `onKeywordClick` prop

Find in the interface:
```typescript
  onGenreClick?: (genreId: number) => void;
  onDirectorClick?: (director: string) => void;
```

Add after `onGenreClick`:
```typescript
  onGenreClick?: (genreId: number) => void;
  onKeywordClick?: (keywordId: number, keywordName: string) => void;
  onDirectorClick?: (director: string) => void;
```

Note: the callback passes both `keywordId` and `keywordName` so the caller can store both.

#### Step 5: Destructure `onKeywordClick`

Find in the destructured props:
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

#### Step 6: Make keyword badges clickable

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
                        onKeywordClick?.(kw.id, kw.name);
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

### File: `src/app/components/MoviesTab.tsx`

#### Step 7: Add `initialKeyword` and `initialKeywordName` props

Find in the MoviesTabProps interface:
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
  initialKeywordName?: string | null;
```

#### Step 8: Destructure the new props

Find:
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
  initialKeywordName,
```

#### Step 9: Include in `hasCrossTabFilter`

Find:
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear);
```

Replace with:
```typescript
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear || initialKeyword);
```

#### Step 10: Include in `skipNextFetchRef`

Find:
```typescript
  const skipNextFetchRef = useRef(!!discoverCache && !initialGenre && !initialDirector && !initialActor && !initialYear);
```

Replace with:
```typescript
  const skipNextFetchRef = useRef(!!discoverCache && !initialGenre && !initialDirector && !initialActor && !initialYear && !initialKeyword);
```

#### Step 11: Send keyword param to API

Find where filter params are built. After the language param:
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

#### Step 12: Include keyword in active filter count

Find the `activeFilterCount` useMemo. After:
```typescript
    if (filters.streamingServices.length > 0) count++;
```

Add:
```typescript
    if (filters.streamingServices.length > 0) count++;
    if (filters.keyword) count++;
```

#### Step 13: Apply initialKeyword in cross-tab filter effect

Find:
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
      if (initialKeyword) {
        newFilters.keyword = initialKeyword;
        newFilters.keywordName = initialKeywordName || null;
      }
```

#### Step 14: Update the useEffect dependency array

Find:
```typescript
  }, [initialGenre, initialDirector, initialActor, initialYear]);
```

Replace with:
```typescript
  }, [initialGenre, initialDirector, initialActor, initialYear, initialKeyword, initialKeywordName]);
```

#### Step 15: Add `onKeywordClick` to all MovieDetailModal usages

Find every place MovieDetailModal is rendered in MoviesTab. For the inline card modals, find:
```typescript
                    onGenreClick={(genreId) => updateFilter("genre", genreId.toString())}
```

Add after each `onGenreClick`:
```typescript
                    onKeywordClick={(keywordId, keywordName) => {
                      setFilters(prev => ({ ...prev, keyword: keywordId.toString(), keywordName }));
                      setPage(1);
                      setIsSearchMode(false);
                      setSearchQuery("");
                    }}
```

For the standalone MovieDetailModal at the bottom of the component, find:
```typescript
        onGenreClick={(genreId) => {
          updateFilter("genre", genreId.toString());
```

Add after the `onGenreClick` block:
```typescript
        onKeywordClick={(keywordId, keywordName) => {
          setFilters(prev => ({ ...prev, keyword: keywordId.toString(), keywordName }));
          setPage(1);
          setIsSearchMode(false);
          setSearchQuery("");
          closeMovie();
        }}
```

Note: We set both `keyword` and `keywordName` together instead of using `updateFilter` since we need to set two fields at once.

---

### File: `src/app/components/AppLayout.tsx`

#### Step 16: Add `'keyword'` to navigateToDiscoverWithFilter type

Find:
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
    value: string | number,
    extra?: string
  ) => void;
```

The `extra` parameter carries the keyword name alongside the keyword ID value.

#### Step 17: Pass extra data through navigation state

Find the implementation:
```typescript
  const navigateToDiscoverWithFilter: AppLayoutContext['navigateToDiscoverWithFilter'] = (
    filterType,
    value
  ) => {
    navigate('/discover', { state: { filterType, filterValue: value } });
  };
```

Replace with:
```typescript
  const navigateToDiscoverWithFilter: AppLayoutContext['navigateToDiscoverWithFilter'] = (
    filterType,
    value,
    extra
  ) => {
    navigate('/discover', { state: { filterType, filterValue: value, filterExtra: extra } });
  };
```

#### Step 18: Wire `initialKeyword` props to MoviesTab

Find where MoviesTab receives its `initial*` props from route state. Look for where `initialGenre`, `initialDirector`, etc. are passed. Add alongside them:

```typescript
initialKeyword={state?.filterType === 'keyword' ? String(state.filterValue) : null}
initialKeywordName={state?.filterType === 'keyword' ? (state.filterExtra || null) : null}
```

---

### File: `src/app/components/SavedMoviesTab.tsx`

#### Step 19: Update navigateToDiscoverWithFilter type and add onKeywordClick

Update the prop type:
```typescript
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
```

Replace with:
```typescript
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year' | 'keyword', value: string | number, extra?: string) => void;
```

Find every `onGenreClick` in this file and add `onKeywordClick` after each:
```typescript
onKeywordClick={(keywordId, keywordName) => navigateToDiscoverWithFilter('keyword', keywordId, keywordName)}
```

---

### File: `src/app/components/MatchesTab.tsx`

#### Step 20: Same as SavedMoviesTab

Update the prop type to include `'keyword'` and `extra?: string`.

Find every `onGenreClick` and add `onKeywordClick` after each:
```typescript
onKeywordClick={(keywordId, keywordName) => navigateToDiscoverWithFilter('keyword', keywordId, keywordName)}
```

---

### File: `src/app/components/AdvancedFiltersModal.tsx`

#### Step 21: Add keyword display in the Advanced Filters modal

Find the `{/* Director Search */}` section. Add this new section **before** it:

```tsx
          {/* Active Keyword Filter */}
          {filters.keyword && (
            <div>
              <Label className="text-slate-300 mb-2 block">Keyword</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white flex items-center gap-2">
                  <span className="text-slate-400 text-xs">🏷</span>
                  {filters.keywordName || `Keyword #${filters.keyword}`}
                </div>
                <Button
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => {
                    setFilters({ ...filters, keyword: null, keywordName: null });
                  }}
                >
                  Clear
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Set by clicking a keyword tag in a movie detail
              </p>
            </div>
          )}
```

This section only appears when a keyword filter is active. It shows the keyword name with a Clear button. The hint text explains how to set keywords (since there's no search input — keywords are discovered by browsing movies).

---

## Testing Checklist

- [ ] Click a keyword on the **Discover tab** → modal closes, movies refresh showing filtered results
- [ ] Click a keyword on the **Saved tab** → navigates to Discover with keyword filter applied
- [ ] Click a keyword on the **Matches tab** → navigates to Discover with keyword filter applied
- [ ] Active filter count badge increments when keyword is active
- [ ] Open **Advanced Filters** while keyword is active → keyword section visible with name and Clear button
- [ ] Click **Clear** on keyword in Advanced Filters → keyword filter removed, movies refresh
- [ ] Click **Clear All** in Advanced Filters → keyword filter also cleared
- [ ] Keyword badges in modal show hover state (lighter slate) indicating they're clickable
- [ ] Keyword filter combines correctly with other filters (e.g. genre + keyword)
- [ ] Advanced Filters modal does NOT show keyword section when no keyword is active (clean UI)

## Summary Table

| What | Before | After |
|------|--------|-------|
| Keyword badges | Static, non-interactive | Clickable with hover states |
| Keyword filtering | Not available | Click keyword → filter Discover by TMDB keyword ID |
| Cross-tab keyword filter | Not available | Saved/Matches → Discover with keyword pre-applied |
| Filter count | Doesn't include keywords | Includes keywords in active filter count |
| Advanced Filters modal | No keyword field | Shows active keyword with name + Clear button |
| Server `with_keywords` | Not passed to TMDB | Passed when keyword filter is active |