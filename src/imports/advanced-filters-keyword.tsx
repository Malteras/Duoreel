# Keyword Search in Advanced Filters + Top Bar Chip

## Problem
The keyword filter currently only shows as a read-only display when active. Two improvements needed:

1. **Advanced Filters modal**: Make the Keyword field a searchable lookup (like Director/Actor), using TMDB's `/search/keyword` API. Users should be able to type "heist" and see matching keywords to select from.
2. **Top filter bar**: Show an active keyword chip (like Director/Actor chips) so users can see and clear the keyword filter without opening Advanced Filters.

## Changes

### File: `supabase/functions/server/index.tsx`

#### Step 1: Add keyword search endpoint

Add this new route right after the existing `/search/people` endpoint (~line 2004, after its closing `});`):

```typescript
app.get("/make-server-5623fde1/search/keywords", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const query = c.req.query('query');
    if (!query) {
      return c.json({ error: 'Query parameter is required' }, 400);
    }

    const url = `https://api.themoviedb.org/3/search/keyword?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error searching keywords:', error);
    return c.json({ error: `Failed to search keywords: ${error}` }, 500);
  }
});
```

---

### File: `src/app/components/AdvancedFiltersModal.tsx`

#### Step 2: Add keyword search state

Find the existing state declarations:
```typescript
  const [searchingActor, setSearchingActor] = useState(false);
  const [localShowWatched, setLocalShowWatched] = useState(showWatchedMovies);
```

Add after `searchingActor`:
```typescript
  const [searchingActor, setSearchingActor] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [keywordResults, setKeywordResults] = useState<any[]>([]);
  const [searchingKeyword, setSearchingKeyword] = useState(false);
  const [localShowWatched, setLocalShowWatched] = useState(showWatchedMovies);
```

#### Step 3: Reset keyword search state when modal opens

Find in the `useEffect` that resets on `isOpen`:
```typescript
      setActorSearch('');
      setDirectorResults([]);
      setActorResults([]);
```

Replace with:
```typescript
      setActorSearch('');
      setKeywordSearch('');
      setDirectorResults([]);
      setActorResults([]);
      setKeywordResults([]);
```

#### Step 4: Add keyword search function

Find the `searchActors` function. Add this new function right after it (after its closing `};`):

```typescript
  const searchKeywords = async (query: string) => {
    if (!query.trim()) {
      setKeywordResults([]);
      return;
    }

    setSearchingKeyword(true);
    try {
      const response = await fetch(`${baseUrl}/search/keywords?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setKeywordResults(data.results || []);
    } catch (error) {
      console.error('Error searching keywords:', error);
    } finally {
      setSearchingKeyword(false);
    }
  };
```

#### Step 5: Replace the read-only keyword display with a searchable field

Find the current keyword section (if it exists from the previous prompt — it may look like `{/* Active Keyword Filter */}` with a read-only display). If it doesn't exist yet, add this new section right before `{/* Director Search */}`:

```tsx
          {/* Keyword Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Keyword</Label>
            {filters.keyword ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white">
                  {filters.keywordName || `Keyword #${filters.keyword}`}
                </div>
                <Button
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => {
                    setFilters({ ...filters, keyword: null, keywordName: null });
                    setKeywordSearch('');
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    value={keywordSearch}
                    onChange={(e) => {
                      setKeywordSearch(e.target.value);
                      searchKeywords(e.target.value);
                    }}
                    placeholder="Search for a keyword..."
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  {searchingKeyword && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />
                  )}
                </div>
                {keywordResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-md max-h-[200px] overflow-y-auto">
                    {keywordResults.slice(0, 10).map((kw) => (
                      <div
                        key={kw.id}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={() => {
                          setFilters({ ...filters, keyword: kw.id.toString(), keywordName: kw.name });
                          setKeywordSearch('');
                          setKeywordResults([]);
                        }}
                      >
                        <div className="text-white font-medium">{kw.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
```

If the read-only `{/* Active Keyword Filter */}` section already exists from the previous prompt, **replace it entirely** with the block above.

---

### File: `src/app/components/MoviesTab.tsx`

#### Step 6: Add keyword chip in the top filter bar

Find the streaming services chip (the last chip before `{activeFilterCount > 0 &&`):
```tsx
            {filters.streamingServices.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-indigo-600/70 text-white border-indigo-500 cursor-pointer hover:bg-indigo-700"
                onClick={() =>
                  setFilters({
                    ...filters,
                    streamingServices: [],
                  })
                }
              >
                {filters.streamingServices.length} streaming
                service
                {filters.streamingServices.length !== 1
                  ? "s"
                  : ""}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
```

Add right after it (before the `{activeFilterCount > 0 &&` block):
```tsx
            {filters.keyword && (
              <Badge
                variant="secondary"
                className="bg-slate-600/70 text-white border-slate-500 cursor-pointer hover:bg-slate-700"
                onClick={() =>
                  setFilters({ ...filters, keyword: null, keywordName: null })
                }
              >
                Keyword: {filters.keywordName || filters.keyword}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
```

Note: Uses slate color to match the keyword badge styling from the movie modal.

---

## Testing Checklist

- [ ] Open Advanced Filters → Keyword field shows search input with "Search for a keyword..." placeholder
- [ ] Type "heist" in keyword search → dropdown shows matching TMDB keywords (e.g., "heist", "art heist", "bank heist")
- [ ] Click a keyword result → field switches to selected state showing the name + Clear button
- [ ] Click Clear → returns to search input
- [ ] Click Search Movies with keyword selected → movies filter by that keyword
- [ ] Click a keyword tag in a movie modal → keyword chip appears in top filter bar (slate colored)
- [ ] Click X on keyword chip in top bar → keyword filter cleared, movies refresh
- [ ] Click Clear All → keyword filter also cleared along with all others
- [ ] Keyword search in Advanced Filters + keyword click from modal both work and update the same filter state
- [ ] Verify no errors in console when searching keywords

## Summary Table

| What | Before | After |
|------|--------|-------|
| Keyword in Advanced Filters | Read-only display (or not present) | Full search field like Director/Actor |
| Keyword in top filter bar | Not shown | Slate chip with name + X to clear |
| Keyword search API | Not available | `/search/keywords` proxying TMDB |
| Setting keywords | Only by clicking tags in modal | Click tags in modal OR search in Advanced Filters |