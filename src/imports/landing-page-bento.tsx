# Refactor: Features Grid → Bento Layout

## Scope

Replace only the `<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">` block (including the free banner after it) inside the features section of `src/app/components/LandingPage.tsx`.

Keep the section label, heading, subtitle, divider, movie poster background, and CTA section completely untouched. No CSS changes.

---

## Bento Layout Plan

```
| ── col 1 ────────────── | ── col 2 ── | ── col 3 ── |
| Infinite Discovery ×2   | Instant     |             |  ← row 1
|                         | Matching    |             |
| Smart Filters           | Streaming   | IMDb        |  ← row 2
| Letterboxd Import ×2    | Free Banner |             |  ← row 3
```

- 3-column CSS grid on desktop
- On mobile/tablet: all cards full-width stacked

---

## Replacement Code

Find the entire block from:
```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
```
through the closing `</div>` of the free banner, and replace with:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-5">

  {/* Card 1 — Infinite Discovery (wide, col-span-2) */}
  <div className="relative md:col-span-2 rounded-2xl border border-pink-500/30 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4 overflow-hidden">
    <div className="absolute bottom-4 right-6 text-8xl font-black text-white/5 leading-none select-none pointer-events-none">50K</div>
    <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-pink-400">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">Infinite Discovery</h3>
    <p className="text-slate-400 text-sm leading-relaxed max-w-lg">Browse thousands of movies with infinite scroll. New titles added constantly from TMDb's massive database.</p>
  </div>

  {/* Card 2 — Instant Matching (col-span-1) */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">Instant Matching</h3>
    <p className="text-slate-400 text-sm leading-relaxed">The moment you both save a movie, it drops into your Matches tab. No manual comparison needed.</p>
  </div>

  {/* Card 3 — Smart Filters (col-span-1) */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">Smart Filters</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Filter by genre, decade, rating, streaming service, length, director, and more.</p>
  </div>

  {/* Card 4 — Streaming Filters (col-span-1) */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">Streaming Filters</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Filter by the services you subscribe to — Netflix, Max, Prime, Disney+, and more.</p>
  </div>

  {/* Card 5 — IMDb Ratings (col-span-1) */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">IMDb Ratings</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Every card shows the IMDb score. Full details — cast, runtime, plot, and streaming availability — on tap.</p>
  </div>

  {/* Card 6 — Letterboxd Import (wide, col-span-2) */}
  <div className="relative md:col-span-2 rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 flex flex-col gap-4 overflow-hidden">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">Letterboxd Import</h3>
    <p className="text-slate-400 text-sm leading-relaxed max-w-lg">Import your Letterboxd watchlist to populate your DuoReel Saved list, or import watched movies to hide them from Discover. Connect via RSS — review on Letterboxd and it's automatically marked as watched in DuoReel.</p>
  </div>

  {/* Free banner — as a bento card (col-span-1) */}
  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-sm p-8 flex flex-col items-start justify-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-xl leading-snug">100% Free</h3>
    <p className="text-slate-400 text-sm leading-relaxed">All features, no limits, no credit card. Ever.</p>
  </div>

</div>
```

---

## Do NOT Change

- Section label, heading, subtitle, divider line
- Movie poster background and overlays
- CTA section below
- Any CSS files

---

## Testing Checklist

- [ ] 3-column bento grid on desktop
- [ ] Row 1: "Infinite Discovery" spans 2 columns, "Instant Matching" spans 1
- [ ] Row 2: "Smart Filters", "Streaming Filters", "IMDb Ratings" each span 1 column
- [ ] Row 3: "Letterboxd Import" spans 2 columns, "100% Free" spans 1 as a green card
- [ ] Card 1 has pink border, "✦ Core Feature" tag, and "50K" watermark
- [ ] Free banner is now a proper bento card with green icon box, not an inline pill
- [ ] All cards stack to full-width on mobile
- [ ] No TypeScript errors