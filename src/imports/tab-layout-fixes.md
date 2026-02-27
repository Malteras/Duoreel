# Fix: Saved Tab Sort Alignment + Matches Tab Desktop Layout

## Two fixes, desktop layout only. Mobile untouched in both cases.

---

## Fix 1 — `src/app/components/SavedMoviesTab.tsx`

### Problem
On desktop, Sort by sits in the middle of the toolbar between Show and the view picker. It should be on the right side, grouped with the view picker.

### What to change

The Sort `<div>` currently has no `md:ml-auto`. Add it so Sort pushes to the right on desktop, sitting flush against the view picker. The view picker already has `md:ml-auto` — remove that from the toggle since Sort will now carry the push.

#### Change A — Sort div: add `md:ml-auto`

Find:
```tsx
{/* Sort */}
<div className="flex items-center gap-2 min-w-0">
  <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
```
Replace with:
```tsx
{/* Sort */}
<div className="flex items-center gap-2 min-w-0 md:ml-auto">
  <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
```

#### Change B — view toggle: remove `md:ml-auto`

Find:
```tsx
<div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 md:ml-auto flex-shrink-0">
```
Replace with:
```tsx
<div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
```

**Result on desktop**: `Show:` left — `Sort by: [dropdown] [toggle]` right.  
**Mobile**: unchanged — all items wrap naturally, no `md:ml-auto` fires.

---

## Fix 2 — `src/app/components/MatchesTab.tsx`

### Problem
On desktop:
- Row 1 has the title + view toggle side by side — view toggle should not be in this row on desktop
- Row 2 has Service left, Sort in the middle, match count right — Sort + view toggle should both be on the right

### What to change

Find the entire `{/* ── Heading + controls — single compact area ── */}` block and replace it:

```tsx
{/* ── Heading + controls ── */}
{partner && (
  <div className="mb-4">
    {/* Row 1: Title — centered on desktop, left-aligned with toggle on mobile */}
    <div className="flex items-center justify-between md:justify-center mb-3">
      <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-1">
        <div className="flex items-center gap-2">
          <Heart className="size-5 md:size-7 text-pink-500 fill-pink-500 flex-shrink-0" />
          <h2 className="text-lg md:text-3xl font-bold text-white leading-tight">Your Matches</h2>
        </div>
        <p className="text-slate-400 text-xs md:text-sm hidden md:block">Movies you both want to watch</p>
      </div>

      {/* View toggle — mobile only (on desktop it moves to Row 2) */}
      {!loading && matchedMovies.length > 0 && (
        <div className="flex md:hidden items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
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

    {/* Row 2: Filters + sort + view toggle + match count */}
    {!loading && matchedMovies.length > 0 && (
      <div className="flex flex-wrap items-center gap-2">
        {/* Service filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Service:</label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[140px] h-8 text-sm">
              <div className="flex items-center gap-2 truncate md:overflow-visible">
                <Tv className="size-3.5 md:hidden flex-shrink-0 text-slate-400" />
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
        </div>

        {/* Sort — pushed right on desktop */}
        <div className="flex items-center gap-2 md:ml-auto">
          <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[155px] h-8 text-sm">
              <div className="flex items-center gap-2 truncate md:overflow-visible">
                <ArrowUpDown className="size-3.5 md:hidden flex-shrink-0 text-slate-400" />
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
        </div>

        {/* View toggle — desktop only (mobile version is in Row 1) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
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

        {/* Match count */}
        <span className="text-xs text-slate-500 md:ml-2">
          {filteredAndSortedMovies.length === matchedMovies.length
            ? `${matchedMovies.length} match${matchedMovies.length !== 1 ? 'es' : ''}`
            : `${filteredAndSortedMovies.length} of ${matchedMovies.length} (filtered)`}
        </span>
      </div>
    )}
  </div>
)}
```

---

## Testing Checklist

**Saved tab desktop:**
- [ ] `Show:` filter on the left
- [ ] `Sort by:` label + dropdown on the right, immediately left of the view toggle
- [ ] View toggle on the far right

**Saved tab mobile:**
- [ ] All items unchanged — wrap naturally, no layout shift

**Matches tab desktop:**
- [ ] Row 1: heart + "Your Matches" + subtitle centered, nothing else in the row
- [ ] Row 2: `Service:` label + dropdown on the left; `Sort by:` label + dropdown pushed right with `ml-auto`; view toggle immediately right of Sort; match count after toggle
- [ ] View toggle functions correctly (Large / Compact switches)

**Matches tab mobile:**
- [ ] Row 1: title left-aligned, view toggle right-aligned in same row (unchanged from current mobile behaviour)
- [ ] Row 2: Service + Sort side by side, match count — unchanged