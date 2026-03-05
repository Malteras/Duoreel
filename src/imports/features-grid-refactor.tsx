# Refactor: Features Grid — SVG Icons + Core Feature Tag + Free Banner

## Scope

Replace only the `<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">` block and add a free banner after it, inside the features content area of `src/app/components/LandingPage.tsx`.

Keep the section label, heading, subtitle, and divider line above the grid exactly as-is. Keep the movie poster background. Do not touch the CTA section or any CSS files.

---

## What to Replace

Find:

```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
  {[
    { icon: '🎬', title: 'Tinder-style discovery', ...
```

Replace the entire grid (through its closing `</div>`) and add the free banner after it, ending just before the closing `</div>` of `max-w-6xl`:

```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

  {/* Card 1 — Infinite Discovery (Core Feature) */}
  <div className="relative rounded-2xl border border-pink-500/30 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3 overflow-hidden">
    <div className="absolute bottom-3 right-4 text-7xl font-black text-white/5 leading-none select-none pointer-events-none">50K</div>
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-widest w-fit">
      <span className="text-pink-400">✦</span> Core Feature
    </span>
    <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-pink-400">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">Infinite Discovery</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Browse thousands of movies with infinite scroll. New titles added constantly from TMDB's massive database.</p>
  </div>

  {/* Card 2 — Instant Matching */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">Instant Matching</h3>
    <p className="text-slate-400 text-sm leading-relaxed">The moment you both save a movie, it drops into your Matches tab. No manual comparison needed.</p>
  </div>

  {/* Card 3 — Smart Filters */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">Smart Filters</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Filter by genre, decade, rating, streaming service, length, director, and more. Find exactly the type of movie you're in the mood for.</p>
  </div>

  {/* Card 4 — Streaming Availability */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">Streaming Filters</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Filter by the services you actually subscribe to — Netflix, Max, Prime, Disney+, and more. No more suggesting movies you can't watch.</p>
  </div>

  {/* Card 5 — IMDb Ratings */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">IMDb Ratings</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Every card shows the IMDb score so you can quickly judge quality. Full details — cast, runtime, plot, and streaming availability — on tap.</p>
  </div>

  {/* Card 6 — Letterboxd Import */}
  <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-300">
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
    <h3 className="text-white font-bold text-lg leading-snug">Letterboxd Import</h3>
    <p className="text-slate-400 text-sm leading-relaxed">Paste your Letterboxd RSS URL to sync your watch history and hide movies you've already seen from your Discover feed.</p>
  </div>

</div>

{/* Free banner */}
<div className="mt-10 inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold px-6 py-3 rounded-full">
  <svg className="size-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
  100% Free — All features, no limits, no credit card, ever.
</div>
```

---

## Do NOT Change

- Section label, heading, subtitle, divider line above the grid
- Movie poster background and gradient overlays
- CTA section below
- Any CSS files
- Any imports (emojis are gone so no new imports needed; `Upload` may now be unused — only remove it from imports if it has zero other usages in the file)

---

## Testing Checklist

- [ ] 6 cards in 3-column grid on desktop, 2-column on tablet, 1-column on mobile
- [ ] Card 1 (Infinite Discovery) has pink border, "✦ Core Feature" pink tag, pink icon box, and large faint "50K" watermark in bottom-right
- [ ] Cards 2–6 have slate border and slate icon boxes with SVG icons
- [ ] All 6 cards have correct titles and body text
- [ ] Green "100% Free" banner appears below the grid, left-aligned
- [ ] No emoji icons anywhere — all icons are SVGs
- [ ] No TypeScript errors