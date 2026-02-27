# Fix: Sync Compact Card Rating Badges — Saved & Matches Tabs

## Problem

Compact card rating badges look different across tabs:
- **Discover**: horizontal row (`flex items-center gap-1`), full IMDb loading state (spinner → rating → `NOT_FOUND` → no-id fallback), `bottom-2 right-2`
- **Saved** (My List + Partner's List): vertical column (`flex flex-col items-end`), IMDb hidden until loaded, no spinner, no link
- **Matches**: same broken state as Saved

## Root Cause

The compact card is copy-pasted inline JSX in each tab rather than a shared component. The rating block in Saved and Matches was never updated when Discover's was fixed. Three instances need to be brought in line with Discover.

## What to change

Saved has **two** compact card blocks (My List at ~line 657, Partner's List at ~line 848). Matches has **one** (~line 699).

In all three, find and replace the rating block. The broken block looks like this in all three:

```tsx
{movie.vote_average > 0 && (
  <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
    <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
      <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
      <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
    </div>
    {imdbRating && imdbRating !== 'N/A' && (
      <div className="bg-[#F5C518] backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
        <span className="text-[8px] font-bold text-black/70 uppercase tracking-wide">IMDb</span>
        <span className="text-[10px] font-bold text-black">{imdbRating}</span>
      </div>
    )}
  </div>
)}
```

---

## Changes

### Files: `src/app/components/SavedMoviesTab.tsx` and `src/app/components/MatchesTab.tsx`

#### Step 1 — Add `Loader2` to the lucide import in both files

**SavedMoviesTab.tsx** — find:
```tsx
import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, List } from 'lucide-react';
```
Add `Loader2`:
```tsx
import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, List, Loader2 } from 'lucide-react';
```

**MatchesTab.tsx** — find the lucide import block and add `Loader2` if not already present:
```diff
 import {
   Users,
   Heart,
   UserX,
   Check,
   X,
   Bell,
   Tv,
   ArrowUpDown,
   Filter,
+  Loader2,
 } from 'lucide-react';
```

#### Step 2 — Add the `hasImdbId` and `displayImdbRating` derivations inside each `.map()` callback

In all three compact `.map()` callbacks, there is already:
```typescript
const imdbRating = imdbRatings.get(movie.id);
```

Add these two lines immediately after it in all three places:
```typescript
const hasImdbId = (movie as any).external_ids?.imdb_id;
const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
const displayImdbRating = imdbRatings.get(movie.id) || (movie as any).imdbRating || (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);
```

#### Step 3 — Replace the broken rating block in all three locations

Find the broken block (shown above) in each location and replace it with:

```tsx
{movie.vote_average > 0 && (
  <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
    {/* TMDB badge */}
    <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
      <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
      <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
    </div>

    {/* IMDb badge — full loading state, matches Discover compact */}
    {hasImdbId ? (
      <a
        href={`https://www.imdb.com/title/${hasImdbId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
          displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
            ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
            : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
        }`}
      >
        <span className={`text-[7px] font-bold uppercase tracking-wide ${
          displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
        }`}>IMDb</span>
        {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
          <span className="text-[10px] font-bold text-black">{displayImdbRating}</span>
        ) : displayImdbRating === 'NOT_FOUND' ? (
          <span className="text-[10px] font-bold text-black/40">—</span>
        ) : (
          <Loader2 className="size-2.5 text-black/50 animate-spin" />
        )}
      </a>
    ) : (
      <div className="bg-[#F5C518]/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
        <span className="text-[7px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
        <span className="text-[10px] font-bold text-black/40">—</span>
      </div>
    )}
  </div>
)}
```

Apply this replacement to all three locations:
1. `SavedMoviesTab.tsx` — My List compact block (~line 657)
2. `SavedMoviesTab.tsx` — Partner's List compact block (~line 848)
3. `MatchesTab.tsx` — Matches compact block (~line 699)

**Do not change anything else.** Do not touch `MovieCard.tsx`. Do not touch any `viewMode === 'grid'` rendering blocks.

---

## Testing Checklist

- [ ] Saved tab → compact view → My List: TMDB and IMDb badges are side-by-side, not stacked
- [ ] Saved tab → compact view → My List: IMDb badge shows spinner while loading, then rating, then `—` for NOT_FOUND
- [ ] Saved tab → compact view → Partner's List: same behaviour as My List
- [ ] Matches tab → compact view: same badge layout and loading behaviour
- [ ] All three tabs in compact view now look identical to Discover compact view for ratings
- [ ] Discover compact view unchanged
- [ ] Full card (`viewMode === 'grid'`) in all tabs unchanged
- [ ] IMDb badge in compact is a clickable link to IMDb — clicking does not open the movie modal

## Summary Table

| Location | Before | After |
|----------|--------|-------|
| Saved My List compact | Vertical stack, no spinner, hidden until loaded | Horizontal row, spinner → rating → `—` |
| Saved Partner's List compact | Vertical stack, no spinner, hidden until loaded | Horizontal row, spinner → rating → `—` |
| Matches compact | Vertical stack, no spinner, hidden until loaded | Horizontal row, spinner → rating → `—` |
| Discover compact | ✅ Already correct | Unchanged |
| Any full card grid | ✅ Untouched | Unchanged |