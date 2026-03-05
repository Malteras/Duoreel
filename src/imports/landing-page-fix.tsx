# Fix: Letterboxd Import Bullet Points — Broken Text Layout

## Problem

The three bullet points use fragmented JSX with `{" "}` spacers and multiple inline `<span>` elements, causing text to wrap incorrectly and look broken at smaller widths.

## Change

### File: `src/app/components/LandingPage.tsx`

Find:
```tsx
<ul className="text-slate-400 text-sm leading-relaxed space-y-2">
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    Import your{" "}
    <span className="text-slate-300">
      watchlist
    </span>{" "}
    to add movies to your DuoReel{" "}
    <span className="text-slate-300">Saved</span>{" "}
    list.
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    Import your{" "}
    <span className="text-slate-300">
      watched movies
    </span>{" "}
    to filter them out of the{" "}
    <span className="text-slate-300">
      Discover
    </span>{" "}
    feed.
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    Connect via your{" "}
    <span className="text-slate-300">
      Letterboxd RSS URL
    </span>{" "}
    — review movie on Letterboxd and it is
    <span className="text-slate-300">
      automatically marked as watched
    </span>
    on DuoReel.
  </li>
</ul>
```

Replace with:
```tsx
<ul className="text-slate-400 text-sm leading-relaxed space-y-2">
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    <span>Import your <span className="text-slate-300">watchlist</span> to add movies to your DuoReel <span className="text-slate-300">Saved</span> list.</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    <span>Import your <span className="text-slate-300">watched movies</span> to filter them out of the <span className="text-slate-300">Discover</span> feed.</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1.5 size-1.5 rounded-full bg-pink-500 flex-shrink-0" />
    <span>Connect via your <span className="text-slate-300">Letterboxd RSS URL</span> — review a movie on Letterboxd and it's <span className="text-slate-300">automatically marked as watched</span> on DuoReel.</span>
  </li>
</ul>
```

## Do NOT Change

- Anything outside this `<ul>` block
- Any CSS files

## Testing Checklist

- [ ] All three bullet points render as clean single lines of flowing text
- [ ] Bold/highlighted words still appear in `text-slate-300`
- [ ] No broken wrapping or misaligned text