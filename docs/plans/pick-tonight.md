# Plan: Pick Tonight

> Source PRD: `docs/prds/pick-tonight.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **No backend changes.** No new KV entries, API endpoints, or notification types. Entirely client-side.
- **No new data fetching.** Keywords already exist on matched movie objects from the TMDB enrichment pipeline (`append_to_response=keywords`). Matched movies stored in KV are raw search results, but `useEnrichMovies` already runs in MatchesTab and populates keywords.
- **No persistence.** Session state (excluded picks, selected keyword) lives in React state and resets on exit.
- **Reuses MovieDetailModal.** The shared modal opens after a pick — no special variant. All standard actions (Watched, Remove, etc.) work as-is.
- **Entry points:** Mobile FAB (pink-to-purple gradient, below existing Filters FAB) + desktop header button. Both gated on `matchedMovies.length >= 3`.
- **Overlay pattern:** Pick Tonight renders as a full-screen overlay within MatchesTab, toggled by local state. Back button returns to normal Matches view.

---

## Phase 1: Keyword Cloud + Entry Points

**User stories**: 3, 4, 5, 14, 15, 16, 17, 20

### What to build

Add the "Pick Tonight" entry point to MatchesTab — a FAB on mobile (pink-to-purple gradient, stacked below the existing Filters FAB) and a header button on desktop. Both only render when there are 3+ matches.

Tapping the entry point opens a full-screen overlay (PickTonightScreen) with a back button and a keyword cloud. The keyword cloud aggregates all TMDB keywords across the current matched movies, filters to keywords appearing on 2+ movies, and displays the top 10-15 as tappable chips. Single-select: tap to filter the pool, tap again to deselect. A pool count indicator shows how many movies remain after filtering. No keyword selected = full pool.

The keyword aggregation logic should be extracted as a pure function for testability.

### Acceptance criteria

- [ ] Mobile: pink-to-purple gradient FAB appears below the Filters FAB on the Matches tab when 3+ matches exist
- [ ] Desktop: "Pick Tonight" button appears in the Matches tab header area when 3+ matches exist
- [ ] Neither entry point renders when fewer than 3 matches
- [ ] Tapping the entry point opens a full-screen overlay with a back button
- [ ] Back button returns to the normal Matches tab view
- [ ] Keyword cloud shows keywords that appear on 2+ matched movies, sorted by frequency, capped at top 15
- [ ] Tapping a keyword filters the pool; tapping again deselects it
- [ ] Pool count updates to reflect the filtered set
- [ ] With no keyword selected, the full pool is shown
- [ ] Keyword aggregation handles movies that have no keywords (skips them gracefully)

---

## Phase 2: Slot Machine Reel + Core Flow

**User stories**: 1, 2, 6, 7, 8, 9, 10, 18, 19

### What to build

Add the SlotMachineReel component to the PickTonightScreen below the keyword cloud. A prominent spin button triggers the reel. The reel renders a vertical column of movie posters that scrolls rapidly for ~5 seconds with smooth deceleration in the final ~1.5 seconds, landing on a randomly selected movie from the current pool.

When the reel lands, the parent calls `openMovie()` to show the standard MovieDetailModal with full info, trailer, and streaming availability. All standard modal actions (Watched, Remove, etc.) work normally. Dismissing the modal returns to the picker screen, ready for another spin.

The reel creates the illusion of a long continuous strip by repeating/cycling posters during the spin. The visible window shows ~3 posters at a time.

### Acceptance criteria

- [ ] Spin button is prominent and centered below the reel
- [ ] Reel spins vertically through movie posters for ~5 seconds with deceleration
- [ ] Reel lands on a randomly selected movie from the current (possibly keyword-filtered) pool
- [ ] MovieDetailModal opens automatically after the reel lands, showing full movie info
- [ ] All standard modal actions (Watched, Remove, Like/Unlike) work normally
- [ ] Dismissing the modal returns to the picker — user can spin again
- [ ] Spinning with no keyword selected picks from all matches
- [ ] Spinning with a keyword selected picks only from the filtered subset
- [ ] Poster cycling creates a smooth continuous reel illusion (no visual gaps or jumps)
- [ ] Spin button is disabled while the reel is spinning

---

## Phase 3: Session State + Edge Cases

**User stories**: 11, 12, 13, 21

### What to build

Add session-level exclusion tracking: after the reel lands on a movie and the modal is dismissed, that movie is excluded from subsequent spins within the same session. When all movies in the current pool have been picked, display a clear "all picked" message with a reset button that restores the full pool (respecting the current keyword filter). Exiting Pick Tonight and re-entering resets the session.

Handle the small-pool edge case (3-5 movies) so the reel animation still looks convincing — posters repeat enough times to fill the spin duration without obvious short-cycling.

### Acceptance criteria

- [ ] After a pick, that movie does not appear in subsequent spins during the same session
- [ ] When all movies in the current pool have been picked, a clear message is shown (e.g., "You've spun through all matches!")
- [ ] A reset button appears when the pool is exhausted, restoring all movies (under the current keyword filter)
- [ ] Changing the keyword filter resets the exclusion set for that new filtered pool
- [ ] Exiting and re-entering Pick Tonight resets all session state
- [ ] With exactly 3 movies, the reel animation still looks smooth (sufficient poster repetition)
- [ ] With 4-5 movies, no visual artifacts from the small pool size
- [ ] Pool count indicator reflects remaining un-picked movies
