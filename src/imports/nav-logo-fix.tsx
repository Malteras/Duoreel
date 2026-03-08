# Fix: Show Heart Logo + DuoReel Text + Tagline on ALL Screen Sizes, ALL Pages

## Problem

The nav logo looks inconsistent across the app:
- **LandingPage**: Shows heart icon + "DuoReel" + tagline on desktop, but tagline may be missing on mobile
- **AppLayout (inner app)**: Uses the wrong logo asset (`duoReelLogo` — the plain logo, not the heart), and the tagline is hidden on mobile (`hidden md:block`)

The correct look everywhere is: **heart icon (`duoReelMatchHeart`) + "DuoReel" text + "Find movies you both love" tagline — visible on ALL screen sizes**.

## Changes

---

### File 1: `src/app/components/AppLayout.tsx`

#### Step 1: Add the heart logo import

Find:
```tsx
import duoReelLogo from 'figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png';
```

Replace with:
```tsx
import duoReelLogo from 'figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png';
import duoReelMatchHeart from 'figma:asset/1de8a8f1f163270e2734dea06481c2638f51aedc.png';
```

#### Step 2: Fix the logo block — use heart asset and show tagline on all screen sizes

Find:
```tsx
              <button
                type="button"
                onClick={handleLogoClick}
                className="flex items-center gap-3 cursor-pointer text-left"
                aria-label="Go to Discover"
              >
                <img src={duoReelLogo} alt="DuoReel" className="h-10 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    <span className="text-pink-500">Duo</span>Reel
                  </h1>
                  <p className="hidden md:block text-sm text-slate-400">Find movies you both love</p>
                </div>
              </button>
```

Replace with:
```tsx
              <button
                type="button"
                onClick={handleLogoClick}
                className="flex items-center gap-3 cursor-pointer text-left"
                aria-label="Go to Discover"
              >
                <img src={duoReelMatchHeart} alt="DuoReel" className="h-8 md:h-10 w-auto" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-white">
                    <span className="text-pink-500">Duo</span>Reel
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400">Find movies you both love</p>
                </div>
              </button>
```

---

### File 2: `src/app/components/LandingPage.tsx`

#### Step 1: Ensure tagline is visible on all screen sizes

Find:
```tsx
            {/* Logo */}
            <div className="flex items-center gap-3">
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
            </div>
```

Replace with:
```tsx
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={duoReelMatchHeart}
                alt="DuoReel"
                className="h-8 md:h-10 w-auto"
              />
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white">
                  <span className="text-pink-400">Duo</span>Reel
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  Find movies you both love
                </p>
              </div>
            </div>
```

---

## Testing Checklist

- [ ] Landing page mobile: heart icon + "DuoReel" + "Find movies you both love" all visible
- [ ] Landing page desktop: heart icon + "DuoReel" + "Find movies you both love" all visible
- [ ] Inner app mobile (AppLayout): heart icon + "DuoReel" + "Find movies you both love" all visible
- [ ] Inner app desktop (AppLayout): heart icon + "DuoReel" + "Find movies you both love" all visible
- [ ] AppLayout no longer shows the plain `duoReelLogo` asset, shows heart instead
- [ ] Clicking logo in AppLayout still navigates to Discover tab

## Summary Table

| Where | Before | After |
|-------|--------|-------|
| LandingPage tagline | Visible on all sizes (no change needed) | Visible on all sizes ✓ |
| AppLayout logo asset | `duoReelLogo` (plain logo) | `duoReelMatchHeart` (heart icon) |
| AppLayout tagline | `hidden md:block` (hidden on mobile) | Visible on all sizes |