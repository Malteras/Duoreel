# Graph Report - .  (2026-04-07)

## Corpus Check
- 173 files · ~286,964 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 539 nodes · 686 edges · 82 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Click-to-Filter by TMDB Keywords + Advanced Filters UI` - 10 edges
2. `useEnrichMovies.ts (IMDb + Streaming Enrichment)` - 9 edges
3. `client()` - 8 edges
4. `TMDB Keywords in MovieDetailModal (add-tmdb-keywords spec)` - 8 edges
5. `Click-to-Filter by TMDB Keywords (click-to-filter-keywords spec)` - 8 edges
6. `MovieDetailModal.tsx (Shared Modal)` - 7 edges
7. `server/index.tsx (Edge Function â€” All Server Logic)` - 6 edges
8. `Feature: Movie Trailers in Preview Modal` - 6 edges
9. `Fix: PWA Install Prompt Not Working` - 6 edges
10. `supabase/functions/server/index.tsx â€” Edge Function Backend` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Components CLAUDE: Three-Tab Rule (Critical)` --semantically_similar_to--> `Rule: MovieDetailModal Must Be Wired in All Three Tabs`  [INFERRED] [semantically similar]
  src/app/components/CLAUDE.md → CLAUDE.md
- `Hooks CLAUDE: useEnrichMovies is the Only Enrichment Path` --semantically_similar_to--> `Rule: useEnrichMovies is the Only Enrichment Path`  [INFERRED] [semantically similar]
  src/app/hooks/CLAUDE.md → CLAUDE.md
- `OMDb Rate Limits & Throttling (5 concurrent, 1200ms delay)` --semantically_similar_to--> `Gotcha: OMDb Rate Limits (1000/day)`  [INFERRED] [semantically similar]
  DUOREEL_ARCHITECTURE.md → CLAUDE.md
- `Design System: Color Palette (Dark Slate Theme)` --semantically_similar_to--> `Guidelines: Color Palette`  [INFERRED] [semantically similar]
  DESIGN_SYSTEM.md → guidelines/Guidelines.md
- `Design System: 6 Button Patterns` --semantically_similar_to--> `Guidelines: 6 Button Patterns`  [INFERRED] [semantically similar]
  DESIGN_SYSTEM.md → guidelines/Guidelines.md

## Hyperedges (group relationships)
- **Three-Tab Shared Modal Pattern (Discover + Saved + Matches all wire MovieDetailModal)** — claude_component_moviestab, claude_component_savedmoviestab, claude_component_matchestab, claude_component_moviedetailmodal [EXTRACTED 1.00]
- **Movie Enrichment Pipeline (useEnrichMovies + TMDB + OMDb + KV Cache)** — claude_hook_useenrichmovies, claude_stack_tmdb, claude_stack_omdb, claude_server_kvpaginatedtsx [INFERRED 0.85]
- **TMDB Keyword Display + Click-to-Filter Feature (modal + filters + server)** — import_tmdb_keywords, import_click_filter_keywords, claude_component_moviedetailmodal, claude_util_filtersts, claude_server_indextsx [EXTRACTED 1.00]
- **Keyword Filter: Filters Interface + Server Param + Modal Click Handler** — filters_ts, server_index_tsx, movie_detail_modal_tsx, movies_tab_tsx, advanced_filters_modal_tsx [EXTRACTED 0.95]
- **PWA Setup: manifest.json + index.html + main.tsx service worker registration** — manifest_json, index_html, main_tsx [EXTRACTED 0.95]
- **Trailer Data: movie.ts type + server append_to_response + useEnrichMovies + MovieDetailModal** — movie_ts, server_index_tsx, use_enrich_movies_ts, movie_detail_modal_tsx [EXTRACTED 0.95]

## Communities

### Community 0 - "Movie Cards & Badges"
Cohesion: 0.03
Nodes (2): getRegionProviders(), getUserCountryCode()

### Community 1 - "App Shell & Navigation"
Cohesion: 0.06
Nodes (2): parseCSV(), parseRow()

### Community 2 - "UI Component Library (shadcn)"
Cohesion: 0.04
Nodes (0): 

### Community 3 - "Import Specs & Architecture Docs"
Cohesion: 0.06
Nodes (40): AdvancedFiltersModal.tsx â€” Advanced Filters Modal, api.ts â€” Base URL Construction + Fetch Helpers, AppLayout.tsx â€” App Shell + Navigation Context, Cross-Tab Filter Navigation Pattern, Enrichment Filter Bug â€” Genre+Director Gate Skips Keywords, Keyword-Based Movie Filter via TMDB with_keywords, PWA Setup â€” Manifest + Service Worker + Icons, Trailer Data Flow â€” TMDB videos append_to_response to Modal (+32 more)

### Community 4 - "Advanced Filters Modal"
Cohesion: 0.06
Nodes (6): CarouselNext(), useCarousel(), FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 5 - "Alert Dialog Components"
Cohesion: 0.07
Nodes (3): handleLetterboxdConnect(), handleLetterboxdReset(), handleLetterboxdSync()

### Community 6 - "Three-Tab Architecture Rules"
Cohesion: 0.11
Nodes (28): Three Main Tabs: Discover, Saved, Matches, AppLayout.tsx (App Shell), CompactMovieCard.tsx (Small Card), MatchesTab.tsx (Matches Tab), MovieDetailModal.tsx (Shared Modal), MoviesTab.tsx (Discover Tab), SavedMoviesTab.tsx (Saved Tab), useEnrichMovies.ts (IMDb + Streaming Enrichment) (+20 more)

### Community 7 - "Sheet & Separator Components"
Cohesion: 0.1
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 8 - "Avatar & Dropdown Menu"
Cohesion: 0.11
Nodes (2): handleNotificationClick(), markAsRead()

### Community 9 - "API Endpoints & KV Architecture"
Cohesion: 0.18
Nodes (14): API Endpoints: Auth, API Endpoints: Movies, API Endpoints: Notifications, API Endpoints: Partner, KV Store API (kv_store.tsx + kv_paginated.tsx), Frontend Pattern: 30s Polling (notifications, match count), Gotcha: kv.mget URL-Too-Long Bug, Gotcha: Supabase 1000-Row Limit (+6 more)

### Community 10 - "Visual Assets & Screenshots"
Cohesion: 0.22
Nodes (13): Desktop Discover Tab Screenshot â€” Movie Grid (Goodfellas, Wolf of Wall Street, etc.), Desktop Matches Tab Screenshot â€” Matched Movies Grid, DuoReel Full Logo with Wordmark (pink heart + film strip), DuoReel Logo (heart + film strip, transparent background), Mobile MovieDetailModal Screenshot â€” Grand Budapest Hotel, SpongeBob 'Two Hours Later' Meme Image, PWA App Icon 192px, PWA App Icon 512px (+5 more)

### Community 11 - "IMDb Ratings Enrichment"
Cohesion: 0.27
Nodes (9): emitRatingUpdate(), fetchAndStoreRating(), fetchMissingRatings(), getTtl(), prioritizeMovies(), readLocalImdbCache(), readRawLocalCache(), writeBulkLocalImdbCache() (+1 more)

### Community 12 - "KV Store Core"
Cohesion: 0.42
Nodes (8): client(), del(), get(), getByPrefix(), mdel(), mget(), mset(), set()

### Community 13 - "Breadcrumb Components"
Cohesion: 0.29
Nodes (0): 

### Community 14 - "Context Menu Components"
Cohesion: 0.29
Nodes (0): 

### Community 15 - "Design System Tokens"
Cohesion: 0.29
Nodes (7): Design System: 6 Button Patterns, Design System: Color Palette (Dark Slate Theme), Design System: Mobile Viewport Height (dvh), Guidelines: 6 Button Patterns, Guidelines: Color Palette, Guidelines.md (UI Design System Source of Truth), Guidelines: Mobile Viewport Height (dvh over vh)

### Community 16 - "Landing Page Features"
Cohesion: 0.33
Nodes (7): Fix: Unify All Pink CTA Buttons to Match Hero Button Style, Feature: Add Entrance Animations to Hero Section, LandingPage.tsx â€” Marketing/Onboarding Page, Rationale: Use Inline Style Transitions for Why DuoReel Section, Refactor: Features Section in LandingPage, theme.css â€” Design Tokens + Animation Classes, Improve: Why DuoReel Chat Animation â€” Slower Pacing + Coordinated Reveal

### Community 17 - "Drawer Components"
Cohesion: 0.33
Nodes (0): 

### Community 18 - "KV Paginated Queries"
Cohesion: 0.7
Nodes (4): client(), getByPrefixPaginated(), getByPrefixPaginatedWithKeys(), getKeysByPrefixPaginated()

### Community 19 - "Chat Animation & Landing"
Cohesion: 0.5
Nodes (5): LandingPage.tsx (Marketing/Onboarding), Chat Animation: whyDuoReelVisible State + IntersectionObserver, Chat Animation: Without (5.3s) then With DuoReel (starts 5.9s), Why DuoReel Chat Animation (slower pacing + coordinated reveal), Landing Page Assets (app-screenshot, og-image)

### Community 20 - "Collapsible Components"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Optimistic UI & Interactions"
Cohesion: 0.67
Nodes (3): Frontend Pattern: Optimistic UI, UserInteractionsContext.tsx (Global State), UserInteractionsContext Global State (watchedMovieIds, likedMovies, partnerWatchedIds)

### Community 22 - "Auth Context & Supabase"
Cohesion: 0.67
Nodes (3): Supabase Backend (KV + Edge Functions + Auth), AuthContext.tsx (PKCE OAuth Flow), AuthContext PKCE Config Rules (flowType, detectSessionInUrl)

### Community 23 - "Section Preview Skeleton"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Image Fallback Component"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Keyword Search Filter"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Profile Page Loading"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "OMDb Rate Limits"
Cohesion: 1.0
Nodes (2): OMDb Rate Limits & Throttling (5 concurrent, 1200ms delay), Gotcha: OMDb Rate Limits (1000/day)

### Community 28 - "Stack & App Description"
Cohesion: 1.0
Nodes (2): Vite/React/TypeScript/Tailwind Stack, Movie Discovery App (README)

### Community 29 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Misc Component 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Misc Component 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Misc Component 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Misc Component 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Misc Component 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Misc Component 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Misc Component 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Misc Component 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Misc Component 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Misc Component 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Misc Component 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Misc Component 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Misc Component 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Misc Component 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Misc Component 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Misc Component 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Misc Component 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Misc Component 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Misc Component 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Misc Component 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Misc Component 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Misc Component 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Misc Component 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Misc Component 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Misc Component 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Misc Component 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Misc Component 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Misc Component 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Misc Component 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Misc Component 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Misc Component 60"
Cohesion: 1.0
Nodes (1): shadcn/ui Attribution

### Community 61 - "Misc Component 61"
Cohesion: 1.0
Nodes (1): Unsplash Photo Attribution

### Community 62 - "Misc Component 62"
Cohesion: 1.0
Nodes (1): Letterboxd RSS Sync

### Community 63 - "Misc Component 63"
Cohesion: 1.0
Nodes (1): Vercel Hosting (SPA Rewrites)

### Community 64 - "Misc Component 64"
Cohesion: 1.0
Nodes (1): MovieCard.tsx (Large Card)

### Community 65 - "Misc Component 65"
Cohesion: 1.0
Nodes (1): ProfilePage.tsx (User Profile)

### Community 66 - "Misc Component 66"
Cohesion: 1.0
Nodes (1): useWatchedActions.ts (Watched State)

### Community 67 - "Misc Component 67"
Cohesion: 1.0
Nodes (1): useMovieModal.ts (Modal State)

### Community 68 - "Misc Component 68"
Cohesion: 1.0
Nodes (1): useCSVImport.ts (Letterboxd CSV Import)

### Community 69 - "Misc Component 69"
Cohesion: 1.0
Nodes (1): theme.css (Design Tokens + Animation Classes)

### Community 70 - "Misc Component 70"
Cohesion: 1.0
Nodes (1): Rule: No Copy-Paste JSX Across Tabs

### Community 71 - "Misc Component 71"
Cohesion: 1.0
Nodes (1): Rule: Surgical Changes Only

### Community 72 - "Misc Component 72"
Cohesion: 1.0
Nodes (1): Design System: Brand Colors (Pink Accent)

### Community 73 - "Misc Component 73"
Cohesion: 1.0
Nodes (1): Design System: Typography

### Community 74 - "Misc Component 74"
Cohesion: 1.0
Nodes (1): Design System: Navigation Tabs (3-Tab Grid)

### Community 75 - "Misc Component 75"
Cohesion: 1.0
Nodes (1): Design System: Movie Card Layout

### Community 76 - "Misc Component 76"
Cohesion: 1.0
Nodes (1): DuoReel Platform & Stack Table

### Community 77 - "Misc Component 77"
Cohesion: 1.0
Nodes (1): KV Key Patterns (user, liked, watched, match, notification)

### Community 78 - "Misc Component 78"
Cohesion: 1.0
Nodes (1): Notification Types (partnership_request, movie_match, etc.)

### Community 79 - "Misc Component 79"
Cohesion: 1.0
Nodes (1): Project Context (Local Session Notes)

### Community 80 - "Misc Component 80"
Cohesion: 1.0
Nodes (1): Components CLAUDE: Card Scope (MovieCard, CompactMovieCard, Modal)

### Community 81 - "Misc Component 81"
Cohesion: 1.0
Nodes (1): MovieCardSkeleton.tsx (Loading Skeleton)

## Ambiguous Edges - Review These
- `SpongeBob 'Two Hours Later' Meme Image` → `Desktop Discover Tab Screenshot â€” Movie Grid (Goodfellas, Wolf of Wall Street, etc.)`  [AMBIGUOUS]
  src/assets/0d9cdcfe1e0abe10063defa7d62be273fa090bad.png · relation: conceptually_related_to

## Knowledge Gaps
- **65 isolated node(s):** `shadcn/ui Attribution`, `Unsplash Photo Attribution`, `Vite/React/TypeScript/Tailwind Stack`, `Supabase Backend (KV + Edge Functions + Auth)`, `OMDb API (IMDb Ratings)` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Section Preview Skeleton`** (2 nodes): `SectionPreviewCardSkeleton.tsx`, `SectionPreviewCardSkeleton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Image Fallback Component`** (2 nodes): `ImageWithFallback.tsx`, `ImageWithFallback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Keyword Search Filter`** (2 nodes): `advanced-filters-keyword.tsx`, `searchKeywords()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile Page Loading`** (2 nodes): `profile-page-loading-fix.tsx`, `fetchData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OMDb Rate Limits`** (2 nodes): `OMDb Rate Limits & Throttling (5 concurrent, 1200ms delay)`, `Gotcha: OMDb Rate Limits (1000/day)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stack & App Description`** (2 nodes): `Vite/React/TypeScript/Tailwind Stack`, `Movie Discovery App (README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 30`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 31`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 32`** (1 nodes): `aspect-ratio.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 33`** (1 nodes): `audience-section.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 34`** (1 nodes): `features-grid-refactor.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 35`** (1 nodes): `fix-compact-card-rating.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 36`** (1 nodes): `fix-saved-matches-tab-labels.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 37`** (1 nodes): `how-it-works-section-1.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 38`** (1 nodes): `how-it-works-section.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 39`** (1 nodes): `landing-page-bento.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 40`** (1 nodes): `landing-page-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 41`** (1 nodes): `landing-page-mobile-fixes.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 42`** (1 nodes): `landing-page-mobile-nav-social.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 43`** (1 nodes): `landing-page-updates.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 44`** (1 nodes): `matches-tab-compact-header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 45`** (1 nodes): `mobile-nav-signin.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 46`** (1 nodes): `movie-detail-modal-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 47`** (1 nodes): `movies-tab-fix-1.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 48`** (1 nodes): `movies-tab-fix-2.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 49`** (1 nodes): `movies-tab-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 50`** (1 nodes): `movies-tab-ui-fixes.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 51`** (1 nodes): `movies-tab-view-toggle.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 52`** (1 nodes): `nav-logo-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 53`** (1 nodes): `saved-movies-ratings-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 54`** (1 nodes): `social-proof-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 55`** (1 nodes): `trailer-ux-fix.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 56`** (1 nodes): `use-enrich-movies.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 57`** (1 nodes): `view-toggle-update.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 58`** (1 nodes): `why-duoreel-chat-animation.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 59`** (1 nodes): `why-duoreel-section.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 60`** (1 nodes): `shadcn/ui Attribution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 61`** (1 nodes): `Unsplash Photo Attribution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 62`** (1 nodes): `Letterboxd RSS Sync`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 63`** (1 nodes): `Vercel Hosting (SPA Rewrites)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 64`** (1 nodes): `MovieCard.tsx (Large Card)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 65`** (1 nodes): `ProfilePage.tsx (User Profile)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 66`** (1 nodes): `useWatchedActions.ts (Watched State)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 67`** (1 nodes): `useMovieModal.ts (Modal State)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 68`** (1 nodes): `useCSVImport.ts (Letterboxd CSV Import)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 69`** (1 nodes): `theme.css (Design Tokens + Animation Classes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 70`** (1 nodes): `Rule: No Copy-Paste JSX Across Tabs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 71`** (1 nodes): `Rule: Surgical Changes Only`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 72`** (1 nodes): `Design System: Brand Colors (Pink Accent)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 73`** (1 nodes): `Design System: Typography`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 74`** (1 nodes): `Design System: Navigation Tabs (3-Tab Grid)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 75`** (1 nodes): `Design System: Movie Card Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 76`** (1 nodes): `DuoReel Platform & Stack Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 77`** (1 nodes): `KV Key Patterns (user, liked, watched, match, notification)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 78`** (1 nodes): `Notification Types (partnership_request, movie_match, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 79`** (1 nodes): `Project Context (Local Session Notes)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 80`** (1 nodes): `Components CLAUDE: Card Scope (MovieCard, CompactMovieCard, Modal)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Component 81`** (1 nodes): `MovieCardSkeleton.tsx (Loading Skeleton)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SpongeBob 'Two Hours Later' Meme Image` and `Desktop Discover Tab Screenshot â€” Movie Grid (Goodfellas, Wolf of Wall Street, etc.)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `TMDB Keywords in MovieDetailModal (add-tmdb-keywords spec)` connect `Three-Tab Architecture Rules` to `API Endpoints & KV Architecture`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `client()` (e.g. with `get()` and `set()`) actually correct?**
  _`client()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `shadcn/ui Attribution`, `Unsplash Photo Attribution`, `Vite/React/TypeScript/Tailwind Stack` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Movie Cards & Badges` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `UI Component Library (shadcn)` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._