# Refactor: Features Section

## Scope

Replace the entire `{/* Features List */}` block in `src/app/components/LandingPage.tsx` — from `<div id="features"` through its closing `</div>` (ends just before `{/* CTA Section */}`).

Keep the movie poster grid background and its gradient overlays exactly as-is. Only replace the content area inside `<div className="max-w-5xl mx-auto px-4 relative">`.

Do not touch the CTA section or any other section. No CSS file changes.

---

## What to Replace

Find:

```tsx
<div className="max-w-5xl mx-auto px-4 relative">
  <h2 className="text-4xl font-bold text-white text-center mb-12">
    Everything You Need
  </h2>

  <div className="grid md:grid-cols-2 gap-6">
```

Replace everything from that div through its closing `</div></div>` (the end of the features content, before `</div>` that closes the outer `id="features"` div) with:

```tsx
<div className="max-w-6xl mx-auto px-4 relative">
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
    <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
    Features
  </span>
  <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
    Everything you need
  </h2>
  <p className="text-slate-400 text-base max-w-md mb-3">
    Simple by design. Powerful where it matters.
  </p>
  <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {[
      { icon: '🎬', title: 'Tinder-style discovery',  body: 'Browse a curated feed and save movies with one tap. Your partner does the same, independently.' },
      { icon: '✨', title: 'Instant matching',         body: 'The moment you both save a movie, it drops into your Matches tab. No manual comparison needed.' },
      { icon: '📺', title: 'Streaming filters',        body: 'Filter by the services you actually subscribe to — Netflix, Max, Prime, Disney+, and more.' },
      { icon: '⭐', title: 'IMDb ratings',             body: 'Every card shows the IMDb score so you can quickly judge quality before you decide.' },
      { icon: '🔖', title: 'Save for later',           body: "Not sure yet? Bookmark a movie to your Saved list and come back to it when you're ready." },
      { icon: '📋', title: 'Letterboxd import',        body: 'Paste your Letterboxd RSS URL to sync your watch history and hide movies you\'ve already seen.' },
    ].map((f, i) => (
      <div
        key={i}
        className="rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-6 flex flex-col gap-3 hover:border-slate-600/50 transition-colors"
      >
        <span className="text-3xl">{f.icon}</span>
        <h3 className="text-white font-bold text-lg leading-snug">{f.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
      </div>
    ))}
  </div>
</div>
```

---

## Do NOT Change

- The movie poster grid background (all `<img>` tags and the perspective transform)
- The gradient overlays (`bg-gradient-to-b`, `bg-gradient-to-r`)
- The CTA section below
- Any imports — `CheckCircle2` and `Upload` may become unused in this section; only remove them from imports if they have zero other usages in the file
- Any CSS files

---

## Testing Checklist

- [ ] "FEATURES" pink label with pulsing dot renders at top left
- [ ] Heading "Everything you need" and subtitle "Simple by design. Powerful where it matters." visible
- [ ] Pink gradient divider line below subtitle
- [ ] 6 feature cards in a 3-column grid on desktop, 2-column on tablet, 1-column on mobile
- [ ] Each card: emoji icon, bold title, muted body text
- [ ] Cards have subtle border with a slightly brighter border on hover
- [ ] Movie poster background still visible behind the content
- [ ] No TypeScript errors