# Fix: View Toggle — Saved & Matches Tabs (Match Discover Pattern)

## Problem

Saved and Matches tabs still show the old `Compact ⊞ / List ☰` toggle. Discover was already updated to `Large ⊞ / Compact ⊟` — Saved and Matches were missed. The list view rendering blocks also need to be commented out as dead code, exactly as was done in Discover.

---

## Changes

### File: `src/app/components/SavedMoviesTab.tsx`

#### Step 1 — Swap `List` for `LayoutList` in the lucide import

```diff
-import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, List, Loader2 } from 'lucide-react';
+import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
```

#### Step 2 — Replace the toggle buttons

Find (lines ~502–519):
```tsx
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
```

Replace with:
```tsx
{/* View mode toggle — Large (default) vs Compact grid */}
<div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 md:ml-auto flex-shrink-0">
  <button
    onClick={() => handleCardViewMode('grid')}
    className={`p-1.5 rounded transition-colors ${cardViewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
    aria-label="Large card view"
    title="Large cards"
  >
    <LayoutList className="size-3.5" />
  </button>
  <button
    onClick={() => handleCardViewMode('compact')}
    className={`p-1.5 rounded transition-colors ${cardViewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
    aria-label="Compact grid view"
    title="Compact grid"
  >
    <LayoutGrid className="size-3.5" />
  </button>
</div>
```

#### Step 3 — Comment out list view dead code (My List)

Find the My List list view block (~line 751):
```tsx
{/* ── List view ── */}
{cardViewMode === 'list' && (
  <div className="space-y-2">
    ...
  </div>
)}
```

Wrap the entire block in a comment:
```tsx
{/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
    but not currently exposed in the UI toggle. To re-enable: add a List icon
    button to the toggle above calling handleCardViewMode('list').
{cardViewMode === 'list' && (
  <div className="space-y-2">
    ...all list JSX...
  </div>
)}
── end of list view dead code ── */}
```

#### Step 4 — Comment out list view dead code (Partner's List)

Same as Step 3 — find the Partner's List list view block (~line 959) and wrap it in the same style of comment.

---

### File: `src/app/components/MatchesTab.tsx`

#### Step 1 — Swap `List` for `LayoutList` in the lucide import

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
   Loader2,
-  List,
+  LayoutList,
 } from 'lucide-react';
```

#### Step 2 — Replace the toggle buttons

Find (~lines 601–620):
```tsx
<div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5">
  <button
    onClick={() => handleViewMode('compact')}
    className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
    aria-label="Compact grid view"
    title="Compact grid"
  >
    <LayoutGrid className="size-3.5" />
  </button>
  <button
    onClick={() => handleViewMode('list')}
    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
    aria-label="List view"
    title="List view"
  >
    <List className="size-3.5" />
  </button>
</div>
```

Replace with:
```tsx
<div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5">
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
```

#### Step 3 — Comment out list view dead code

Find the Matches list view block (~line 789):
```tsx
{/* ── List view ── */}
{viewMode === 'list' && (
  <div className="space-y-2">
    ...
  </div>
)}
```

Wrap in a comment using the same pattern as SavedMoviesTab:
```tsx
{/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
    but not currently exposed in the UI toggle. To re-enable: add a List icon
    button to the toggle above calling handleViewMode('list').
{viewMode === 'list' && (
  <div className="space-y-2">
    ...all list JSX...
  </div>
)}
── end of list view dead code ── */}
```

---

## Testing Checklist

- [ ] Saved tab: toggle shows Large card icon (left) and Compact grid icon (right) — no List button
- [ ] Saved tab: Large button is active by default, highlights correctly when selected
- [ ] Saved tab: Compact button switches to compact grid, Large button switches back to full cards
- [ ] Saved tab: My List and Partner's List both respect the toggle
- [ ] Matches tab: same two-button toggle, same behaviour
- [ ] All three tabs now have identical toggle UI (Large / Compact)
- [ ] No TypeScript errors — `List` removed, `LayoutList` added in both files
- [ ] List view JSX is still present in both files but commented out with re-enable instructions

## Summary Table

| Tab | Before | After |
|-----|--------|-------|
| Saved toggle | Compact ⊞ / List ☰ | Large ⊟ / Compact ⊞ |
| Matches toggle | Compact ⊞ / List ☰ | Large ⊟ / Compact ⊞ |
| Discover toggle | ✅ Already correct | Unchanged |
| List view code | Active, reachable from UI | Dead code, commented out with re-enable note |