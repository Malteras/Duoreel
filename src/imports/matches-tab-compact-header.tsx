# Fix: Matches Tab — Compact Header on Mobile

## Problem

On mobile the Matches tab wastes ~120px above the first card across four separate stacked blocks:
1. `h2` heading with `text-3xl` + subtitle (`mb-6`)
2. Filter & Sort bar (`mb-6`)
3. View mode toggle (separate div, `mb-4`)
4. Match count (`mb-4`)

## Solution

Collapse all four into **two rows** on mobile:

- **Row 1**: Compact inline heading (smaller on mobile) + view toggle right-aligned — single `flex justify-between items-center` row
- **Row 2**: Filter + Sort + match count all on one `flex-wrap` row (same pattern as Saved tab after its responsive fix)

On `md:` and above the layout stays generous.

---

## Changes

### File: `src/app/components/MatchesTab.tsx`

Find and replace the entire block from `{/* Matched Movies heading */}` through the closing of `{/* Match count */}` (approximately lines 546–634). Replace all four separate blocks with:

```tsx
{/* ── Heading + controls — single compact area ── */}
{partner && (
  <div className="mb-4">
    {/* Row 1: Title + view toggle */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Heart className="size-5 md:size-7 text-pink-500 fill-pink-500 flex-shrink-0" />
        <div>
          <h2 className="text-lg md:text-3xl font-bold text-white leading-tight">Your Matches</h2>
          <p className="text-slate-400 text-xs md:text-sm hidden md:block">Movies you both want to watch</p>
        </div>
      </div>

      {/* View toggle — only shown when there are matches */}
      {!loading && matchedMovies.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
          <button
            onClick={() => handleViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            aria-label="Large card view"
            title="Large cards"
          >
            <LayoutList className="size-3.5" />
          </button>
          <button
            onClick={() => handleViewMode('compact')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            aria-label="Compact grid view"
            title="Compact grid"
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>
      )}
    </div>

    {/* Row 2: Filters + sort + match count — only shown when there are matches */}
    {!loading && matchedMovies.length > 0 && (
      <div className="flex flex-wrap items-center gap-2">
        {/* Service filter */}
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[140px] h-8 text-sm">
            <div className="flex items-center gap-2">
              <Tv className="size-3.5 flex-shrink-0 text-slate-400" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {STREAMING_SERVICES.map(s => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex items-center gap-2">
                  <img src={s.logo} alt={s.label} className="size-4 rounded object-cover flex-shrink-0" />
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[155px] h-8 text-sm">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-3.5 flex-shrink-0 text-slate-400" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Recently Matched</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="year-new">Newest First</SelectItem>
            <SelectItem value="year-old">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        {/* Match count */}
        <span className="text-xs text-slate-500 ml-auto">
          {filteredAndSortedMovies.length === matchedMovies.length
            ? `${matchedMovies.length} match${matchedMovies.length !== 1 ? 'es' : ''}`
            : `${filteredAndSortedMovies.length} of ${matchedMovies.length} (filtered)`}
        </span>
      </div>
    )}
  </div>
)}
```

> Note: The old standalone `{/* Match count */}` block below this area should be **deleted** — the count is now inline in Row 2 above. Search for the old match count paragraph and remove it:
> ```tsx
> {/* Match count */}
> {!loading && partner && matchedMovies.length > 0 && (
>   <p className="text-sm text-slate-500 mb-4">
>     ...
>   </p>
> )}
> ```

---

## Testing Checklist

- [ ] Mobile: heading row and filter row are both compact — first card visible much higher on screen
- [ ] Mobile: title reads "Your Matches" at smaller size (`text-lg`), heart icon smaller (`size-5`)
- [ ] Mobile: subtitle "Movies you both want to watch" hidden on mobile, visible on `md:`
- [ ] Mobile: Service + Sort dropdowns side by side in a single row with match count on the right
- [ ] Mobile: view toggle sits in the heading row, right-aligned
- [ ] Desktop (`md:`): heading is `text-3xl`, heart is `size-7`, subtitle is visible — looks the same as before
- [ ] View toggle still works — Large / Compact switches correctly
- [ ] Filters still work — selecting a service filters the grid correctly
- [ ] Match count shows correct number, updates when filter applied
- [ ] No duplicate match count paragraph (old standalone block removed)
- [ ] Empty state (no matches) still renders correctly — heading shows but filter row hidden

## Summary Table

| Element | Before | After (mobile) |
|---------|--------|----------------|
| Heading | `text-3xl` always, `mb-6` block | `text-lg` on mobile, inline with toggle |
| Subtitle | Always visible below heading | Hidden on mobile (`hidden md:block`) |
| Filter bar | Separate block `mb-6` | Merged into same `mb-4` area, `h-8` compact dropdowns |
| View toggle | Separate block `mb-4` | Right side of heading row |
| Match count | Separate block `mb-4` | Inline at end of filter row |
| Total vertical space (mobile) | ~120px | ~72px |