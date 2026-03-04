# Add: Chat Bubble Typing Animation in "Why DuoReel" Section

## Goal

Make both chat conversations feel like a real live conversation by having each bubble appear one at a time with a staggered delay as the section scrolls into view — identical to the `IntersectionObserver` + `fade-on-scroll` pattern already implemented in How It Works.

The "Two Hours Later" image and the Grand Budapest card images should also animate in as part of the sequence.

---

## Scope

Only modify the `{/* ── WHY DUOREEL ── */}` block inside `src/app/components/LandingPage.tsx`.  
Do not touch How It Works, Who Is It For, any other section, or any CSS files.  
The `fade-on-scroll` / `is-visible` CSS and the `IntersectionObserver` `useEffect` are **already in the file** — do not add them again.

---

## Changes

### File: `src/app/components/LandingPage.tsx`

Inside the Why DuoReel section, add `fade-on-scroll` class and a `transitionDelay` style to every individual chat bubble row, the two-hours-later image, the Grand Budapest card pair, and the two result rows. Use a `0.12s` increment between each item so messages feel like they're arriving one after another.

Replace the contents of the two inner `flex flex-col gap-3 flex-1` containers and the two result rows with the following:

#### Without DuoReel — chat messages + result

```tsx
<div className="flex flex-col gap-3 flex-1">
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '0.05s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Want to watch a movie tonight? 🍿
    </div>
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.17s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Sure! How about Barbie?
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '0.29s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Already saw it twice! Oppenheimer?
    </div>
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.41s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      It's 3 hours and I have work tomorrow 😅
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '0.53s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      The Notebook? John Wick? Inception?
    </div>
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.65s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Too sappy / a puppy dies 😭 / too confusing 🤯
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
  {/* Two hours later image */}
  <div className="my-3 flex justify-center fade-on-scroll" style={{ transitionDelay: '0.77s' }}>
    <img
      src={twoHoursLater}
      alt="Two hours later..."
      className="w-48 rounded-lg opacity-90 grayscale-[40%]"
    />
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.89s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Did you find something? 😴
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '1.01s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Ugh this is impossible 😩
    </div>
  </div>
</div>

{/* Result */}
<div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-red-400 text-sm font-semibold fade-on-scroll" style={{ transitionDelay: '1.13s' }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
  45 minutes wasted → no movie picked → fell asleep 😴
</div>
```

#### With DuoReel — chat messages + result

```tsx
<div className="flex flex-col gap-3 flex-1">
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '0.05s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Want to watch a movie tonight? 🍿
    </div>
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.17s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Let's check our DuoReel! 🎬
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
  {/* Grand Budapest match cards */}
  <div className="my-2 flex items-start justify-between gap-3 fade-on-scroll" style={{ transitionDelay: '0.29s' }}>
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">S</div>
      <img src={grandBudapestCard} alt="The Grand Budapest Hotel saved by S" className="w-36 drop-shadow-xl" />
    </div>
    <div className="flex items-start gap-2">
      <img src={grandBudapestCard} alt="The Grand Budapest Hotel saved by M" className="w-36 drop-shadow-xl" />
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">M</div>
    </div>
  </div>
  <div className="flex gap-2 items-end fade-on-scroll" style={{ transitionDelay: '0.41s' }}>
    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Perfect! I've been wanting to watch that! 😍
    </div>
  </div>
  <div className="flex gap-2 items-end justify-end fade-on-scroll" style={{ transitionDelay: '0.53s' }}>
    <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
      Same! Starting it now 🍿
    </div>
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
  </div>
</div>

{/* Result */}
<div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-green-400 text-sm font-semibold fade-on-scroll" style={{ transitionDelay: '0.65s' }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
  2 minutes → movie picked → popcorn ready 🍿
</div>
```

---

## Important Notes

- The `fade-on-scroll` CSS class and `IntersectionObserver` `useEffect` already exist in the file from the How It Works animation — **do not add them again**
- Each card resets its delay sequence back to `0.05s` — the two columns animate independently as each enters the viewport
- The `0.12s` increment between bubbles gives a natural conversation pacing — fast enough to feel live, slow enough to read each message
- Do not change any classNames on the outer card wrappers, the section heading, label, or the grid container

---

## Testing Checklist

- [ ] On page load, all chat bubbles in the Why DuoReel section are invisible
- [ ] Scrolling to the section — "Without" card bubbles appear one by one from top to bottom with ~0.12s gaps
- [ ] "Two hours later" image animates in as part of the Without sequence at its natural position
- [ ] "With DuoReel" card bubbles animate independently in their own sequence
- [ ] Grand Budapest card pair animates in as a single unit
- [ ] Both result rows fade in last in their respective cards
- [ ] Animation plays once only — does not replay on scroll back
- [ ] How It Works animations are unchanged
- [ ] No TypeScript errors