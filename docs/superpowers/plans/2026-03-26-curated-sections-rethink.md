# QUI-224: Curated Sections Rethink — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three curated sections on Discover visually distinct with per-section background tints, matching header colors, seed card distinction, and increased spacing.

**Architecture:** Pure styling changes to the section-rendering JSX in `MoviesTab.tsx`. No new components, no data/logic changes. Each section gets a tinted wrapper `div` and recolored headers. The seed card in the recs section gets an overlay badge and border wrapper.

**Tech Stack:** React, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/app/components/MoviesTab.tsx` (lines ~1996-2205) | Section wrappers, header colors, seed card styling, spacing |

No new files. No other files modified.

---

### Task 1: Increase section spacing

Change the sections container from `space-y-6` to `space-y-7` for more breathing room between sections.

**Files:**
- Modify: `src/app/components/MoviesTab.tsx` — line ~1997

- [ ] **Step 1: Update the sections wrapper spacing**

Find on line ~1997:
```tsx
<div className="mb-8 space-y-6">
```
Change to:
```tsx
<div className="mb-8 space-y-7">
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Open the Discover tab. Confirm the three sections have noticeably more vertical gap between them than before.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/MoviesTab.tsx
git commit -m "QUI-224 / Increase curated section spacing to space-y-7"
```

---

### Task 2: Add per-section background tints and padding

Wrap each of the three sections in a tinted container with rounded corners, padding, and a faint border.

**Files:**
- Modify: `src/app/components/MoviesTab.tsx` — lines ~2016, ~2106, ~2157

- [ ] **Step 1: Wrap "Because you saved" section**

The recs section currently starts at the `<div className="animate-fade-in-up" style={{ animationDelay: '0s' }}>` wrapper (line ~2016). Add a tinted container **inside** this animation wrapper, around all the section content (header + grid):

```tsx
{likedMovies.length > 0 && <div className="animate-fade-in-up" style={{ animationDelay: '0s' }}>
  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-4 pb-5">
    {/* existing header div ... */}
    {/* existing grid div ... */}
  </div>
</div>}
```

- [ ] **Step 2: Wrap "Trending this week" section**

Same pattern with amber tint. Inside the `animate-fade-in-up` wrapper at line ~2106:

```tsx
<div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-4 pb-5">
    {/* existing header div ... */}
    {/* existing grid div ... */}
  </div>
</div>
```

- [ ] **Step 3: Wrap "Hidden gems" section**

Same pattern with emerald tint. Inside the `animate-fade-in-up` wrapper at line ~2157:

```tsx
<div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-4 pb-5">
    {/* existing header div ... */}
    {/* existing grid div ... */}
  </div>
</div>
```

- [ ] **Step 4: Verify visually**

Run: `npm run dev`
Open the Discover tab. Each section should have:
- A faintly tinted background (indigo / amber / emerald)
- A subtle matching border
- Rounded corners
- Internal padding so cards don't touch the edges

- [ ] **Step 5: Commit**

```bash
git add src/app/components/MoviesTab.tsx
git commit -m "QUI-224 / Add per-section background tints (indigo, amber, emerald)"
```

---

### Task 3: Recolor section headers to match tints

Update title text and action button colors per section.

**Files:**
- Modify: `src/app/components/MoviesTab.tsx` — section header elements

- [ ] **Step 1: Recolor "Because you saved" header**

Find the title `<p>` tag (line ~2018):
```tsx
<p className="text-sm font-medium text-slate-400">
```
Change to:
```tsx
<p className="text-sm font-medium text-indigo-300">
```

Find the Refresh button (line ~2045):
```tsx
className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
```
Change to:
```tsx
className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
```

Find the "See all" button for recs (line ~2059):
```tsx
className={`text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ...`}
```
Change `text-blue-400 hover:text-blue-300` to `text-indigo-400 hover:text-indigo-300`.

- [ ] **Step 2: Recolor "Trending this week" header**

Find the title (line ~2108):
```tsx
<p className="text-sm font-medium text-slate-400">🔥 Trending this week</p>
```
Change to:
```tsx
<p className="text-sm font-medium text-amber-300">🔥 Trending this week</p>
```

Find the "See all" button for trending (line ~2111):
Change `text-blue-400 hover:text-blue-300` to `text-amber-400 hover:text-amber-300`.

- [ ] **Step 3: Recolor "Hidden gems" header**

Find the title (line ~2159):
```tsx
<p className="text-sm font-medium text-slate-400">💎 Hidden gems</p>
```
Change to:
```tsx
<p className="text-sm font-medium text-emerald-300">💎 Hidden gems</p>
```

Find the "See all" button for gems (line ~2162):
Change `text-blue-400 hover:text-blue-300` to `text-emerald-400 hover:text-emerald-300`.

- [ ] **Step 4: Verify visually**

Run: `npm run dev`
Each section header should now have title text and action buttons colored to match its tint:
- Recs: indigo title, indigo "Refresh" and "See all"
- Trending: amber title, amber "See all"
- Gems: emerald title, emerald "See all"

- [ ] **Step 5: Commit**

```bash
git add src/app/components/MoviesTab.tsx
git commit -m "QUI-224 / Recolor section headers to match per-section tints"
```

---

### Task 4: Add seed card distinction

The first card in "Because you saved" (the seed movie) gets a subtle indigo border, glow, and "Your pick" badge. This is done via wrapper styling and the existing `topLeftOverlay` prop — no changes to `CompactMovieCard`.

**Files:**
- Modify: `src/app/components/MoviesTab.tsx` — recs section card mapping

- [ ] **Step 1: Add seed card wrapper and badge**

In the recs section card grid (line ~2069), the `.map()` callback needs to know if the current movie is the seed. The seed movie is `recSeedMovie`. Update the map to wrap the seed card:

Find the existing map in the recs grid (line ~2069):
```tsx
{sectionPreviews.recs.filter((m) => !pendingRemovals.has(m.id)).map((movie) => {
```

The `CompactMovieCard` for each movie is returned inside this map. For the seed card only, wrap it in a styled div. Check `movie.id === recSeedMovie?.id`:

```tsx
{sectionPreviews.recs.filter((m) => !pendingRemovals.has(m.id)).map((movie) => {
  const isLiked = likedMovieIds.has(movie.id);
  const isLikeLoading = sectionLikeLoadingIds.has(movie.id);
  const isSeed = movie.id === recSeedMovie?.id;
  return (
    <div key={movie.id} className={isSeed ? 'relative rounded-lg border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : ''}>
      {isSeed && (
        <span className="absolute -top-2.5 left-2 z-10 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
          Your pick
        </span>
      )}
      <CompactMovieCard
        key={movie.id}
        movie={movie}
        onClick={() => openMovie(movie)}
        {/* ... rest of existing props unchanged ... */}
      />
    </div>
  );
})}
```

**Important:** Move the `key` from `CompactMovieCard` to the outer wrapper `div`. The `CompactMovieCard` no longer needs a `key` since the wrapper provides it.

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Open Discover with some saved movies. The "Because you saved" section should show the seed movie card with:
- A subtle indigo border
- A faint indigo glow/shadow
- A small "YOUR PICK" badge floating above the top-left corner
- All other cards in the section should look normal

- [ ] **Step 3: Commit**

```bash
git add src/app/components/MoviesTab.tsx
git commit -m "QUI-224 / Add seed card distinction with indigo border and 'Your pick' badge"
```

---

### Task 5: Final verification and cleanup

**Files:**
- Verify: `src/app/components/MoviesTab.tsx`

- [ ] **Step 1: Run the dev server and test all states**

Run: `npm run dev`

Test these scenarios:
1. **With saved movies**: All three sections visible, recs has seed card distinction
2. **Without saved movies**: Only Trending + Hidden gems visible (recs hidden), both tinted correctly
3. **With filters active**: Sections collapse behind "Curated sections" toggle — when expanded, tints and colors should still work
4. **Responsive**: Resize browser to see grid adapt (5 → 4 → 3 → 2 columns) — tinted wrappers should resize gracefully

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit any cleanup if needed**

If any adjustments were needed during verification:
```bash
git add src/app/components/MoviesTab.tsx
git commit -m "QUI-224 / Final polish for curated section styling"
```
