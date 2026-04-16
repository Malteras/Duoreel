# Pick Tonight — PRD

## Problem Statement

When two connected partners accumulate a large number of matched movies (20, 50, 100+), the Matches tab becomes its own decision paralysis problem. Both partners already agreed these are movies they want to watch, but staring at a long list and trying to pick one for tonight is surprisingly hard. The current Matches tab is a browse-only view with no tools to help narrow down or make a final decision.

## Solution

A "Pick Tonight" mode accessible from the Matches tab that helps a single user quickly decide what to watch. It combines two mechanisms:

1. **Keyword cloud** — Aggregates TMDB keywords (e.g., "heist", "space war", "coming of age") across all matched movies and displays the most common ones as tappable filter chips. This lets the user narrow by mood/theme without needing predefined mood categories.

2. **Slot machine reel** — A vertical-scrolling poster reel that spins for ~5 seconds with deceleration, landing on a random movie from the current pool. On landing, the standard movie detail modal opens showing full info and streaming availability. Previous picks are excluded from subsequent spins within the same session.

The feature is a solo decision tool — one partner uses it independently, no real-time collaboration or new notification types required.

## User Stories

1. As a user with many matches, I want a way to randomly pick a movie from my matches, so that I don't spend 20 minutes debating what to watch.
2. As a user, I want to filter my matches by keyword/theme before picking randomly, so that the random pick matches my current mood.
3. As a user, I want to see which keywords are most common across my matches, so that I can discover themes I didn't realize ran through our shared taste.
4. As a user, I want the keyword cloud to only show relevant keywords (appearing on 2+ matches), so that the cloud is useful rather than noisy.
5. As a user, I want to tap a single keyword to filter, and tap again to deselect, so that narrowing is quick and reversible.
6. As a user, I want the slot machine to spin through movie posters vertically with a satisfying deceleration, so that the random pick feels exciting rather than clinical.
7. As a user, I want the spin to take about 5 seconds with a slow deceleration at the end, so that there's dramatic tension before the reveal.
8. As a user, I want the movie detail modal to open after the reel lands, so that I can immediately see the trailer, overview, and streaming availability.
9. As a user, I want the standard modal actions (Watched, Remove, etc.) to work normally after a pick, so that I can act on my decision without leaving the flow.
10. As a user, I want to dismiss the modal and spin again, so that I can reject a pick and try another one.
11. As a user, I want previous picks to be excluded from subsequent spins in the same session, so that I don't get the same movie twice.
12. As a user, I want a clear message when I've spun through all available movies, so that I know I need to reset or change my keyword filter.
13. As a user, I want a reset button to restore the full pool after exhausting picks, so that I can start over if needed.
14. As a user on mobile, I want to enter Pick Tonight via a floating action button on the Matches tab, so that it's always within thumb reach.
15. As a user on mobile, I want the Pick Tonight FAB to be visually distinct from the existing Filters FAB, so that I can tell them apart at a glance.
16. As a user on desktop, I want to enter Pick Tonight via a button in the Matches tab header, so that it fits the desktop layout conventions.
17. As a user with fewer than 3 matches, I should not see the Pick Tonight entry point, so that the feature only appears when it's actually useful.
18. As a user, I want Pick Tonight to open as a full-screen overlay/mode, so that the experience feels focused and separate from browsing.
19. As a user, I want a back button to return to the normal Matches tab, so that I can exit Pick Tonight at any time.
20. As a user, I want to spin without selecting any keyword first, so that I can get a fully random pick across all matches when I have no mood preference.
21. As a user, I want the slot machine to handle small pools gracefully (3-5 movies), so that the animation still looks good with limited content.

## Implementation Decisions

### Modules

**KeywordCloud (new component)**
- Accepts an array of movies, aggregates their `keywords` arrays, counts frequency per keyword
- Filters to keywords with 2+ occurrences, displays top 10-15 by frequency
- Single-select behavior: tap to filter, tap again to deselect
- Pure client-side — no API calls, no backend changes
- Keywords are already available on movie objects via TMDB `append_to_response=keywords`

**SlotMachineReel (new component)**
- Accepts an array of movie poster URLs, a `spinning` boolean, and an `onLanded(movie)` callback
- Renders a vertical column of movie posters
- Animation: ~5 seconds total, smooth deceleration in the final ~1.5 seconds using CSS animations or requestAnimationFrame with easing
- Must handle edge case of exactly 3 posters (the minimum pool size)
- Posters cycle/repeat during the spin to create the illusion of a long reel

**PickTonightScreen (new component)**
- Full-screen overlay composing KeywordCloud + SlotMachineReel + spin button + back button
- Manages local state: selected keyword, filtered movie pool, excluded pick IDs, spin trigger
- When reel lands, calls parent's `openMovie()` to show the standard MovieDetailModal
- On modal dismiss, the excluded set grows by one; user can spin again
- When pool is exhausted, shows a message with reset option
- No persistent state — all session state is local React state, lost on exit

**MatchesTab (modify existing)**
- Add "Pick Tonight" entry point: FAB on mobile (`md:hidden`), header button on desktop (`hidden md:block`)
- FAB uses pink-to-purple gradient to distinguish from existing slate Filters FAB
- Both FABs stack vertically in the bottom-right on mobile (Filters above, Pick Tonight below)
- Entry point only renders when `matchedMovies.length >= 3`
- Toggle `showPickTonight` state to render PickTonightScreen as an overlay

### Architecture Decisions

- **No backend changes.** No new KV entries, API endpoints, or notification types. Entirely client-side.
- **No new data fetching.** Keywords already exist on matched movie objects from the existing TMDB enrichment pipeline.
- **No persistence.** Session state (excluded picks, selected keyword) lives in React state and resets when the user exits. No history tracking.
- **Reuses existing MovieDetailModal.** The modal that opens after a pick is the same shared modal used across all tabs — no special variant needed.

### UI/Design Decisions

- Mobile entry: FAB with star icon, pink-to-purple gradient, positioned below the existing Filters FAB
- Desktop entry: Header button in the Matches tab toolbar area
- Keyword chips: Styled similarly to existing TMDB keyword tags (grey/slate badges) but larger and tappable, with a selected state (pink/highlighted)
- Slot machine: Vertical poster reel, centered on screen, with a visible "window" showing ~3 posters at a time during spin
- Spin button: Prominent, centered below the reel

## Testing Decisions

Good tests for this feature verify external behavior (what the user sees and interacts with), not implementation details (animation frame counts, internal state shape).

**KeywordCloud aggregation logic** — The frequency counting, deduplication, minimum threshold filtering, and top-N selection should be tested. This is the most logic-dense piece and is easily testable as a pure function: given an array of movies with keywords, return the ranked keyword list.

**SlotMachineReel** — Animation is hard to unit test meaningfully. Manual/visual testing is more appropriate. The `onLanded` callback firing with the correct movie after animation completes could be tested.

**PickTonightScreen exclusion logic** — Verify that after a pick, the movie is excluded from the next spin's pool, and that the pool exhaustion message appears when all movies have been picked.

No prior test art exists in this codebase (no test files found), so these would be the first tests if written.

## Out of Scope

- **Collaborative/real-time picking** — Both partners picking together simultaneously. This would require WebSocket/real-time infrastructure that doesn't exist.
- **Session persistence** — Saving pick history, "tonight pick" records, or past sessions in KV.
- **Mood categories** — Predefined mood-to-genre mappings ("Something light", "Edge of my seat"). Keywords replace this need.
- **Genre/decade/platform filters on the picker** — The keyword cloud is sufficient for narrowing. Full filter parity with the Saved tab is not needed given the smaller list size.
- **Push notifications** — No "partner started a session" notifications or async flows.
- **Celebration/confetti screen** — The standard detail modal is the reveal. No custom winner UI.
- **Desktop-specific layout** — The picker screen is identical on both viewports; only the entry point differs (FAB vs header button).

## Further Notes

- The original Linear issue HOM-78 was scoped as an async "Tonight's Session" with curator/picker roles and notifications. This PRD replaces that scope entirely — the core problem turned out to be decision paralysis on an existing list, not async curation between partners.
- The keyword cloud approach was chosen over a hardcoded mood picker because the data already exists on every movie. TMDB keywords are richer and more specific than genre categories, and require zero manual mapping maintenance.
- The slot machine animation (~5s with deceleration) is the most time-intensive piece to build. A simpler "just open a random modal" would be functionally equivalent but less engaging.
- If the Matches list grows very large (hundreds), the keyword frequency aggregation should remain performant since it's a single O(n*k) pass where k is keywords per movie (typically 5-15).
