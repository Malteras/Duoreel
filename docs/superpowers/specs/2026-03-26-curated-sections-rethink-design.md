# QUI-224: Curated Sections Rethink

## Overview

Redesign the three curated sections on the Discover home view — "Because you saved X", "Trending this week", and "Hidden gems" — to make them visually distinct, responsive, and better differentiated from each other.

## Current State

- Three sections stacked vertically with minimal spacing
- All use `CompactMovieCard` in a 5-column grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`)
- Identical visual treatment — only the title text distinguishes them
- Section headers: slate-colored title + "See all" button (+ "Refresh" for recs)
- Sections collapse when filters are active (QUI-217)

## Design

### 1. Responsive Grid (no change to card count logic)

Keep the existing responsive grid breakpoints. Cards shown based on container width:

| Breakpoint | Columns |
|------------|---------|
| `xl` (≥1280px) | 5 |
| `lg` (≥1024px) | 4 |
| `md` (≥768px) | 3 |
| default | 2 |

No horizontal scroll. No new card component. Continue using `CompactMovieCard` for all cards in all sections.

### 2. Per-Section Background Tints

Wrap each section in a container with a faint colored background and matching border to make them instantly distinguishable:

| Section | Background | Border |
|---------|-----------|--------|
| Because you saved | `bg-indigo-500/5` | `border border-indigo-500/10` |
| Trending this week | `bg-amber-500/5` | `border border-amber-500/10` |
| Hidden gems | `bg-emerald-500/5` | `border border-emerald-500/10` |

Each wrapper gets `rounded-xl px-4 py-4 pb-5` (or similar) for internal padding.

### 3. Section Header Color Matching

Section title text color matches the section tint:

| Section | Title color |
|---------|------------|
| Because you saved | `text-indigo-300` |
| Trending this week | `text-amber-300` |
| Hidden gems | `text-emerald-300` |

The "See all" and "Refresh" button colors should also match the section accent (e.g., `text-indigo-400 hover:text-indigo-300` for recs).

### 4. Seed Card Distinction

The seed movie (first card) in the "Because you saved" section gets subtle visual distinction:

- Indigo border: `border-indigo-500/50`
- Faint glow: `shadow-[0_0_12px_rgba(99,102,241,0.15)]`
- Small "Your pick" badge: top-left position, indigo background (`bg-indigo-600`), white text, `text-[10px] font-bold uppercase tracking-wide`, rounded

This is applied via a prop or wrapper — **not** a new card component. The `CompactMovieCard` itself stays unchanged; the distinction is in overlays/wrappers.

### 5. Increased Section Spacing

Gap between sections increases from current tight stacking to `gap-7` (~28px). The sections wrapper becomes:

```
space-y-7 (or gap-7 if flex/grid)
```

### 6. What Stays the Same

- Section headers keep existing structure: title left, actions right
- "Refresh" button only on "Because you saved" section
- "See all" button on all three sections
- Collapse/expand behavior when filters are active (QUI-217) — unchanged
- Card overlays (heart/save button top-left, ban button top-right on Discover) — unchanged
- Data fetching logic (parallel fetch for trending, gems, recs) — unchanged
- 5 movies fetched per section — unchanged
- Skeleton loading states — unchanged
- Staggered animation delays (0s, 0.1s, 0.25s) — unchanged

## Files to Modify

- `src/app/components/MoviesTab.tsx` — section rendering JSX (lines ~2013-2205), section wrapper styling, header colors, seed card wrapper

## Out of Scope

- Changing which sections exist (recs, trending, gems stay as-is)
- Changing data fetching or filtering logic
- Changing CompactMovieCard internals
- Changing the "See all" full-section views
- Mobile-specific layout changes beyond existing responsive breakpoints
