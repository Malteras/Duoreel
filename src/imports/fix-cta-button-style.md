# Fix: Unify All Pink CTA Buttons to Match Hero Button Style

## The Reference Style

The hero "Get Started Free" button is the source of truth:
```tsx
<Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white font-semibold gap-2 cursor-pointer">
```

It renders as a solid `bg-pink-600` pill via shadcn Button. All other pink CTA buttons must match this — solid pink, no gradient, same border-radius feel.

---

## Changes

### File: `src/app/components/LandingPage.tsx`

**Button 1 — Navbar "Get Started"** (line ~130):

Find:
```tsx
<Button
  onClick={onGetStarted}
  className="bg-pink-600 hover:bg-pink-700 text-white font-semibold"
>
  Get Started
</Button>
```

Replace with:
```tsx
<Button
  onClick={onGetStarted}
  className="bg-pink-600 hover:bg-pink-700 text-white font-semibold cursor-pointer"
>
  Get Started
</Button>
```

---

**Button 2 — Hero "Get Started Free"** — already correct, do not touch.

---

**Button 3 — "Who Is It For" CTA "That's me — Get Started"** (line ~1082):

Find:
```tsx
className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-pink-500/30 transition-all hover:-translate-y-0.5 text-base"
```

Replace with:
```tsx
className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-7 py-3.5 rounded-lg shadow-lg shadow-pink-500/30 transition-all cursor-pointer text-base"
```

---

**Button 4 — Final CTA "Get Started Now"** (line ~2002):

Find:
```tsx
className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-pink-500/30 transition-all cursor-pointer"
```

Replace with:
```tsx
className="inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-lg px-10 py-4 rounded-lg shadow-lg shadow-pink-500/30 transition-all cursor-pointer"
```

---

## Do NOT Change

- Button 2 (hero "Get Started Free") — it's the reference, leave it alone
- Any other elements, sections, or CSS files
- Button labels or icons

## Testing Checklist

- [ ] All 4 pink buttons are solid `bg-pink-600`, no gradients
- [ ] All darken to `bg-pink-700` on hover
- [ ] All have `cursor-pointer`
- [ ] Visual style matches the hero "Get Started Free" button