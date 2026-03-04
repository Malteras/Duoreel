# Feature: Add Entrance Animations to Hero Section

## Approach

Add a `fadeInUp` keyframe animation to `src/styles/theme.css`, then apply it
with staggered delays to each hero element via `style` props in
`LandingPage.tsx`. This matches the animation pattern from the original CSS
design file exactly.

Animation spec (from reference CSS):
- `fadeInUp`: fades from `opacity:0, translateY(20px)` → `opacity:1, translateY(0)`
- Duration: `0.6s ease-out` for text elements, `0.8s ease-out` for screenshot
- Fill mode: `both` (element stays hidden before animation starts)
- Stagger: badge 0s → h1 0.1s → subtext 0.2s → CTA button 0.3s → trust badges 0.4s → screenshot 0.3s

---

## Changes

### File: `src/styles/theme.css`

#### Step 1: Add fadeInUp keyframe

At the very end of the file (after the closing `}` of `@layer base`), append:

```css
/* ── Hero entrance animation ── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out both;
}
```

---

### File: `src/app/components/LandingPage.tsx`

#### Step 2: Animate the badge

Find:
```tsx
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-pink-600/10 border border-pink-500/30 text-pink-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
```

Replace with:
```tsx
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-pink-600/10 border border-pink-500/30 text-pink-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 animate-fade-in-up"
            style={{ animationDelay: '0s' }}
          >
```

#### Step 3: Animate the h1

Find:
```tsx
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
```

Replace with:
```tsx
          <h1
            className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight mb-5 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
```

#### Step 4: Animate the subtext paragraph

Find:
```tsx
          <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-md">
```

Replace with:
```tsx
          <p
            className="text-lg text-slate-400 leading-relaxed mb-8 max-w-md animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
```

#### Step 5: Animate the CTA button wrapper

Find:
```tsx
          <div className="flex flex-wrap items-center gap-4 mb-6">
```

Replace with:
```tsx
          <div
            className="flex flex-wrap items-center gap-4 mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
```

#### Step 6: Animate the trust badges

Find:
```tsx
          <div className="flex flex-wrap gap-3 mb-4">
```

Replace with:
```tsx
          <div
            className="flex flex-wrap gap-3 mb-4 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
```

#### Step 7: Animate the "Already have an account?" line

Find:
```tsx
          <p className="text-sm text-slate-400">
```

Replace with:
```tsx
          <p
            className="text-sm text-slate-400 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
```

#### Step 8: Animate the screenshot column

Find:
```tsx
        {/* Right column: app screenshot */}
        <div className="hidden md:flex items-center justify-center">
```

Replace with:
```tsx
        {/* Right column: app screenshot */}
        <div
          className="hidden md:flex items-center justify-center animate-fade-in-up"
          style={{ animation: 'fadeInUp 0.8s ease-out 0.3s both' }}
        >
```

---

## Impact Assessment

- Low risk — only adds a CSS class and `style` props
- `theme.css` addition is scoped to a new class, won't affect any existing styles
- `animation: ... both` means elements are invisible until their animation fires — correct behaviour on page load
- No TypeScript changes, no import changes

---

## Testing Checklist

- [ ] On fresh page load, hero elements animate in one by one from bottom
- [ ] Badge appears first, then h1, then subtext, then button, then trust badges, then sign-in line
- [ ] Screenshot fades in slightly after the text starts (0.3s delay, 0.8s duration)
- [ ] Stagger is subtle and smooth — not jarring
- [ ] On page reload, animations replay correctly
- [ ] No flash of invisible content (FOIC) — `both` fill mode keeps elements hidden before delay fires
- [ ] Animations do not interfere with hover effects on the screenshot
- [ ] No layout shift during animation

## Summary Table

| Element | Delay | Duration |
|---------|-------|----------|
| Badge | 0s | 0.6s |
| H1 headline | 0.1s | 0.6s |
| Subtext | 0.2s | 0.6s |
| CTA button | 0.3s | 0.6s |
| Trust badges | 0.4s | 0.6s |
| Sign in line | 0.5s | 0.6s |
| Screenshot | 0.3s | 0.8s |