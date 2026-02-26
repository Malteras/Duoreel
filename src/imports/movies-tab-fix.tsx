# Fix: Compact View Toggle — Rework + Rating Badge Layout + IMDb Loading State

## Scope

Three targeted changes to `src/app/components/MoviesTab.tsx` only.  
**Do not touch `MovieCard.tsx` or the `viewMode === 'grid'` branch at all.**

---

## Change 1 — Toggle: replace List button with Large Card (default) button

### What the toggle currently looks like (lines ~1111–1135)

```tsx
{/* View mode toggle */}
<div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-md p-0.5 shrink-0">
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => handleViewMode('compact')}
        className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Compact grid view"
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Compact grid</p></TooltipContent>
  </Tooltip>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => handleViewMode('list')}
        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="List view"
      >
        <List className="size-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>List view</p></TooltipContent>
  </Tooltip>
</div>
```

### Replace it with

```tsx
{/* View mode toggle — Large (default) vs Compact grid */}
<div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-md p-0.5 shrink-0">
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => handleViewMode('grid')}
        className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Large card view"
      >
        <LayoutList className="size-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Large cards</p></TooltipContent>
  </Tooltip>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => handleViewMode('compact')}
        className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Compact grid view"
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Compact grid</p></TooltipContent>
  </Tooltip>
</div>
```

### Update the lucide import

```diff
 import {
   Search,
   SlidersHorizontal,
   Loader2,
   RefreshCw,
   ChevronDown,
   Ban,
   X,
   Film,
   LayoutGrid,
-  List,
+  LayoutList,
 } from "lucide-react";
```

> `List` is no longer used in the UI but keep it in the file as dead import commented out — see Change 3 below.

### Update the viewMode default

The default must now be `'grid'` (large cards). It already is — confirm line 131 reads:

```typescript
return (localStorage.getItem('duoreel-viewmode-discover') as 'grid' | 'compact' | 'list') || 'grid';
```

No change needed here. Any user who previously had `'list'` stored will fall through to `'grid'` on next load since list is no longer reachable from the UI (the stored value `'list'` is still valid TypeScript — the list rendering block stays in the file, commented, see Change 3).

---

## Change 2 — Compact grid: fix rating badges (side-by-side + IMDb loading state)

### What the compact card's rating section currently looks like (lines ~1377–1389)

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

Two problems:
1. `flex-col` stacks TMDB above IMDb — should be side-by-side (`flex-row`)
2. IMDb badge is hidden entirely until loaded — should show a spinner while loading and a dimmed `—` when not found, matching `MovieCard.tsx` exactly

### What to compute per compact card (add these inside the `.map()` callback, alongside the existing `imdbRating` const)

```typescript
const hasImdbId = (movie as any).external_ids?.imdb_id;
const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
const displayImdbRating = imdbRatings.get(movie.id) || (movie as any).imdbRating || (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);
```

### Replace the entire rating block with

```tsx
{movie.vote_average > 0 && (
  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
    {/* TMDB badge */}
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
          <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-slate-800 text-white border-slate-700">
        <p>TMDB community rating</p>
      </TooltipContent>
    </Tooltip>

    {/* IMDb badge — mirrors MovieCard.tsx logic exactly */}
    <Tooltip>
      <TooltipTrigger asChild>
        {hasImdbId ? (
          <a
            href={`https://www.imdb.com/title/${hasImdbId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
              displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
            }`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wide ${
              displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
            }`}>IMDb</span>
            {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
              <span className="text-xs font-bold text-black">{displayImdbRating}</span>
            ) : displayImdbRating === 'NOT_FOUND' ? (
              <span className="text-xs font-bold text-black/40">—</span>
            ) : (
              <Loader2 className="size-3 text-black/50 animate-spin" />
            )}
          </a>
        ) : (
          <div className="bg-[#F5C518]/30 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
            <span className="text-xs font-bold text-black/40">—</span>
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent className="bg-slate-800 text-white border-slate-700">
        <p>{hasImdbId
          ? (displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
            ? 'View on IMDb'
            : displayImdbRating === 'NOT_FOUND'
            ? 'Rating unavailable — click to view on IMDb'
            : 'Rating loading — click to view on IMDb')
          : 'No IMDb data available'
        }</p>
      </TooltipContent>
    </Tooltip>
  </div>
)}
```

> Note: the inset changed from `bottom-2 right-2` to `bottom-4 right-4` to match the full card exactly.

---

## Change 3 — Comment out the List view rendering block and the unused `List` import

Find the list view rendering block (starts around line 1413):

```tsx
{/* ── List view ── */}
{viewMode === 'list' && (
  <div className="space-y-2">
    ...
  </div>
)}
```

Wrap the entire block in a comment:

```tsx
{/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
    but currently not exposed in the UI toggle. Remove the comment wrapper here
    and add a third button to the toggle (using the List icon from lucide-react)
    if you want to re-enable it. ──
{viewMode === 'list' && (
  <div className="space-y-2">
    ...all list JSX...
  </div>
)}
── end of list view dead code ── */}
```

Also comment out the `List` import in the lucide import block:

```diff
 import {
   ...
   LayoutGrid,
-  List,
+  // List, // kept for list view — see commented-out dead code block below the compact grid
+  LayoutList,
 } from "lucide-react";
```

---

## Testing Checklist

- [ ] Toggle shows two buttons: large card icon (left, active by default) and compact grid icon (right)
- [ ] Clicking compact grid icon → cards switch to compact 2-col layout
- [ ] Clicking large card icon → cards switch back to full `MovieCard` grid — **visually identical to before this change**
- [ ] In compact view: TMDB and IMDb badges are side-by-side (not stacked), bottom-right of poster
- [ ] In compact view: while IMDb rating is loading, a spinner appears inside the yellow IMDb badge
- [ ] In compact view: when IMDb is `NOT_FOUND`, a dimmed `—` appears in the yellow badge
- [ ] In compact view: when IMDb rating loaded, full yellow badge shows the rating as a link to IMDb
- [ ] Clicking IMDb badge in compact view opens IMDb page without triggering the movie modal
- [ ] `localStorage` key `duoreel-viewmode-discover` persists the chosen mode across page refresh
- [ ] No TypeScript errors — `List` import is commented, `LayoutList` is added
- [ ] List view block is present but commented out with explanation comment

## Summary Table

| What | Before | After |
|------|--------|-------|
| Toggle buttons | Compact ⊞ / List ☰ | Large cards / Compact ⊞ |
| Default view | `'grid'` (large) | `'grid'` (large) — unchanged |
| List view | Rendered when `viewMode === 'list'` | Dead code, commented out with explanation |
| Rating layout in compact | Stacked column, IMDb hidden until loaded | Side-by-side row, IMDb shows spinner → rating → `—` |
| IMDb badge behaviour in compact | Appears only after rating resolves | Matches `MovieCard.tsx` exactly: spinner → rating → `NOT_FOUND` → no imdb_id |
| `MovieCard.tsx` | Untouched | Untouched |