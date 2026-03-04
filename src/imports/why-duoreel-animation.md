# Improve: Why DuoReel Chat Animation — Slower Pacing + Coordinated "With DuoReel" Reveal

## Goal

Two changes:

1. **Without DuoReel** — slow down the bubble delays so there's a natural `~0.5s` pause between each message (feels like a real conversation, not a data dump). The result row items also appear sequentially word-by-word via separate elements.

2. **With DuoReel** — the card is visible immediately (border, label, title visible), but the chat area shows a pulsing "Wait for it…" placeholder. Once the Without card finishes its entire sequence, the placeholder disappears and the With DuoReel chat animates in.

---

## Timing Plan

### Without DuoReel — bubble delays

Each bubble `1s` apart. The `twoHoursLater` image gets an extra `1s` gap before it (feels like time passing). Total sequence ends at `~5.5s`.

| Item | Delay |
|------|-------|
| "Want to watch a movie tonight? 🍿" | `0.3s` |
| "Sure! How about Barbie?" | `7.8s` |
| "Already saw it twice! Oppenheimer?" | `7.8s` |
| "It's 3 hours and I have work tomorrow 😅" | `3.3s` |
| "The Notebook? John Wick? Inception?" | `7.8s` |
| "Too sappy / a puppy dies 😭 / too confusing 🤯" | `9.8s` |
| Two Hours Later image | `6.8s` (extra 1.5s gap) |
| "Did you find something? 😴" | `7.8s` |
| "Ugh this is impossible 😩" | `8.8s` |
| Result row | `9.8s` |

### With DuoReel — delayed start

The With DuoReel chat starts after the Without card finishes: `9.8s + 0.6s (transition duration) = ~10.4s` after the section enters the viewport.

| Item | Delay |
|------|-------|
| "Wait for it…" placeholder | visible immediately (0s), hidden at `10.4s` |
| "Want to watch a movie tonight? 🍿" | `10.6s` |
| "Let's check our DuoReel! 🎬" | `11.6s` |
| Grand Budapest cards | `12.6s` |
| "Perfect! I've been wanting to watch that! 😍" | `13.6s` |
| "Same! Starting it now 🍿" | `14.6s` |
| Result row | `15.6s` |

---

## Implementation

This requires React state to track when the Without card is done and trigger the With card sequence. Replace the entire `{/* ── WHY DUOREEL ── */}` block with the following.

### File: `src/app/components/LandingPage.tsx`

#### Step 1: Add state at the top of the component

After the existing state declarations, add:

```tsx
const [whyDuoReelVisible, setWhyDuoReelVisible] = useState(false);
const whyRef = useRef<HTMLDivElement>(null);
```

Make sure `useRef` is imported — it should already be available since `useEffect` and `useState` are imported.

#### Step 2: Add a dedicated IntersectionObserver for the Why DuoReel section

Add this `useEffect` after the existing scroll animation `useEffect`:

```tsx
useEffect(() => {
  const el = whyRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setWhyDuoReelVisible(true);
        observer.disconnect();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

#### Step 3: Replace the Why DuoReel section markup

Replace the entire `{/* ── WHY DUOREEL ── */}` block with:

```tsx
{/* ── WHY DUOREEL ── */}
<div id="why" className="mb-20 max-w-6xl mx-auto" ref={whyRef}>
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
    <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
    Why DuoReel
  </span>
  <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
    Every movie night, the same story
  </h2>
  <p className="text-slate-400 text-base max-w-md mb-3">Sound familiar?</p>
  <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

  <div className="grid md:grid-cols-2 gap-8 items-stretch">

    {/* ── WITHOUT ── */}
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
      <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        Without DuoReel
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {[
          { side: 'left',  text: 'Want to watch a movie tonight? 🍿',                delay: '0.3s'  },
          { side: 'right', text: 'Sure! How about Barbie?',                           delay: '7.8s'  },
          { side: 'left',  text: 'Already saw it twice! Oppenheimer?',                delay: '7.8s'  },
          { side: 'right', text: "It's 3 hours and I have work tomorrow 😅",          delay: '3.3s'  },
          { side: 'left',  text: 'The Notebook? John Wick? Inception?',               delay: '7.8s'  },
          { side: 'right', text: 'Too sappy / a puppy dies 😭 / too confusing 🤯',    delay: '5.3s'  },
        ].map(({ side, text, delay }, i) => (
          <div
            key={i}
            className={`flex gap-2 items-end${side === 'right' ? ' justify-end' : ''}`}
            style={{
              opacity: whyDuoReelVisible ? 1 : 0,
              transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
            }}
          >
            {side === 'left' && (
              <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
            )}
            <div className={`${side === 'left' ? 'bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm' : 'bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm'} px-4 py-2.5 text-sm text-white max-w-[75%]`}>
              {text}
            </div>
            {side === 'right' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
            )}
          </div>
        ))}

        {/* Two Hours Later image */}
        <div
          className="my-3 flex justify-center"
          style={{
            opacity: whyDuoReelVisible ? 1 : 0,
            transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease-out 6.8s, transform 0.5s ease-out 6.8s',
          }}
        >
          <img src={twoHoursLater} alt="Two hours later..." className="w-48 rounded-lg opacity-90 grayscale-[40%]" />
        </div>

        {[
          { side: 'right', text: 'Did you find something? 😴', delay: '7.8s' },
          { side: 'left',  text: 'Ugh this is impossible 😩',  delay: '8.8s' },
        ].map(({ side, text, delay }, i) => (
          <div
            key={i}
            className={`flex gap-2 items-end${side === 'right' ? ' justify-end' : ''}`}
            style={{
              opacity: whyDuoReelVisible ? 1 : 0,
              transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
            }}
          >
            {side === 'left' && (
              <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
            )}
            <div className={`${side === 'left' ? 'bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm' : 'bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm'} px-4 py-2.5 text-sm text-white max-w-[75%]`}>
              {text}
            </div>
            {side === 'right' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
            )}
          </div>
        ))}
      </div>

      {/* Result */}
      <div
        className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-red-400 text-sm font-semibold"
        style={{
          opacity: whyDuoReelVisible ? 1 : 0,
          transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease-out 9.8s, transform 0.5s ease-out 9.8s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        45 minutes wasted → no movie picked → fell asleep 😴
      </div>
    </div>

    {/* ── WITH ── */}
    <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
      <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        With DuoReel
      </div>

      <div className="flex flex-col gap-3 flex-1 relative">
        {/* "Wait for it…" pulsing placeholder — visible until Without finishes */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
          style={{
            opacity: whyDuoReelVisible ? 0 : 1,
            transition: 'opacity 0.4s ease-out 10.4s',
          }}
        >
          <div className="flex gap-2 items-center">
            <span className="size-3 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0s' }} />
            <span className="size-3 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span className="size-3 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
          <p className="text-green-400 text-base font-semibold tracking-wide">wait for it…</p>
          <p className="text-slate-400 text-xs">the good ending is coming</p>
        </div>

        {/* Chat messages — hidden until Without finishes */}
        {[
          { side: 'left',  text: 'Want to watch a movie tonight? 🍿',        delay: '10.6s' },
          { side: 'right', text: "Let's check our DuoReel! 🎬",               delay: '11.6s' },
        ].map(({ side, text, delay }, i) => (
          <div
            key={i}
            className={`flex gap-2 items-end${side === 'right' ? ' justify-end' : ''}`}
            style={{
              opacity: whyDuoReelVisible ? 1 : 0,
              transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
            }}
          >
            {side === 'left' && (
              <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
            )}
            <div className={`${side === 'left' ? 'bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm' : 'bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm'} px-4 py-2.5 text-sm text-white max-w-[75%]`}>
              {text}
            </div>
            {side === 'right' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
            )}
          </div>
        ))}

        {/* Grand Budapest match cards */}
        <div
          className="my-2 flex items-start justify-between gap-3"
          style={{
            opacity: whyDuoReelVisible ? 1 : 0,
            transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease-out 12.6s, transform 0.5s ease-out 12.6s',
          }}
        >
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">S</div>
            <img src={grandBudapestCard} alt="The Grand Budapest Hotel saved by S" className="w-36 drop-shadow-xl" />
          </div>
          <div className="flex items-start gap-2">
            <img src={grandBudapestCard} alt="The Grand Budapest Hotel saved by M" className="w-36 drop-shadow-xl" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-2">M</div>
          </div>
        </div>

        {[
          { side: 'left',  text: "Perfect! I've been wanting to watch that! 😍", delay: '13.6s' },
          { side: 'right', text: 'Same! Starting it now 🍿',                      delay: '14.6s' },
        ].map(({ side, text, delay }, i) => (
          <div
            key={i}
            className={`flex gap-2 items-end${side === 'right' ? ' justify-end' : ''}`}
            style={{
              opacity: whyDuoReelVisible ? 1 : 0,
              transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.5s ease-out ${delay}, transform 0.5s ease-out ${delay}`,
            }}
          >
            {side === 'left' && (
              <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
            )}
            <div className={`${side === 'left' ? 'bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm' : 'bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm'} px-4 py-2.5 text-sm text-white max-w-[75%]`}>
              {text}
            </div>
            {side === 'right' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
            )}
          </div>
        ))}
      </div>

      {/* Result */}
      <div
        className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-green-400 text-sm font-semibold"
        style={{
          opacity: whyDuoReelVisible ? 1 : 0,
          transform: whyDuoReelVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease-out 15.6s, transform 0.5s ease-out 15.6s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        2 minutes → movie picked → popcorn ready 🍿
      </div>
    </div>

  </div>
</div>
{/* ── END WHY DUOREEL ── */}
```

---

## Key Implementation Notes

- **Use inline `style` transitions** (not `fade-on-scroll` class) for the Why DuoReel section. This is because the timing depends on `whyDuoReelVisible` state, not just a CSS class toggled by the generic observer. The existing `fade-on-scroll` observer is left untouched.
- **`whyRef`** is attached to the outer section div. The dedicated observer sets `whyDuoReelVisible = true` once and disconnects — all animations are driven purely by CSS transition-delay from that single state flip.
- **The "wait for it…" placeholder** uses `opacity: 0` with `transition: opacity 0.4s ease-out 10.4s` — it fades out exactly when the Without card finishes. It's `position: absolute` so it doesn't affect layout height.
- The With DuoReel card **border, label, and title** are always visible (no animation on them) — only the chat content area waits.
- Remove the old `fade-on-scroll` classes and `transitionDelay` styles from all Why DuoReel chat elements since this block now uses inline style transitions instead.

---

## Do NOT Change

- How It Works animations (`fade-on-scroll` observer and classes)
- Who Is It For section
- Any CSS files
- The `whyDuoReelVisible` state only affects elements inside `{/* ── WHY DUOREEL ── */}`

---

## Testing Checklist

- [ ] "Wait for it…" shows: three larger green pulsing dots, green text-base font-semibold text, grey subtext "the good ending is coming"
- [ ] At ~10.4s: placeholder fades out smoothly
- [ ] With DuoReel chat bubbles begin at ~10.6s and appear every ~1s
- [ ] Grand Budapest cards appear as a single unit at ~12.6s
- [ ] With result row appears last at ~15.6s
- [ ] Animation plays once only — scrolling away and back does not replay
- [ ] No layout shift from the absolute-positioned placeholder
- [ ] No TypeScript errors