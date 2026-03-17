# Components — Claude Code Context

## The Three-Tab Rule (CRITICAL)

Every change to a shared surface MUST be applied in all three tabs.

| Surface      | Discover        | Saved                | Matches          |
| ------------ | --------------- | -------------------- | ---------------- |
| Large card   | `MoviesTab.tsx` | `SavedMoviesTab.tsx` | `MatchesTab.tsx` |
| Compact card | `MoviesTab.tsx` | `SavedMoviesTab.tsx` | `MatchesTab.tsx` |
| Modal        | `MoviesTab.tsx` | `SavedMoviesTab.tsx` | `MatchesTab.tsx` |

`MovieDetailModal` is a single shared component — it does NOT auto-propagate.
Changing its props or behaviour requires explicit wiring in all three tab files.

## Card Scope

- `MovieCard.tsx` — large grid card (all three tabs)
- `CompactMovieCard.tsx` — compact list card (all three tabs)
- `MovieDetailModal.tsx` — preview modal (all three tabs)
- `MovieCardSkeleton.tsx` — loading state; use this, never invent new skeletons

Never duplicate card JSX across tabs. Extract into a component.

## Intentional Per-Tab Prop Differences (do NOT flatten)

| Prop              | Discover    | Saved (My List)  | Saved (Partner's) | Matches        |
| ----------------- | ----------- | ---------------- | ----------------- | -------------- |
| `isMatch`         | ❌          | ❌               | ❌                | ✅ always true |
| `onNotInterested` | ✅          | ❌ already saved | ❌                | ❌             |
| `isWatched`       | ✅          | ✅               | ✅ own history    | ✅             |
| `imdbRating`      | ✅ from Map | ✅ from Map      | ✅ from Map       | ✅ from Map    |

## Shell / Layout

- `AppLayout.tsx` — sticky header, tab nav, NotificationBell, ImportProvider wrapper.
  Do not restructure the header. New header elements go right-side of the logo row only.
- `UserInteractionsContext.tsx` — global source of truth for watched/liked/partner IDs.
  Do not bypass it with local state for interaction data.
- `ImportContext.tsx` + `ImportDialog.tsx` + `MinimizedImportWidget.tsx` — import state
  lives here, NOT in ProfilePage. Widgets render from AppLayout so they survive navigation.

## Auth Components

- `AuthContext.tsx` (in `../context/`) — PKCE flow. flowType must stay 'pkce'. Do not
  change storageKey or detectSessionInUrl. See `../../google-signin-docs.md` for why.
- `AuthPage.tsx` / `AuthScreen.tsx` — UI only. Auth logic stays in AuthContext.

## UI Components (`ui/` subfolder)

shadcn/ui primitives. Do not modify these files directly — they are vendored.
Use them as-is via imports.

## Design Rules

Source of truth: `../../../../guidelines/Guidelines.md`

Quick reminders:

- Muted text: `text-slate-400` (NOT `text-slate-500` — fails WCAG AA)
- Ghost buttons: hover must use `/50` opacity, never solid fill
- Mobile height: `max-h-[90dvh]` not `max-h-[90vh]`
- Conditional render numbers: ternary not `&&` (avoids rendering "0")
- All interactive elements: `cursor-pointer`
