# DuoReel Guidelines

> **For Figma Make:** This file is the single source of truth for all UI decisions. Before writing any component, button, badge, layout, or color — check here first. If a pattern exists in this document, use it exactly as shown. Do not improvise or introduce new styles.

## General Guidelines

- Only use absolute positioning when necessary — prefer flexbox and grid for all layouts
- Keep file sizes small; put helper functions and reusable components in their own files
- Refactor as you go — avoid duplicating logic that already exists in context or another component
- Always use `e.stopPropagation()` on interactive elements inside clickable cards
- Loading states must always be handled — use `Loader2` from lucide-react with `animate-spin`
- Never block the UI while data loads; show skeletons or spinners inline

---

## Design System Guidelines

### Color Palette

The app uses a dark slate theme throughout. Never introduce light backgrounds or bright colors outside the defined palette.

- Page background: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- Header/sticky bar: `bg-slate-900/95 backdrop-blur-sm border-b border-slate-800`
- Card background: `bg-gradient-to-b from-slate-800/50 to-slate-900/80`
- Card border: `border border-slate-700/50`, hover: `hover:border-slate-600`
- Dropdown/popover surface: `bg-slate-800 border-slate-700`
- Muted text: `text-slate-400`
- Body text: `text-slate-300`
- Headings: `text-white`
- Dividers/separators: `border-slate-700` or `border-slate-800`

### Brand Colors

- Primary brand accent (pink): `text-pink-500` / `bg-pink-600` / `hover:bg-pink-700`  
  Used for: "Duo" in the logo, CTA buttons, Match badges, primary actions on landing page
- Active tab (Discover/Saved): `bg-blue-600 text-white`
- Active tab (Matches): `bg-pink-600 text-white`
- Genre badges: `bg-purple-600/70 border-purple-500 hover:bg-purple-700`
- Save/liked state: `bg-green-500 hover:bg-green-600`
- Notification badge: `bg-red-500` with `animate-pulse`

### Typography

- App title: `text-2xl font-bold` — "**Duo**" in `text-pink-500`, "Reel" in `text-white`
- Page/section headings: `text-white font-bold`
- Movie card title: `text-2xl font-bold text-white`
- Metadata (year, runtime, director): `text-sm text-slate-300`
- Labels/captions: `text-slate-400`
- Muted/empty states: `text-slate-500 text-xs italic`
- Links and clickable text: `hover:text-blue-400 transition-colors`

---

## Component Guidelines

### Buttons

There are exactly **6** button patterns in this app. Always use one of these — never invent new variants.

**1. Primary (CTA):**

```tsx
<Button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold cursor-pointer">
  Get Started
</Button>
```

**2. Secondary/Outline (slate theme) — the default for most actions:**

```tsx
<Button
  variant="outline"
  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white cursor-pointer"
>
  Button Text
</Button>
```

**3. Ghost (text-only, minimal — for low-priority actions):**

Ghost buttons have NO background and NO border at rest. On hover, they get a subtle slate tint only — never a filled solid background.

```tsx
<Button
  variant="ghost"
  className="text-slate-400 hover:bg-slate-700/50 hover:text-white cursor-pointer"
>
  Button Text
</Button>
```

⚠️ **Never** give ghost buttons `bg-slate-800`, `border-*`, or any filled hover background like `hover:bg-slate-700`. The hover must be semi-transparent (`/50`) so the button stays visually light.

**4. Destructive/Outline (for critical negative actions like Sign Out, Disconnect):**

```tsx
<Button
  variant="outline"
  className="bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800 cursor-pointer"
>
  <LogOut className="size-4 mr-2" />
  Sign Out
</Button>
```

**5. Icon button (overlay on card):**

```tsx
<Button
  size="icon"
  variant="secondary"
  className="rounded-full bg-slate-800/90 hover:bg-slate-700 cursor-pointer"
>
  <Icon className="size-5 text-white" />
</Button>
```

**6. Saved/active icon button:**

```tsx
<Button
  size="icon"
  variant="default"
  className="rounded-full bg-green-500 hover:bg-green-600 cursor-pointer"
>
  <Bookmark className="size-5 fill-white text-white" />
</Button>
```

**Disabled / loading state** — applies to any button variant:

```tsx
<Button disabled className="... opacity-50 cursor-not-allowed">
  <Loader2 className="size-4 mr-2 animate-spin" />
  Loading...
</Button>
```

**Rules:**

- All buttons must have `cursor-pointer` (or `cursor-not-allowed` when disabled)
- Always include `transition-colors` or `transition-all` for hover states
- Never mix variants outside these 6 patterns
- Ghost buttons must never have a solid or opaque hover background

### Navigation Tabs

The bottom of the header contains a 3-tab grid nav. Max 3 tabs. Never add a 4th tab.

```tsx
<nav className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/80 border border-slate-600 rounded-lg p-1 gap-1">
```

- Inactive tab: `text-slate-200 hover:text-white hover:bg-slate-700`
- Active tab (Discover/Saved): `bg-blue-600 text-white`
- Active tab (Matches): `bg-pink-600 text-white`
- Notification badge on tab: `absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center animate-pulse`

### Movie Cards

Cards use a poster-first vertical layout with actions overlaid on the image.

- Container: `rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300`
- Poster area: `aspect-[2/3]` with `object-cover` and `group-hover:scale-105 transition-transform duration-500`
- Gradient overlay on poster: `bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90`
- Save button: top-left of poster overlay
- Dislike/Not Interested button: top-right of poster overlay
- Match badge: top-right, `bg-pink-600 text-white px-3 py-1.5 rounded-full`
- Watched badge: bottom-left, `bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-full backdrop-blur-sm`
- Rating badges: bottom-right — TMDb in `bg-blue-600/90`, IMDb in `bg-[#F5C518]` with black text
- Watched state: `opacity-60 grayscale-[30%]` on the card container
- Card body padding: `p-6 space-y-4`

### Badges / Pills

- Genre tags: `bg-purple-600/70 text-white border-purple-500 text-xs cursor-pointer hover:bg-purple-700`
- Match pill: `bg-pink-600 text-white px-3 py-1.5 rounded-full`
- Watched pill: `bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-full backdrop-blur-sm`
- Streaming provider chip: `bg-slate-700/50 px-2 py-1 rounded-md hover:bg-slate-600 transition-colors`

### Dropdowns / Popovers

- Surface: `bg-slate-800 border-slate-700 text-white`
- Menu item hover: `hover:bg-slate-700`
- Width for profile dropdown: `w-64`

### Header

The header is always sticky (`sticky top-0 z-50`) with `bg-slate-900/95 backdrop-blur-sm border-b border-slate-800`.

It contains two rows:

1. Logo + notification bell + profile avatar
2. Tab navigation

Do not modify the header structure. Add new header elements only to the right side of the logo row.

### Avatars

- Default fallback: `bg-blue-600 text-white font-semibold` with the user's first initial
- Size in header: `size-9`
- Size in dropdown: `size-11`

### Tooltips

Always use `TooltipProvider` at the layout level (already present in `AppLayout`). Tooltip surfaces: `bg-slate-800 text-white border-slate-700`.

### Empty / Loading States

- Skeleton cards: use `MovieCardSkeleton` component — do not create new skeleton patterns
- Empty state text: `text-slate-400` centered, with a relevant lucide icon above it
- Loading spinners: `<Loader2 className="size-5 animate-spin" />`

---

## Layout Guidelines

- Max content width: `max-w-7xl mx-auto px-4`
- Movie grids: responsive, typically `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Page sections: `py-8` or `py-12` vertical padding
- Spacing inside cards: `space-y-4` or `gap-4`
- Use `rounded-lg` for containers, `rounded-xl` or `rounded-2xl` for cards, `rounded-full` for pills and icon buttons

---

## Icons

Always use `lucide-react`. Icon sizes follow this convention:

- Inline with text: `size-4`
- Standalone/action: `size-5`
- Large decorative: `size-6` or `size-8`

---

## Viewport Height on Mobile

Never use `100vh` or `min-h-screen` alone for full-height layouts. Mobile browsers calculate `100vh` against the total viewport including browser chrome, causing elements to be clipped.

**Always pair `min-h-screen` with a `dvh` style override:**

```tsx
<div className="min-h-screen ..." style={{ minHeight: '100dvh' }}>
```

**For modals, use `dvh` arbitrary values instead of `vh`:**

```tsx
// ✅ correct
<DialogContent className="max-h-[90dvh] ...">

// ❌ wrong — clips on mobile browsers
<DialogContent className="max-h-[90vh] ...">
```