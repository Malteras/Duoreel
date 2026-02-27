# Fix: Three Small UI Fixes — Compact Rating Size, Saved Toolbar Responsiveness, Discover Sort Icon

## Scope

Three targeted changes across two files. **Do not touch `MovieCard.tsx` or the `viewMode === 'grid'` rendering branch.**

---

## Change 1 — Compact card: make rating badges smaller

### File: `src/app/components/MoviesTab.tsx`

The compact card rating badges use the same sizing as the full card (`px-2 py-1`, `text-[9px]`, `text-xs`). They need to be smaller to fit the narrower card.

Find the rating block inside the compact grid `.map()` callback (inside `{viewMode === 'compact' && ...}`). It currently reads:

```tsx
<div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
  {/* TMDB badge */}
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
        <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
        <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
      </div>
    </TooltipTrigger>
    ...
  </Tooltip>

  {/* IMDb badge */}
  <Tooltip>
    <TooltipTrigger asChild>
      {hasImdbId ? (
        <a ... className={`backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors ...`}>
          <span className={`text-[9px] font-bold uppercase tracking-wide ...`}>IMDb</span>
          {... ? <span className="text-xs font-bold text-black">{displayImdbRating}</span> : ...}
        </a>
      ) : (
        <div className="bg-[#F5C518]/30 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
          <span className="text-xs font-bold text-black/40">—</span>
        </div>
      )}
    </TooltipTrigger>
    ...
  </Tooltip>
</div>
```

Make the following size changes **only within the compact grid rating block** (leave the full card grid completely untouched):

- Outer container: `gap-2` → `gap-1`, `bottom-4 right-4` → `bottom-2 right-2`
- TMDB pill: `px-2 py-1` → `px-1.5 py-0.5`, label `text-[9px]` → `text-[7px]`, value `text-xs` → `text-[10px]`
- IMDb pill (all three variants — the `<a>`, the fallback `<div>`, and the spinner): same changes — `px-2 py-1` → `px-1.5 py-0.5`, label `text-[9px]` → `text-[7px]`, value `text-xs` → `text-[10px]`, spinner `size-3` → `size-2.5`

The full replacement for the rating container (keep Tooltip wrappers and all logic intact, only change the size classes listed above):

```tsx
<div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
  {/* TMDB badge */}
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
        <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
        <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
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
```

---

## Change 2 — Saved tab: fix toolbar responsiveness

### File: `src/app/components/SavedMoviesTab.tsx`

The filter bar row wraps badly on mobile because the two selects are constrained to `max-w-[calc(50%-6px)]` and the view toggle uses `ml-auto`, pushing everything off-screen on narrow widths.

Find the Sort/Filter bar div (around line 450):

```tsx
<div className="flex items-center gap-3 md:justify-between">
  <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
    ...Show select...
  </div>

  <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
    ...Sort select...
  </div>

  {/* View mode toggle */}
  <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 ml-auto flex-shrink-0">
    ...
  </div>
</div>
```

Replace the outer div and its children with:

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* Show filter */}
  <div className="flex items-center gap-2 min-w-0">
    <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Show:</label>
    <Select
      value={viewMode === 'mine' ? filterBy : partnerFilterBy}
      onValueChange={(value: 'all' | 'unwatched' | 'watched') =>
        viewMode === 'mine' ? setFilterBy(value) : setPartnerFilterBy(value)
      }
    >
      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[140px]">
        <div className="flex items-center gap-2">
          {(viewMode === 'mine' ? filterBy : partnerFilterBy) === 'unwatched' ? (
            <EyeOff className="size-4 flex-shrink-0 text-slate-400" />
          ) : (viewMode === 'mine' ? filterBy : partnerFilterBy) === 'watched' ? (
            <Eye className="size-4 flex-shrink-0 text-slate-400" />
          ) : (
            <Filter className="size-4 flex-shrink-0 text-slate-400" />
          )}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Movies</SelectItem>
        <SelectItem value="unwatched">Unwatched</SelectItem>
        <SelectItem value="watched">Watched</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Sort */}
  <div className="flex items-center gap-2 min-w-0">
    <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[160px]">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 flex-shrink-0 text-slate-400" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Recently Added</SelectItem>
        <SelectItem value="oldest">First Added</SelectItem>
        <SelectItem value="title">Title (A-Z)</SelectItem>
        <SelectItem value="rating">Highest Rated</SelectItem>
        <SelectItem value="release-newest">Release Date (Newest First)</SelectItem>
        <SelectItem value="release-oldest">Release Date (Oldest First)</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* View mode toggle — pushed to the right on wider screens, wraps naturally on mobile */}
  <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 md:ml-auto flex-shrink-0">
    <button
      onClick={() => handleCardViewMode('compact')}
      className={`p-1.5 rounded transition-colors ${cardViewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
      aria-label="Compact grid view"
      title="Compact grid"
    >
      <LayoutGrid className="size-3.5" />
    </button>
    <button
      onClick={() => handleCardViewMode('list')}
      className={`p-1.5 rounded transition-colors ${cardViewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
      aria-label="List view"
      title="List view"
    >
      <List className="size-3.5" />
    </button>
  </div>
</div>
```

Key changes:
- `flex items-center gap-3 md:justify-between` → `flex flex-wrap items-center gap-2` — allows wrapping on narrow screens
- Removed `max-w-[calc(50%-6px)]` constraints that were causing overflow — replaced with fixed `w-[140px]` / `w-[160px]` widths that fit on all screens
- `ml-auto` on toggle → `md:ml-auto` — only right-aligns on medium+ screens, wraps naturally on mobile
- `ArrowUpDown` icon now always visible inside Sort trigger (removed `md:hidden` class)

---

## Change 3 — Discover tab: add sort icon inside the sort dropdown trigger

### File: `src/app/components/MoviesTab.tsx`

The sort select in Row 2 currently has no icon. Add `ArrowUpDown` inside the trigger to match the Saved tab pattern.

First, add `ArrowUpDown` to the lucide import:

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
   LayoutList,
+  ArrowUpDown,
 } from "lucide-react";
```

Then find the sort Select in Row 2 (around line 1143):

```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-fit min-w-[160px] h-9">
    <SelectValue />
  </SelectTrigger>
```

Replace `<SelectTrigger>` contents with:

```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-fit min-w-[160px] h-9">
    <div className="flex items-center gap-2">
      <ArrowUpDown className="size-3.5 text-slate-400 flex-shrink-0" />
      <SelectValue />
    </div>
  </SelectTrigger>
```

---

## Testing Checklist

- [ ] Compact view: rating badges visibly smaller than on the full card — both TMDB and IMDb pills use smaller padding and text
- [ ] Compact view: IMDb spinner, rating, NOT_FOUND dash all still display correctly at the smaller size
- [ ] Compact view: full card (`viewMode === 'grid'`) rating badges completely unchanged
- [ ] Saved tab on mobile (narrow screen): Show filter + Sort dropdown + view toggle all fit on one or two lines without overflow or clipping
- [ ] Saved tab on desktop: layout unchanged — two selects on left, toggle right-aligned
- [ ] Saved tab: Sort dropdown shows `ArrowUpDown` icon on **all** screen sizes (not just mobile)
- [ ] Discover tab: Sort dropdown in Row 2 shows `ArrowUpDown` icon to the left of the selected value
- [ ] No TypeScript errors from the new `ArrowUpDown` import in MoviesTab

## Summary Table

| What | Before | After |
|------|--------|-------|
| Compact card rating size | Same as full card (`px-2 py-1`, `text-xs`) | Smaller (`px-1.5 py-0.5`, `text-[10px]`) |
| Saved tab filter bar on mobile | Overflows / clips at narrow widths | Wraps cleanly with `flex-wrap` |
| Saved tab Sort icon visibility | `md:hidden` (mobile only) | Always visible |
| Discover Sort dropdown | Plain `<SelectValue />` — no icon | `ArrowUpDown` icon + value, matching Saved tab pattern |