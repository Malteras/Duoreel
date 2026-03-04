# Redesign: "Who Is It For" Audience Section

## Scope

**Only replace the "Who Is It For" block** inside `src/app/components/LandingPage.tsx`.  
Do not modify How It Works, Why DuoReel, Features, or any other section.  
Do not touch any CSS files.

---

## What to Replace

Find the comment `{/* Who Is It For / Who It's Not For Section */}` and replace everything from there through the closing `</div>` of the two-column grid (ends just before `{/* The Problem: Conversation Section */}`).

---

## New Implementation

```tsx
{/* ── WHO IS IT FOR ── */}
<div id="audience" className="mb-20 max-w-6xl mx-auto">
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
    <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
    Who Is It For
  </span>
  <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
    Is DuoReel right for you?
  </h2>
  <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

  {/* Two-column grid */}
  <div className="grid md:grid-cols-2 gap-8 items-start">

    {/* ── PERFECT FOR YOU ── */}
    <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/8 via-slate-900/50 to-slate-900/50 p-8">
      <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
        <svg className="size-5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        Perfect for you if…
      </h3>

      <ul className="space-y-5">
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-green-400 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">You're a couple or roommates</strong> who regularly watch movies together
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-green-400 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">You're tired of "What should we watch?"</strong> and want to find common ground instantly
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-green-400 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-slate-300 text-sm leading-relaxed">
            <strong className="text-white">You have different tastes</strong> and want to discover movies in the overlap
          </span>
        </li>
      </ul>
    </div>

    {/* ── NOT QUITE RIGHT ── */}
    <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/30 via-slate-900/50 to-slate-900/50 p-8">
      <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
        <svg className="size-5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        Not quite right if…
      </h3>

      <ul className="space-y-5 mb-6">
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-slate-500 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-slate-400 text-sm leading-relaxed">
            You want detailed reviews or a comprehensive movie diary
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-slate-500 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-slate-400 text-sm leading-relaxed">
            You want a social/community review system
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <svg className="size-4 text-slate-500 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-slate-400 text-sm leading-relaxed">
            You mostly watch movies solo
          </span>
        </li>
      </ul>

      {/* Letterboxd tip */}
      <div className="border-t border-slate-700/50 pt-5">
        <p className="text-slate-400 text-sm leading-relaxed">
          💡 Looking for those features? Check out{" "}
          <a
            href="https://letterboxd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            Letterboxd
          </a>
          {" "}— it's amazing. Pro tip: Use both! Import your Letterboxd watchlist into DuoReel.
        </p>
      </div>
    </div>
  </div>

  {/* Mid-page CTA */}
  <div className="mt-14 flex items-center justify-center gap-4 relative">
    {/* Hand-drawn arrow SVG */}
    <svg
      className="absolute -left-4 md:left-[calc(50%-220px)] -top-8 w-16 h-16 opacity-70 pointer-events-none"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(15deg)' }}
    >
      <path
        d="M20 15 C25 20, 30 35, 35 45 C40 55, 42 58, 50 68 C54 74, 58 78, 65 85"
        stroke="#4ade80"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55 78 L65 85 L58 75"
        stroke="#4ade80"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>

    <a
      href="/auth"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-pink-500/30 transition-all hover:-translate-y-0.5 text-base"
    >
      That's me — Get Started
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </a>
  </div>
</div>
{/* ── END WHO IS IT FOR ── */}
```

---

## Do NOT Change

- How It Works section
- Why DuoReel section
- The `{/* The Problem: Conversation Section */}` block and everything after it
- Any CSS files
- Any imports at the top of `LandingPage.tsx`
- The `CheckCircle2` import — it's no longer used in this section but may be used elsewhere; only remove it if it has zero other usages

---

## Testing Checklist

- [ ] "WHO IS IT FOR" pink label with pulsing dot renders at top
- [ ] Heading "Is DuoReel right for you?" visible
- [ ] Two cards side-by-side on desktop, stacked on mobile
- [ ] Left card: green border, green checkmark heading "Perfect for you if…", 3 list items with green check icons and bold text
- [ ] Right card: slate border, grey X heading "Not quite right if…", 3 list items with grey minus icons
- [ ] Letterboxd tip with working link appears at bottom of right card, separated by a divider
- [ ] Green hand-drawn arrow SVG appears above/beside the CTA button
- [ ] "That's me — Get Started" pink gradient button renders with arrow icon and links to `/auth`
- [ ] No TypeScript errors
- [ ] Section order unchanged: How It Works → Why DuoReel → Who Is It For → Features