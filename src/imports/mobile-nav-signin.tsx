# Fix: Always Show Sign In Button on Mobile Navbar

## Problem

The entire `<nav>` is `hidden md:flex`, so mobile users have no way to sign in or navigate from the navbar.

## Change

### File: `src/app/components/LandingPage.tsx`

Find:
```tsx
{/* Navigation Links */}
<nav className="hidden md:flex items-center gap-8">
  <a
    href="#how-it-works"
    className="text-slate-300 hover:text-white transition-colors"
  >
    How It Works
  </a>
  <a
    href="#why-duoreel"
    className="text-slate-300 hover:text-white transition-colors"
  >
    Why DuoReel
  </a>
  <a
    href="#features"
    className="text-slate-300 hover:text-white transition-colors"
  >
    Features
  </a>
  <Button
    onClick={onGetStarted}
    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold cursor-pointer"
  >
    Get Started
  </Button>
</nav>
```

Replace with:
```tsx
{/* Navigation Links — desktop only */}
<nav className="hidden md:flex items-center gap-8">
  <a
    href="#how-it-works"
    className="text-slate-300 hover:text-white transition-colors cursor-pointer"
  >
    How It Works
  </a>
  <a
    href="#why-duoreel"
    className="text-slate-300 hover:text-white transition-colors cursor-pointer"
  >
    Why DuoReel
  </a>
  <a
    href="#features"
    className="text-slate-300 hover:text-white transition-colors cursor-pointer"
  >
    Features
  </a>
  <Button
    onClick={onGetStarted}
    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold cursor-pointer"
  >
    Sign In
  </Button>
</nav>

{/* Mobile — always visible Sign In button */}
<button
  onClick={onGetStarted}
  className="md:hidden bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors"
>
  Sign In
</button>
```

## Do NOT Change

- Logo or subtitle
- Any other section
- Desktop nav links

## Testing Checklist

- [ ] At 375px: "Sign In" button visible in top-right of navbar
- [ ] At 375px: nav links (How It Works etc.) still hidden
- [ ] At 768px+: desktop nav with "Sign In" shows as before
- [ ] Button navigates to login on click