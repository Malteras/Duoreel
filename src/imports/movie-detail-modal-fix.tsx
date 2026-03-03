# Fix: Trailer Fullscreen + Thumbnail Fallback to Backdrop

## Problem

1. **Fullscreen is disabled.** YouTube shows "Full screen is unavailable" when clicking the fullscreen button. The iframe's `allow` attribute is missing the `fullscreen` permission.

2. **Bad thumbnails on older movies.** Some movies (e.g. "Help!" 1965) have a trailer on YouTube but the auto-generated thumbnail is blank/washed-out. Currently the code tries `maxresdefault.jpg` → falls back to `hqdefault.jpg`, but both can be ugly. A better approach: use the movie's own TMDB backdrop image as the thumbnail (which is always a good cinematic shot), and overlay the play button on that.

## Changes

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 1: Fix fullscreen — add `fullscreen` to iframe allow attribute

Find (around line 225):

```
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
```

Replace with:

```
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
```

#### Step 2: Replace YouTube thumbnail approach with backdrop + play button

The current implementation uses YouTube's auto-generated thumbnail image, which is unreliable for older/obscure movies. Instead, use the movie's TMDB backdrop image (which we already have and is always high quality) with a play button overlay. This gives a consistent, cinematic look across all movies.

Find the entire thumbnail block (from `{trailerKey ? (` to the matching closing `</div>` before `) : backdropUrl ? (`). This is approximately:

```tsx
                {trailerKey ? (
                  /* YouTube thumbnail as backdrop replacement */
                  <div
                    className="w-full h-full cursor-pointer group/trailer"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${trailerKey}/maxresdefault.jpg`}
                      alt={`${cleanTitle(movie.title)} trailer`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // maxresdefault may not exist — fall back to hqdefault
                        const target = e.currentTarget;
                        if (target.src.includes('maxresdefault')) {
                          target.src = `https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`;
                        }
                      }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className="bg-black/60 group-hover/trailer:bg-red-600 transition-colors rounded-full p-4 shadow-2xl">
                        <Play className="size-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : backdropUrl ? (
```

Replace with:

```tsx
                {trailerKey && backdropUrl ? (
                  /* Backdrop image with play button — trailer available */
                  <div
                    className="w-full h-full cursor-pointer group/trailer"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={backdropUrl}
                      alt={cleanTitle(movie.title)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className="bg-black/60 group-hover/trailer:bg-red-600 transition-colors rounded-full p-4 shadow-2xl">
                        <Play className="size-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : trailerKey && !backdropUrl ? (
                  /* No backdrop but trailer exists — use YouTube thumbnail as last resort */
                  <div
                    className="w-full h-full cursor-pointer group/trailer"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`}
                      alt={`${cleanTitle(movie.title)} trailer`}
                      className="w-full h-full object-cover"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className="bg-black/60 group-hover/trailer:bg-red-600 transition-colors rounded-full p-4 shadow-2xl">
                        <Play className="size-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : backdropUrl ? (
```

**Logic:**
- Has trailer + has backdrop → use TMDB backdrop with play button (best quality, consistent)
- Has trailer + no backdrop → use YouTube `hqdefault.jpg` with play button (rare edge case)
- No trailer + has backdrop → show backdrop without play button (existing behavior, unchanged)
- No trailer + no backdrop → Film icon placeholder (existing behavior, unchanged)

## Testing Checklist

- [ ] Fullscreen button works — click ⛶ in YouTube player → video goes fullscreen
- [ ] Popular movie (e.g. Interstellar) with trailer: backdrop image shows with play button, click → trailer plays
- [ ] Old movie (e.g. "Help!" 1965) with trailer: TMDB backdrop shows (not washed-out YouTube thumbnail) with play button
- [ ] Movie without trailer: backdrop shows without play button (unchanged)
- [ ] Movie without backdrop or trailer: Film icon placeholder (unchanged)
- [ ] Play button hover: transitions from black/60 to red-600
- [ ] Test on all 3 tabs (Discover, Saved, Matches)

## Summary Table

| What | Before | After |
|------|--------|-------|
| Fullscreen | Disabled ("unavailable") | Enabled via `allow="fullscreen"` |
| Thumbnail source | YouTube auto-generated (unreliable) | TMDB backdrop image (always high quality) |
| Thumbnail fallback chain | maxresdefault → hqdefault | TMDB backdrop → YouTube hqdefault (only if no backdrop) |
| Visual consistency | Varies by movie age/popularity | Always cinematic TMDB backdrop |