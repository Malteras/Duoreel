# Feature: Add Social Proof Bar Between Hero and How It Works

## Approach

Insert a new social proof bar section between the closing `</section>` of the
hero and the opening `<div>` of the How It Works section. No existing code is
modified — this is a pure insertion.

The bar shows 3 stats with icons: couples matched, movies to discover, and free
forever. Style uses Tailwind classes consistent with the existing design system.

---

## Changes

### File: `src/app/components/LandingPage.tsx`

#### Step 1: Add Users icon to lucide-react imports

Find the existing lucide-react import block:
```tsx
import {
  Film,
  ThumbsUp,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  LinkIcon,
  Star,
  Upload,
  FileText,
} from "lucide-react";
```

`Users` is already imported — no change needed. Also confirm `Heart` is imported
(it is, on its own line). No import changes required.

#### Step 2: Insert the social proof section

Find this exact comment and the line immediately after it:
```tsx
      </section>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          {/* How It Works Section Title */}
```

Insert the new section **between** `</section>` and the `<div className="relative max-w-7xl...">` line:

```tsx
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center items-center gap-10 sm:gap-16">

          {/* Stat 1 — Couples */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">500+</div>
              <div className="text-sm text-slate-400 mt-0.5">couples matched</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-700/60" />

          {/* Stat 2 — Movies */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M7 2v20M17 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">50K+</div>
              <div className="text-sm text-slate-400 mt-0.5">movies to discover</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-700/60" />

          {/* Stat 3 — Free */}
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">100%</div>
              <div className="text-sm text-slate-400 mt-0.5">free, forever</div>
            </div>
          </div>

        </div>
      </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          {/* How It Works Section Title */}
```

---

## WCAG Note
All text in this section passes contrast:
- Numbers: `text-white` on `slate-900/50` bg — passes (~19:1)
- Labels: `text-slate-400` on `slate-900/50` bg — passes (~5.5:1)

---

## Impact Assessment

- Zero risk — pure insertion, nothing existing is modified
- No new imports needed (all icons are inline SVGs matching the original HTML design)
- Section sits between hero and How It Works, consistent with the design file

---

## Testing Checklist

- [ ] Social proof bar appears between hero and How It Works
- [ ] 3 stats visible: "500+ couples matched", "50K+ movies to discover", "100% free, forever"
- [ ] Each stat has a coloured icon pill (pink / blue / green)
- [ ] Vertical dividers visible between stats on desktop, hidden on mobile
- [ ] Stats wrap cleanly on small screens (no overflow)
- [ ] Top and bottom borders visible (`border-y border-slate-800`)
- [ ] Numbers are white and bold, labels are `text-slate-400`
- [ ] No TypeScript errors

## Summary Table

| | Before | After |
|--|--------|-------|
| Between hero and How It Works | Empty gap | Social proof bar with 3 stats |
| Stats | None | 500+ couples, 50K+ movies, 100% free |
| Icons | None | Inline SVG in coloured pill (pink/blue/green) |
| Mobile | — | Stats wrap, dividers hidden |