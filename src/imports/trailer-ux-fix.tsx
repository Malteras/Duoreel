# Fix: Trailer UX — Move Ratings Below Player + Enable Fullscreen

## Problem

Two issues with the current trailer implementation:

1. **Rating badges overlap YouTube player controls.** When the trailer is playing, the TMDB/IMDb badges sit at `absolute bottom-4 right-4` — directly on top of YouTube's progress bar and controls. They should transition below the video during playback.

2. **Fullscreen button is disabled.** The iframe's `allow` attribute is missing `fullscreen`, so YouTube's fullscreen button doesn't work.

## Changes

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 1: Enable fullscreen on the iframe

Find the iframe element (around line 221):

```tsx
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
```

Replace with:

```tsx
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                frameBorder="0"
              />
```

Only change: added `fullscreen` to the `allow` attribute.

#### Step 2: Move Rating Badges outside the video container when trailer is playing

Currently the Rating Badges div is INSIDE the `<div className="relative h-64 md:h-80 overflow-hidden">` container, which means they overlay the video. We need to:

- When NOT playing: badges stay in their current absolute position overlaying the backdrop/thumbnail (unchanged)
- When playing: badges render BELOW the video container as a static row

Find the `{/* Rating Badges - Bottom Right */}` block. It starts around line 285 and ends around line 349 (the closing `</div>` of the ratings container, right before the double closing `</div>` that ends the video area).

The entire ratings block currently looks like this (from `{/* Rating Badges - Bottom Right */}` to its closing `</div>`):

```tsx
            {/* Rating Badges - Bottom Right */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {/* ... TMDB badge ... */}
              {/* ... IMDb badge ... */}
            </div>
```

Replace with a conditional wrapper:

```tsx
            {/* Rating Badges - Bottom Right (overlay on thumbnail, hidden during playback) */}
            {!showTrailer && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {/* ... TMDB badge ... */}
                {/* ... IMDb badge ... */}
              </div>
            )}
```

The TMDB and IMDb badge contents inside stay **exactly the same** — only the wrapping div gets the `{!showTrailer && (...)}` conditional. Do NOT change any badge markup.

Then, right AFTER the closing `</div>` of the video container (the `<div className="relative h-64 md:h-80 overflow-hidden">`) and BEFORE the `<div className="p-6 space-y-6">` content area, add a new ratings row that shows only during playback:

```tsx
          {/* Rating Badges — shown below video during trailer playback */}
          {showTrailer && (
            <div className="flex items-center justify-end gap-2 px-4 py-2 bg-slate-900">
              {/* TMDB Rating Badge */}
              {movie.vote_average && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-blue-600/90 px-2 py-1 rounded-full shadow-lg">
                      <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                      <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700">
                    <p>TMDB community rating ({movie.vote_count?.toLocaleString()} votes)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* IMDb Rating Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  {movie.external_ids?.imdb_id ? (
                    <a
                      href={`https://www.imdb.com/title/${movie.external_ids.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                          ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                          : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                          ? 'text-black/70'
                          : 'text-black/40'
                      }`}>IMDb</span>
                      {(() => {
                        const cachedVal = globalImdbCache?.get(movie.external_ids.imdb_id);
                        const rating = (movie as any).imdbRating || (cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND' ? cachedVal : null);
                        if (rating) return <span className="text-xs font-bold text-black">{rating}</span>;
                        if (cachedVal === 'NOT_FOUND') return <span className="text-xs font-bold text-black/40">—</span>;
                        return <Loader2 className="size-3 text-black/50 animate-spin" />;
                      })()}
                    </a>
                  ) : (
                    <div className="bg-[#F5C518]/30 px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                      <Loader2 className="size-3 text-black/40 animate-spin" />
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700">
                  <p>{movie.external_ids?.imdb_id
                    ? (() => {
                        const cachedVal = globalImdbCache?.get(movie.external_ids!.imdb_id);
                        if ((movie as any).imdbRating || (cachedVal && cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND')) return 'View on IMDb';
                        if (cachedVal === 'NOT_FOUND') return 'Not rated on IMDb — click to view page';
                        return 'Rating loading — click to view on IMDb';
                      })()
                    : 'Fetching IMDb info...'
                  }</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
```

**Visual result:**

```
Thumbnail (not playing):
┌──────────────────────────────────┐
│                              [✕] │
│    poster/thumbnail              │
│              ▶                   │
│                    TMDB 7.7  IMDb│  ← overlay on image
└──────────────────────────────────┘
│ Title...                         │

Playing:
┌──────────────────────────────────┐
│                              [✕] │
│    YouTube Player                │
│    [▶ advancement bar  🔊  ⛶ ] │  ← controls unobstructed
└──────────────────────────────────┘
│                    TMDB 7.7  IMDb│  ← static row below video
│ Title...                         │
```

## Testing Checklist

- [ ] Thumbnail state: rating badges overlay bottom-right of image (unchanged from current)
- [ ] Click play: badges disappear from video overlay, appear as static row below the player
- [ ] YouTube fullscreen button works (click ⛶ in player → enters fullscreen)
- [ ] Exit fullscreen → player still embedded, ratings still below
- [ ] Close modal → reopen → thumbnail state, badges back on overlay
- [ ] Movie with no trailer → backdrop with badges in original position (no "below" row)
- [ ] Test on all 3 tabs (Discover, Saved, Matches)