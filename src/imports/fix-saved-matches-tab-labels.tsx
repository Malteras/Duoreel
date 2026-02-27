# Fix: Saved Tab Sort Arrow on Desktop + Matches Tab Filter Labels

## Two targeted fixes only. Do not change anything else.

---

## Fix 1 — `src/app/components/SavedMoviesTab.tsx`

### Problem
On desktop, the Sort field shows both the `ArrowUpDown` icon (hardcoded inside the trigger) AND the `Sort by:` label outside — double indicator. Also the outer div is missing `md:justify-between` so the view toggle doesn't push right on desktop.

### Change A — outer container: add `md:justify-between`

Find:
```tsx
<div className="flex flex-wrap items-center gap-2">
```
Replace with:
```tsx
<div className="flex flex-wrap items-center gap-2 md:justify-between">
```

### Change B — Sort trigger: add `md:hidden` to `ArrowUpDown`

Find inside the Sort `<SelectTrigger>`:
```tsx
<div className="flex items-center gap-2">
  <ArrowUpDown className="size-4 flex-shrink-0 text-slate-400" />
  <SelectValue />
</div>
```
Replace with:
```tsx
<div className="flex items-center gap-2 truncate md:overflow-visible">
  <ArrowUpDown className="size-4 md:hidden flex-shrink-0 text-slate-400" />
  <SelectValue />
</div>
```

**Result**: mobile shows icon inside trigger (label hidden), desktop shows label outside + no icon inside.

---

## Fix 2 — `src/app/components/MatchesTab.tsx`

### Problem
The Service and Sort dropdowns in the filter row have no labels on desktop. The icons are always visible inside the triggers with no `md:hidden`, so on desktop you get an icon inside the trigger instead of a proper label outside it.

### Change — wrap each Select in a `flex items-center gap-2` div with a `hidden md:block` label, and add `md:hidden` to icons inside triggers

Find the Service Select block:
```tsx
{/* Service filter */}
<Select value={selectedService} onValueChange={setSelectedService}>
  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[140px] h-8 text-sm">
    <div className="flex items-center gap-2">
      <Tv className="size-3.5 flex-shrink-0 text-slate-400" />
      <SelectValue />
    </div>
  </SelectTrigger>
```
Replace with:
```tsx
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
```

Close the new wrapper `</div>` immediately after the `</Select>` closing tag for Service.

Find the Sort Select block:
```tsx
{/* Sort */}
<Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[155px] h-8 text-sm">
    <div className="flex items-center gap-2">
      <ArrowUpDown className="size-3.5 flex-shrink-0 text-slate-400" />
      <SelectValue />
    </div>
  </SelectTrigger>
```
Replace with:
```tsx
{/* Sort */}
<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[155px] h-8 text-sm">
      <div className="flex items-center gap-2 truncate md:overflow-visible">
        <ArrowUpDown className="size-3.5 md:hidden flex-shrink-0 text-slate-400" />
        <SelectValue />
      </div>
    </SelectTrigger>
```

Close the new wrapper `</div>` immediately after the `</Select>` closing tag for Sort.

**Result**: mobile shows icon inside trigger, desktop shows `Service:` / `Sort by:` label outside + no icon inside.

---

## Testing Checklist

- [ ] Saved tab desktop: `Sort by:` label shows outside the trigger, no `ArrowUpDown` icon inside — no double indicator
- [ ] Saved tab mobile: `ArrowUpDown` icon shows inside sort trigger, `Sort by:` label hidden
- [ ] Saved tab desktop: view toggle is right-aligned (`md:justify-between` restored)
- [ ] Saved tab mobile: layout unchanged — filter + sort + toggle wrap naturally
- [ ] Matches tab desktop: `Service:` label shows outside the trigger, `Tv` icon hidden inside
- [ ] Matches tab desktop: `Sort by:` label shows outside the trigger, `ArrowUpDown` icon hidden inside
- [ ] Matches tab mobile: `Tv` icon shows inside Service trigger, no label
- [ ] Matches tab mobile: `ArrowUpDown` icon shows inside Sort trigger, no label
- [ ] All dropdowns still function correctly in both tabs