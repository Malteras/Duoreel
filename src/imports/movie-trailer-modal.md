# Feature: Movie Trailers in Preview Modal

## Overview

Add YouTube trailer playback to the MovieDetailModal, replacing the static backdrop image at the top. When a trailer is available, show a YouTube thumbnail with a play button overlay. Clicking it loads the embedded YouTube player. When no trailer exists, fall back to the current backdrop image — no degradation.

**All existing overlay elements (rating badges, close button, gradient) stay in their exact current positions.** They sit on top of the trailer/poster just like they sit on top of the backdrop image today.

## Approach

Three layers of changes:

1. **Server**: Add `videos` to the existing `append_to_response` parameter (zero extra API calls — TMDB bundles it free)
2. **Enrichment**: Pass `videos` data through to the Movie object
3. **Modal**: Replace the `<img>` with a trailer thumbnail + play button, swapping to an iframe on click

## Changes

### File: `src/types/movie.ts`

#### Step 1: Add video types to Movie interface

After the existing `credits` field, add:

```typescript
  // Video/trailer data (from TMDB videos endpoint)
  videos?: {
    results?: {
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
```

The full addition goes inside the `Movie` interface, after the `credits` block:

```diff
   credits?: {
     crew?: CrewMember[];
     cast?: CastMember[];
   };
+
+  // Video/trailer data (from TMDB videos endpoint)
+  videos?: {
+    results?: {
+      key: string;
+      name: string;
+      site: string;
+      type: string;
+      official: boolean;
+    }[];
+  };
 }
```

---

### File: `supabase/functions/server/index.tsx`

#### Step 2: Add `videos` to both `append_to_response` calls

**Line ~892** (batch import enrichment):

Find:
```
`https://api.themoviedb.org/3/movie/${item.tmdbMovieId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids,keywords`
```

Replace with:
```
`https://api.themoviedb.org/3/movie/${item.tmdbMovieId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids,keywords,videos`
```

**Line ~2921** (individual movie detail endpoint):

Find:
```
const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,external_ids,watch/providers,keywords`;
```

Replace with:
```
const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,external_ids,watch/providers,keywords,videos`;
```

This is free — `append_to_response` bundles multiple sub-requests into one API call. No extra quota usage.

---

### File: `src/app/hooks/useEnrichMovies.ts`

#### Step 3: Pass through `videos` data during enrichment

In the `setMovies` updater function, inside the object spread where fields are mapped (around line 90-105), add `videos`:

Find this block:
```typescript
            return {
              ...movie,
              runtime: d.runtime || movie.runtime,
              director,
              actors,
              genres: d.genres || movie.genres,
              external_ids: d.external_ids || movie.external_ids,
              homepage: d.homepage || movie.homepage,
              'watch/providers': d['watch/providers'] || movie['watch/providers'],
              keywords: d.keywords?.keywords || movie.keywords,
              tagline: d.tagline ?? movie.tagline,
              budget: d.budget ?? movie.budget,
              revenue: d.revenue ?? movie.revenue,
              original_language: d.original_language || movie.original_language,
              status: d.status ?? movie.status,
              vote_count: d.vote_count || movie.vote_count,
            };
```

Replace with:
```typescript
            return {
              ...movie,
              runtime: d.runtime || movie.runtime,
              director,
              actors,
              genres: d.genres || movie.genres,
              external_ids: d.external_ids || movie.external_ids,
              homepage: d.homepage || movie.homepage,
              'watch/providers': d['watch/providers'] || movie['watch/providers'],
              keywords: d.keywords?.keywords || movie.keywords,
              tagline: d.tagline ?? movie.tagline,
              budget: d.budget ?? movie.budget,
              revenue: d.revenue ?? movie.revenue,
              original_language: d.original_language || movie.original_language,
              status: d.status ?? movie.status,
              vote_count: d.vote_count || movie.vote_count,
              videos: d.videos || movie.videos,
            };
```

Only one line added: `videos: d.videos || movie.videos,`

---

### File: `src/app/components/MovieDetailModal.tsx`

#### Step 4: Add `Play` icon import

```diff
-import { Bookmark, Ban, X, Star, Calendar, Clock, Users, Eye, Loader2, ExternalLink, Film } from 'lucide-react';
+import { Bookmark, Ban, X, Star, Calendar, Clock, Users, Eye, Loader2, ExternalLink, Film, Play } from 'lucide-react';
```

#### Step 5: Add trailer state and extraction logic

Inside the component function, after the existing `imdbRating` state/logic and before the `return` statement, add:

```typescript
  // --- Trailer logic ---
  const [showTrailer, setShowTrailer] = useState(false);

  // Find the best YouTube trailer: prefer official trailers, then any trailer, then any YouTube video
  const trailerKey = (() => {
    const videos = movie.videos?.results;
    if (!videos || videos.length === 0) return null;

    const youtubeVideos = videos.filter((v) => v.site === 'YouTube');
    // Priority 1: Official trailer
    const officialTrailer = youtubeVideos.find(
      (v) => v.type === 'Trailer' && v.official
    );
    if (officialTrailer) return officialTrailer.key;
    // Priority 2: Any trailer
    const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
    if (anyTrailer) return anyTrailer.key;
    // Priority 3: Official teaser
    const officialTeaser = youtubeVideos.find(
      (v) => v.type === 'Teaser' && v.official
    );
    if (officialTeaser) return officialTeaser.key;
    // Priority 4: Any YouTube video (clip, featurette, etc.)
    return youtubeVideos[0]?.key || null;
  })();

  // Reset trailer playback when modal closes or movie changes
  useEffect(() => {
    if (!isOpen) setShowTrailer(false);
  }, [isOpen, movie.id]);
```

#### Step 6: Replace the Backdrop Image section

Find the entire `{/* Backdrop Image */}` block (from `<div className="relative h-64 md:h-80 overflow-hidden">` through its closing `</div>`, which is followed by `<div className="p-6 space-y-6">`). This is approximately lines 190–279.

Replace ONLY the inner content (the `<img>`, fallback `<div>`, and gradient `<div>`) — **keep the outer container and ALL absolute-positioned overlay elements exactly as they are**.

Find this section inside the `<div className="relative h-64 md:h-80 overflow-hidden">`:

```tsx
            {backdropUrl ? (
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
            ) : null}
            <div
              className="w-full h-full bg-slate-800 items-center justify-center"
              style={{ display: backdropUrl ? 'none' : 'flex' }}
            >
              <Film className="size-20 text-slate-600" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
```

Replace with:

```tsx
            {showTrailer && trailerKey ? (
              /* YouTube embed — active when user clicks play */
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              /* Thumbnail state — poster/backdrop with optional play button */
              <>
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
                ) : null}
                {!trailerKey && (
                  <div
                    className="w-full h-full bg-slate-800 items-center justify-center"
                    style={{ display: backdropUrl ? 'none' : 'flex' }}
                  >
                    <Film className="size-20 text-slate-600" />
                  </div>
                )}
              </>
            )}
            {/* Gradient overlay — hide during video playback for clean player */}
            {!showTrailer && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            )}
```

**CRITICAL: Everything after this replacement stays exactly as-is.** The `{/* Rating Badges - Bottom Right */}` div with TMDB/IMDb badges, the close button (rendered by DialogContent), and any other absolute-positioned elements remain untouched. They will overlay the trailer thumbnail the same way they overlay the backdrop image today.

The only change when the trailer is actively playing (`showTrailer === true`): the gradient overlay hides so the video player looks clean, and the rating badges will be on top of the video (they have `z-10` from their parent positioning and won't interfere with the iframe).

## No Changes Needed in Tab Files

Since `MovieDetailModal` is shared across all three tabs (MoviesTab, SavedMoviesTab, MatchesTab), and the trailer data comes through the existing `movie` prop via enrichment, **no changes are needed in any tab file**. The trailer feature is entirely self-contained in the modal.

The data flow:
1. Server returns `videos` in the movie detail response (new)
2. `useEnrichMovies` maps `videos` into the movie object (new)
3. All tabs already pass enriched movies to `MovieDetailModal` as the `movie` prop (existing)
4. Modal extracts the trailer key and renders it (new)

## Fallback Behavior

| Scenario | What Shows |
|----------|-----------|
| Movie has YouTube trailer | YouTube thumbnail + play button → click → embedded player |
| Movie has no trailer but has backdrop | Backdrop image (identical to current behavior) |
| Movie has no trailer and no backdrop | Dark placeholder with Film icon (identical to current) |
| Trailer thumbnail fails to load | Falls back from maxresdefault to hqdefault |
| User closes modal | Trailer playback resets (iframe removed) |

## Testing Checklist

- [ ] Open modal for a popular movie (e.g. Interstellar) → YouTube thumbnail shows with play button overlay
- [ ] Rating badges (TMDB, IMDb) still visible in bottom-right over the thumbnail
- [ ] Close button (✕) still visible in top-right over the thumbnail
- [ ] Click play → YouTube player loads with autoplay, fills the same area
- [ ] During playback, gradient hides for clean video view
- [ ] Click ✕ to close modal → reopen → trailer is reset (shows thumbnail, not playing)
- [ ] Open modal for an obscure/old movie with no trailer → falls back to backdrop image, no play button
- [ ] Open modal for a movie with no backdrop AND no trailer → Film icon placeholder (unchanged)
- [ ] Test from Saved tab → modal shows trailer
- [ ] Test from Matches tab → modal shows trailer
- [ ] Test from Discover tab → modal shows trailer
- [ ] Trailer thumbnail `maxresdefault` fails → falls back to `hqdefault` gracefully
- [ ] Play button hover: background transitions from black/60 to red-600

## Summary Table

| What | Before | After |
|------|--------|-------|
| Modal top area | Static backdrop image | YouTube trailer thumbnail + play button (or backdrop fallback) |
| API calls | 0 extra | 0 extra (videos bundled in existing append_to_response) |
| Files changed | 4 files | movie.ts (type), server/index.tsx (2 strings), useEnrichMovies.ts (1 line), MovieDetailModal.tsx (UI) |
| Tab wiring needed | N/A | None — modal is shared, data flows through existing movie prop |
| Overlay elements | Rating badges, close button, gradient | Unchanged positions — same z-index, same placement |