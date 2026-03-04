# Add: "Why DuoReel" Comparison Section

## Scope

**Only add the new "Why DuoReel" section** inside `src/app/components/LandingPage.tsx`.  
Do not modify How It Works, Who Is It For, Features, or any other section.  
Do not touch any CSS files.

---

## Where to Insert

Find the comment `{/* Who Is It For / Who It's Not For Section */}` (around line 474).  
Insert the entire new block **directly before** that comment, keeping a blank line between them.

The result should be this order:
1. How It Works (existing)
2. **Why DuoReel** ← insert here
3. Who Is It For (existing)
4. Features (existing)

---

## New Implementation

```tsx
{/* ── WHY DUOREEL ── */}
<div id="why" className="mb-20 max-w-6xl mx-auto">
  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">
    <span className="size-1.5 rounded-full bg-pink-500 animate-pulse inline-block" />
    Why DuoReel
  </span>
  <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3">
    Every movie night, the same story
  </h2>
  <p className="text-slate-400 text-base max-w-md mb-3">Sound familiar?</p>
  <div className="w-24 h-0.5 bg-gradient-to-r from-pink-500/60 to-transparent rounded-full mb-12" />

  {/* Two-column comparison grid */}
  <div className="grid md:grid-cols-2 gap-8 items-start">

    {/* ── WITHOUT ── */}
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
      {/* Label */}
      <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        Without DuoReel
      </div>

      {/* Chat messages */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Want to watch a movie tonight? 🍿
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Sure! How about Barbie?
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Already saw it twice! Oppenheimer?
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            It's 3 hours and I have work tomorrow 😅
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            The Notebook? John Wick? Inception?
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Too sappy / too violent / too confusing 🤯
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Did you find something? 😴
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Ugh this is impossible 😩
          </div>
        </div>

        {/* Two hours later image */}
        <div className="my-3 flex justify-center">
          <img
            src={twoHoursLater}
            alt="Two hours later..."
            className="w-48 rounded-lg opacity-80"
          />
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-red-400 text-sm font-semibold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        45 minutes wasted → no movie picked → fell asleep 😴
      </div>
    </div>

    {/* ── WITH ── */}
    <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/8 via-slate-900/50 to-slate-900/50 p-8 flex flex-col">
      {/* Label */}
      <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        With DuoReel
      </div>

      {/* Chat messages */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Want to watch a movie tonight? 🍿
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Let's check our DuoReel! 🎬
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>

        {/* Match notification */}
        <div className="my-2 mx-auto w-full rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/15 to-purple-500/15 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-1">💕 It's a Match!</p>
          <p className="text-white font-bold text-base">The Grand Budapest Hotel</p>
          <p className="text-slate-400 text-xs mt-0.5">You both saved this movie</p>
        </div>

        <div className="flex gap-2 items-end">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Perfect! I've been wanting to watch that! 😍
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end">
          <div className="bg-blue-600/25 border border-blue-500/40 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white max-w-[75%]">
            Same! Starting it now 🍿
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-2 text-green-400 text-sm font-semibold">
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

## Images

A "two hours later" meme image has been added to Figma assets but is not yet imported in the file. Add the import at the top of `LandingPage.tsx` alongside the existing asset imports:

```tsx
import twoHoursLater from "figma:asset/[ID].png"; // find the correct ID in the Figma assets panel
```

Then place it inside the **Without DuoReel** card, between the last chat message and the result row:

```tsx
{/* Two hours later */}
<div className="my-3 flex justify-center">
  <img
    src={twoHoursLater}
    alt="Two hours later..."
    className="w-48 rounded-lg opacity-80"
  />
</div>
```

---

## Also Remove

The existing "Why DuoReel" section starting at `{/* Why DuoReel Section Title */}` (the long chat-based section with external images from ytimg.com and postimg.cc) is now **replaced by the new block above**. Delete everything from `{/* Why DuoReel Section Title */}` through the closing `</div>` of its container — it ends just before `{/* Features List */}`.

---

## Do NOT Change

- How It Works section
- Who Is It For / Who It's Not For section
- Features List section
- Any CSS files
- Any imports at the top of `LandingPage.tsx`

---

## Testing Checklist

- [ ] "WHY DUOREEL" pink label renders with pulsing dot
- [ ] Heading "Every movie night, the same story" and "Sound familiar?" subtitle visible
- [ ] Two columns side-by-side on desktop, stacked on mobile
- [ ] Left card has red border/label "Without DuoReel" with 8 chat messages and red result row
- [ ] Right card has green border/label "With DuoReel" with 4 chat messages + pink match notification + green result row
- [ ] Chat bubbles: S (pink avatar) on left, M (blue avatar) on right
- [ ] Match notification card is pink/purple gradient, centered between chat messages
- [ ] Result rows appear at the bottom of each card separated by a divider line
- [ ] "Two hours later" image renders inside the Without card, between last chat message and result row, centered with slight opacity
- [ ] Old Why DuoReel section (with ytimg.com / postimg.cc images) is fully removed
- [ ] Section order is: How It Works → Why DuoReel → Who Is It For → Features
- [ ] No TypeScript errors