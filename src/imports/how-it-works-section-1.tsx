# Redesign: "How It Works" Section on Landing Page

## Reference

The target design is the attached screenshot. Implement it exactly as shown:
- Pink "HOW IT WORKS" label at top
- Bold heading "Three steps to movie night"
- Subtitle text below
- 3 steps in a vertical timeline layout (numbered circles + connector line)
- Step 1: Connect — invite link mockup card
- Step 2: Discover — app screenshot (`appScreenshot`) with italic Letterboxd note below
- Step 3: Match 🎉 — matches screenshot (`matchesScreenshot`) with italic note below
- Waterfall stagger animation on each step

---

## Scope

**Only touch the "How It Works" block** inside `src/app/components/LandingPage.tsx`.  
Do not modify any other section (hero, who-is-it-for, features, footer, etc.).  
Do not touch any CSS files.

---

## What to Replace

Find the comment `{/* How It Works Section Title */}` and replace everything from there through the closing `</div>` of the steps container (the block ending after Step 6 — "Watch Together 🥳") with the new implementation below.

---

## New Implementation

```tsx
{/* ── HOW IT WORKS ── */}
<div id="how-it-works" className="mb-16 max-w-6xl mx-auto">
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
    <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
    How It Works
  </span>
  <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
    Three steps to movie night
  </h2>
  <p className="text-slate-400 text-base max-w-md mb-3">
    No app install, no credit card. Share your invite link with your partner and start discovering.
  </p>
  <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full" />
</div>

{/* Steps */}
<div className="max-w-4xl mx-auto mb-32 relative">

  {/* Vertical connector line */}
  <div
    className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-pink-500/50 via-purple-500/30 to-blue-500/20 hidden md:block"
    aria-hidden="true"
  />

  {/* ── STEP 1: Connect ── */}
  <div
    className="relative flex gap-8 mb-14 animate-fade-in-up"
    style={{ animationDelay: '0s' }}
  >
    <div className="flex-shrink-0 z-10">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/40">
        <span className="text-white text-2xl font-bold">1</span>
      </div>
    </div>

    <div className="flex-1 pt-3">
      <h3 className="text-2xl font-bold text-white mb-2">Connect</h3>
      <p className="text-slate-300 leading-relaxed mb-5 max-w-lg">
        Create a free account and share your invite link with your partner.
        They open the link, create their account, and you're connected —
        takes 2 minutes, no app install needed.
      </p>

      {/* Invite link mockup */}
      <div className="backdrop-blur-lg rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 max-w-sm">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Share Your Invite Link
        </p>
        <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/40 rounded-lg px-3 py-2 text-cyan-400 font-mono text-xs mb-3">
          <svg className="size-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          duoreel.com/invite/a8f3k2...
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Link
        </button>
      </div>
      <p className="text-xs text-slate-400 italic mt-3">
        You're automatically connected once they join.
      </p>
    </div>
  </div>

  {/* ── STEP 2: Discover ── */}
  <div
    className="relative flex gap-8 mb-14 animate-fade-in-up"
    style={{ animationDelay: '0.15s' }}
  >
    <div className="flex-shrink-0 z-10">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/40">
        <span className="text-white text-2xl font-bold">2</span>
      </div>
    </div>

    <div className="flex-1 pt-3">
      <h3 className="text-2xl font-bold text-white mb-2">Discover</h3>
      <p className="text-slate-300 leading-relaxed mb-5 max-w-lg">
        Browse thousands of movies independently. Save the ones you'd watch,
        dismiss the ones you wouldn't. Filter by genre, decade, or IMDb rating.
      </p>

      {/* App screenshot */}
      <div className="relative max-w-md">
        <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 rounded-2xl blur-xl" />
        <img
          src={appScreenshot}
          alt="DuoReel Discover tab"
          className="relative w-full rounded-2xl shadow-2xl shadow-slate-950/80 border border-slate-700/50"
        />
      </div>
      <p className="text-xs text-slate-400 italic mt-3">
        Import your Letterboxd watchlist to get a head start.
      </p>
    </div>
  </div>

  {/* ── STEP 3: Match ── */}
  <div
    className="relative flex gap-8 animate-fade-in-up"
    style={{ animationDelay: '0.3s' }}
  >
    <div className="flex-shrink-0 z-10">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/40">
        <span className="text-white text-2xl font-bold">3</span>
      </div>
    </div>

    <div className="flex-1 pt-3">
      <h3 className="text-2xl font-bold text-white mb-2">Match! 🎉</h3>
      <p className="text-slate-300 leading-relaxed mb-5 max-w-lg">
        When you both save the same movie — it's a match! You'll get notified
        instantly and it's automatically added to your shared watchlist.
        Movie night, solved.
      </p>

      {/* Matches screenshot */}
      <div className="relative max-w-md">
        <div className="absolute -inset-2 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />
        <img
          src={matchesScreenshot}
          alt="DuoReel Matches tab"
          className="relative w-full rounded-2xl shadow-2xl shadow-slate-950/80 border border-slate-700/50"
        />
      </div>
      <p className="text-xs text-slate-400 italic mt-4">
        No more endless scrolling or debating.
      </p>
    </div>
  </div>

</div>
{/* ── END HOW IT WORKS ── */}
```

---

## Images

Use the **existing** `figma:asset` imports already present at the top of `LandingPage.tsx`:

```tsx
import appScreenshot from "figma:asset/b93eb9190ee818e6e3f0c5e4e02a1b41573eb5df.png";
import matchesScreenshot from "figma:asset/f99272690cff28ce969229dfd7b06bc1656eb9a2.png";
```

- `appScreenshot` → Step 2 (Discover)
- `matchesScreenshot` → Step 3 (Match)
- These imports already exist — **do not add them again**.
- Do not use any external image URLs.

---

## Animation

- Uses the **existing** `animate-fade-in-up` class from `src/styles/theme.css` — no new CSS needed.
- Waterfall stagger via `animationDelay`: `0s` → `0.15s` → `0.3s` on each step row.
- Same pattern already used in the hero section.

---

## Do NOT Change

- Any other section (hero, who-is-it-for, features, footer)
- The `{/* Who Is It For */}` block immediately after — leave it exactly as-is
- Any CSS files (`theme.css`, `tailwind.css`)
- Any existing imports at the top of `LandingPage.tsx`

---

## Testing Checklist

- [ ] "HOW IT WORKS" pink label renders at top of section
- [ ] Heading "Three steps to movie night" and subtitle visible
- [ ] Step 1 bubble is pink, shows invite link mockup card with Copy Link button; "You're automatically connected..." note uses `text-slate-400` (not `text-slate-500`)
- [ ] Step 2 bubble is purple, shows `appScreenshot` image; "Import your Letterboxd..." italic note appears **below** the screenshot (not above it)
- [ ] Step 3 bubble is blue, shows `matchesScreenshot` image; "No more endless scrolling" note uses `text-slate-400`
- [ ] All italic notes pass WCAG AA contrast (slate-400 on dark background ✓)
- [ ] Vertical connector line visible on desktop between bubbles, hidden on mobile
- [ ] All three steps animate in with staggered `fadeInUp` on page load
- [ ] No TypeScript errors, no duplicate imports
- [ ] "Who is it for?" section below is unchanged