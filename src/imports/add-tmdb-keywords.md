# Add TMDB Keywords to Movie Detail Modal Across All Tabs

## Problem
Movies in DuoReel only show broad genres (e.g. "Horror", "Thriller") but lack the granular thematic tags that help users quickly assess a movie's vibe. TMDB provides rich community-curated keywords like "body horror", "dark mystery", "suspense", "dystopia", "heist", "coming of age" — much more descriptive than genres alone.

Keywords should appear in the MovieDetailModal on **all three tabs**: Discover, Saved, and Matches.

## Approach
TMDB's `append_to_response` parameter lets us bundle `keywords` into the existing movie detail API call at **zero extra cost** — no additional HTTP requests needed. The data flows through the same enrichment pipeline that already provides genres, director, actors, and watch providers.

The response format nests keywords as:
```json
{
  "keywords": {
    "keywords": [
      { "id": 818, "name": "based on novel or book" },
      { "id": 4565, "name": "dystopia" },
      { "id": 10183, "name": "body horror" }
    ]
  }
}
```
Note the double `.keywords` — outer is the `append_to_response` field name, inner is the actual array.

Three enrichment code paths exist that all need updating:
1. **MoviesTab.tsx** — inline enrichment (Discover tab)
2. **useEnrichMovies.ts** hook — used by SavedMoviesTab (Saved tab)
3. **MatchesTab.tsx** — inline enrichment (Matches tab)

## Changes

### File: `supabase/functions/server/index.tsx`

#### Step 1: Add `keywords` to the main movie detail endpoint

Find (~line 2895):
```typescript
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,external_ids,watch/providers`;
```

Replace with:
```typescript
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,external_ids,watch/providers,keywords`;
```

#### Step 2: Add `keywords` to the Letterboxd sync endpoint

Find (~line 892):
```typescript
              `https://api.themoviedb.org/3/movie/${item.tmdbMovieId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids`
```

Replace with:
```typescript
              `https://api.themoviedb.org/3/movie/${item.tmdbMovieId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids,keywords`
```

---

### File: `src/types/movie.ts`

#### Step 3: Add `keywords` to the Movie interface

Find:
```typescript
  homepage?: string;
  imdbRating?: string;
```

Replace with:
```typescript
  homepage?: string;
  keywords?: { id: number; name: string }[];
  imdbRating?: string;
```

---

### File: `src/app/components/MoviesTab.tsx`

#### Step 4: Extract keywords in Discover tab inline enrichment

Find the enrichment return block (~line 510–522):
```typescript
              status: detail.status,
              homepage: detail.homepage,
              vote_count: detail.vote_count || movie.vote_count,
            };
```

Replace with:
```typescript
              status: detail.status,
              homepage: detail.homepage,
              vote_count: detail.vote_count || movie.vote_count,
              keywords: detail.keywords?.keywords || movie.keywords,
            };
```

---

### File: `src/app/hooks/useEnrichMovies.ts`

#### Step 5: Extract keywords in the shared enrichment hook (used by Saved tab)

Find the `updates.set` block (~line 57–63):
```typescript
          updates.set(movie.id, {
            runtime:            d.runtime            || movie.runtime,
            director:           d.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name || movie.director,
            actors:             d.credits?.cast?.slice(0, 5).map((a: { name: string }) => a.name) || movie.actors,
            genres:             d.genres             || movie.genres,
            external_ids:       d.external_ids       || movie.external_ids,
            homepage:           d.homepage           || movie.homepage,
            'watch/providers':  d['watch/providers'] || movie['watch/providers'],
          });
```

Replace with:
```typescript
          updates.set(movie.id, {
            runtime:            d.runtime            || movie.runtime,
            director:           d.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name || movie.director,
            actors:             d.credits?.cast?.slice(0, 5).map((a: { name: string }) => a.name) || movie.actors,
            genres:             d.genres             || movie.genres,
            external_ids:       d.external_ids       || movie.external_ids,
            homepage:           d.homepage           || movie.homepage,
            'watch/providers':  d['watch/providers'] || movie['watch/providers'],
            keywords:           d.keywords?.keywords || movie.keywords,
          });
```

---

### File: `src/app/components/MatchesTab.tsx`

#### Step 6: Extract keywords in Matches tab inline enrichment

Find the enrichment return block (~line 255–263):
```typescript
          return {
            ...movie,
            runtime:           d.runtime           || movie.runtime,
            director:          d.credits?.crew?.find((c) => c.job === 'Director')?.name || movie.director,
            actors:            d.credits?.cast?.slice(0, 5).map((a) => a.name)           || movie.actors,
            genres:            d.genres             || movie.genres,
            'watch/providers': d['watch/providers'] || movie['watch/providers'],
            external_ids:      d.external_ids       || (movie as any).external_ids,
          };
```

Replace with:
```typescript
          return {
            ...movie,
            runtime:           d.runtime           || movie.runtime,
            director:          d.credits?.crew?.find((c) => c.job === 'Director')?.name || movie.director,
            actors:            d.credits?.cast?.slice(0, 5).map((a) => a.name)           || movie.actors,
            genres:            d.genres             || movie.genres,
            'watch/providers': d['watch/providers'] || movie['watch/providers'],
            external_ids:      d.external_ids       || (movie as any).external_ids,
            keywords:          d.keywords?.keywords || movie.keywords,
          };
```

---

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 7: Display keywords below genres with pill-shaped badges

Find the genres block and its closing (~line 307–325):
```tsx
              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genres.map((genre) => (
                    <Badge 
                      key={genre.id} 
                      variant="secondary" 
                      className="bg-purple-600/70 text-white border-purple-500 cursor-pointer hover:bg-purple-700 hover:border-purple-400 transition-colors" 
                      onClick={() => {
                        onGenreClick?.(genre.id);
                        onClose();
                      }}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
```

Replace with:
```tsx
              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {movie.genres.map((genre) => (
                    <Badge 
                      key={genre.id} 
                      variant="secondary" 
                      className="rounded-full bg-purple-600/70 text-white border-purple-500 cursor-pointer hover:bg-purple-700 hover:border-purple-400 transition-colors" 
                      onClick={() => {
                        onGenreClick?.(genre.id);
                        onClose();
                      }}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

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
            </div>
```

Key design details:
- **`rounded-full`** on both genres and keywords for the pill shape (the existing Badge component uses `rounded-md` by default — we override it).
- Genre badges get `mb-3` instead of `mb-4` to tighten the gap between genres and keywords.
- Keywords use `gap-1.5` (tighter than genres' `gap-2`) since they're smaller tags.
- Keywords are capped at 8 with `.slice(0, 8)` to keep the UI clean.
- Keywords use `text-xs font-normal` to be visually subordinate to genres.
- Color: `bg-slate-700/80 text-slate-300 border-slate-600` — muted slate, clearly different from the purple genres.

## Impact Assessment

- **Risk: Low** — purely additive. No existing data flows are changed; a new field is appended to existing responses.
- **Performance: Zero overhead** — `append_to_response` bundles keywords into the already-existing movie detail fetch. No extra API calls.
- **Backwards compatible** — if `keywords` is undefined (e.g. from cached data before this change), the UI simply doesn't render the section.
- **Files touched:** 6 files, all small surgical edits.

## Testing Checklist

- [ ] Open a movie detail modal on the **Discover tab** → keyword pill badges appear below genre pill badges in muted slate style
- [ ] Open a movie detail modal on the **Saved tab** → same keyword badges visible
- [ ] Open a movie detail modal on the **Matches tab** → same keyword badges visible
- [ ] Both genre and keyword badges have pill shape (`rounded-full`), not square corners
- [ ] Verify no extra network requests in DevTools Network tab — the `/movies/{id}` call should still be a single request
- [ ] Movie with no keywords (rare) → no empty keywords section shown, no spacing weirdness
- [ ] Movie with many keywords (20+) → only first 8 displayed, no overflow issues
- [ ] Keywords are visually distinct from genres: smaller text, slate color vs purple, no hover effects
- [ ] Scroll behavior in modal still works correctly with the extra content
- [ ] Mobile viewport — keyword badges wrap properly without breaking layout

## Summary Table

| What | Before | After |
|------|--------|-------|
| Movie detail info | Genres, director, cast, providers | + keyword tags (up to 8) |
| API calls per movie | 1 (detail + credits + external_ids + providers) | 1 (same call, `keywords` appended) |
| Keyword display | Not shown | Slate pill badges below genres |
| Badge shape | `rounded-md` (square corners) | `rounded-full` (pill shape) for genres and keywords |
| Tabs with keywords | None | All 3: Discover, Saved, Matches |
| Extra network requests | — | 0 (bundled via `append_to_response`) |