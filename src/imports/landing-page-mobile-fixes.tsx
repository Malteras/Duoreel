# Fix: Smaller Step Circles + Invite Card on Mobile

## Problem

Step circles are `w-16 h-16` with `gap-8` between circle and content, too large on mobile. The invite link card is `max-w-sm` (384px) which overflows on 375px screens.

## Changes

### File: `src/app/components/LandingPage.tsx`

**Change 1 — Step 1 circle (pink):**

Find:
```tsx
<div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/40">
  <span className="text-white text-2xl font-bold">
    1
  </span>
</div>
```

Replace with:
```tsx
<div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/40">
  <span className="text-white text-sm md:text-2xl font-bold">
    1
  </span>
</div>
```

---

**Change 2 — Step 2 circle (purple):**

Find:
```tsx
<div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/40">
```

Replace with:
```tsx
<div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/40">
```

Also find the number inside step 2:
```tsx
<span className="text-white text-2xl font-bold">
  2
</span>
```

Replace with:
```tsx
<span className="text-white text-sm md:text-2xl font-bold">
  2
</span>
```

---

**Change 3 — Step 3 circle (blue):**

Find:
```tsx
<div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/40">
```

Replace with:
```tsx
<div className="w-9 h-9 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/40">
```

Also find the number inside step 3:
```tsx
<span className="text-white text-2xl font-bold">
  3
</span>
```

Replace with:
```tsx
<span className="text-white text-sm md:text-2xl font-bold">
  3
</span>
```

---

**Change 4 — Reduce gap between circle and content on mobile:**

There are 3 step wrapper divs, all with `gap-8`. Find each:
```tsx
<div className="relative flex gap-8 mb-14">
```

Replace all 3 with:
```tsx
<div className="relative flex gap-4 md:gap-8 mb-14">
```

---

**Change 5 — Invite card max-width:**

Find:
```tsx
<div
  className="backdrop-blur-lg rounded-xl border border-slate-600/50 bg-slate-900/50 p-4 max-w-sm fade-on-scroll"
```

Replace with:
```tsx
<div
  className="backdrop-blur-lg rounded-xl border border-slate-600/50 bg-slate-900/50 p-4 max-w-full md:max-w-sm fade-on-scroll"
```

---

## Do NOT Change

- Step titles, descriptions, screenshots, or any other content
- Any CSS files

## Testing Checklist

- [ ] Mobile (375px): circles are small (36px), numbers visible, no overflow
- [ ] Mobile (375px): invite card fits within screen width
- [ ] Desktop (1024px+): circles back to full size (64px), gap-8, unchanged