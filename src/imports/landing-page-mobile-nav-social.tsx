# Fix: Mobile Navbar Logo Size + Social Proof Bar Single Row

## Change 1 — Smaller navbar logo/text on mobile

### File: `src/app/components/LandingPage.tsx`

Find:
```tsx
<img
  src={duoReelMatchHeart}
  alt="DuoReel"
  className="h-10 w-auto"
/>
<div>
  <h1 className="text-2xl font-bold text-white">
    <span className="text-pink-400">Duo</span>Reel
  </h1>
  <p className="text-sm text-slate-400">
    Find movies you both love
  </p>
</div>
```

Replace with:
```tsx
<img
  src={duoReelMatchHeart}
  alt="DuoReel"
  className="h-7 md:h-10 w-auto"
/>
<div>
  <h1 className="text-lg md:text-2xl font-bold text-white">
    <span className="text-pink-400">Duo</span>Reel
  </h1>
  <p className="text-xs md:text-sm text-slate-400">
    Find movies you both love
  </p>
</div>
```

---

## Change 2 — Social proof bar: always single row, smaller on mobile

Find:
```tsx
<div className="border-y border-slate-800 bg-slate-900/50 py-10">
  <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center items-center gap-10 sm:gap-16">
```

Replace with:
```tsx
<div className="border-y border-slate-800 bg-slate-900/50 py-6">
  <div className="max-w-4xl mx-auto px-4 flex flex-nowrap justify-center items-center gap-4 sm:gap-16 overflow-hidden">
```

Then find all three stat number spans (there are 3 of them):
```tsx
<span className="text-2xl font-bold text-white leading-none">
  500+
</span>
```
```tsx
<div className="text-2xl font-bold text-white leading-none">
  50K+
</div>
```
```tsx
<div className="text-2xl font-bold text-white leading-none">
  100%
</div>
```

Replace each `text-2xl` with `text-lg md:text-2xl`:
```tsx
<span className="text-lg md:text-2xl font-bold text-white leading-none">
  500+
</span>
```
```tsx
<div className="text-lg md:text-2xl font-bold text-white leading-none">
  50K+
</div>
```
```tsx
<div className="text-lg md:text-2xl font-bold text-white leading-none">
  100%
</div>
```

Then find all three stat label divs and make them smaller on mobile:
```tsx
<div className="text-sm text-slate-400 mt-0.5">
  couples matched
</div>
```
```tsx
<div className="text-sm text-slate-400 mt-0.5">
  movies to discover
</div>
```
```tsx
<div className="text-sm text-slate-400 mt-0.5">
  free, forever
</div>
```

Replace each `text-sm` with `text-xs md:text-sm`:
```tsx
<div className="text-xs md:text-sm text-slate-400 mt-0.5">
  couples matched
</div>
```
```tsx
<div className="text-xs md:text-sm text-slate-400 mt-0.5">
  movies to discover
</div>
```
```tsx
<div className="text-xs md:text-sm text-slate-400 mt-0.5">
  free, forever
</div>
```

Also make the stat icons smaller on mobile. Find all three icon boxes:
```tsx
<div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-500/20 flex items-center justify-center shrink-0">
```
```tsx
<div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
```
```tsx
<div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-500/20 flex items-center justify-center shrink-0">
```

Replace `w-10 h-10` with `w-7 h-7 md:w-10 md:h-10` on each:
```tsx
<div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-pink-600/15 border border-pink-500/20 flex items-center justify-center shrink-0">
```
```tsx
<div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
```
```tsx
<div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-green-600/15 border border-green-500/20 flex items-center justify-center shrink-0">
```

---

## Do NOT Change

- Any other sections or CSS files
- The tooltip on the 500+ stat

## Testing Checklist

- [ ] Mobile (375px): all 3 stats fit in a single row without wrapping
- [ ] Mobile (375px): smaller icons, numbers, and labels
- [ ] Mobile (375px): navbar logo and subtitle visibly smaller
- [ ] Desktop (1024px+): both bars look unchanged from before