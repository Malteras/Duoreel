Feature: Compact View Toggle (Grid ⊞ / List ☰) for All Tabs
Approach
Add a ⊞ ☰ view-mode toggle to the filter bar of all three tabs (Discover, Saved, Matches). Each tab remembers its own preference in localStorage. Two new card layouts — compact grid (2-col, shorter poster) and list view (horizontal row) — are added alongside the existing full card view, which stays as the default.
Do not modify MovieCard.tsx. Render compact/list cards as inline JSX directly in each tab component using the same design tokens, colors, and badge positions as the existing MovieCard.

UX Flow
Filter bar (any tab):
┌──────────────────────────────────────────────────────┐
│  [Show: Unwatched ▾]  [Sort: Recently Added ▾]  ⊞ ☰  │
└──────────────────────────────────────────────────────┘
                                                  ↑
                              Two icon buttons, right-aligned.
                              ⊞ = compact grid (default fallback: full grid)
                              ☰ = list view
                              Active button has bg-slate-700 highlight.
                              Preference saved to localStorage per tab.
Compact Grid card — keeps aspect-[2/3] poster, all overlaid badges at exact same positions as MovieCard. Card body reduced to: title, year · runtime, genre tags (max 2), description (2-line clamp), director, cast. Two columns instead of the existing grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4.
List card — horizontal row: fixed-width poster thumbnail on left, all info to the right, action buttons inline on the right edge.

Changes
File: src/app/components/MoviesTab.tsx
Step 1: Add LayoutGrid and List to lucide import
diff import {
   Search,
   SlidersHorizontal,
   Loader2,
   RefreshCw,
   ChevronDown,
   Ban,
   X,
   Film,
+  LayoutGrid,
+  List,
 } from "lucide-react";
Step 2: Add view mode state (after existing state declarations, around line 124)
typescript// View mode — persisted per tab
const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>(() => {
  return (localStorage.getItem('duoreel-viewmode-discover') as 'grid' | 'compact' | 'list') || 'grid';
});

const handleViewMode = (mode: 'grid' | 'compact' | 'list') => {
  setViewMode(mode);
  localStorage.setItem('duoreel-viewmode-discover', mode);
};
Step 3: Add toggle buttons to the filter bar — Row 1 (after the Refresh button, still inside the flex gap-3 items-center div, around line 1095)
Find this closing section of Row 1:
tsx            {/* Refresh — always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:text-white h-9 px-3 shrink-0"
                  onClick={handleRefresh}
                  aria-label="Refresh movies"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>Refresh movies</p>
              </TooltipContent>
            </Tooltip>
Add immediately after that closing </Tooltip>, still inside the same row div:
tsx            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-md p-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleViewMode('compact')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    aria-label="Compact grid view"
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Compact grid</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    aria-label="List view"
                  >
                    <List className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>List view</p></TooltipContent>
              </Tooltip>
            </div>
Step 4: Replace the movie grid rendering
Find the current grid block (around line 1260):
tsx          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                ...
              />
            ))}
          </div>
Replace the entire <> block (from <> down to the load-more sentinel) with:
tsx          <>
            {/* ── Full grid (default) ── */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovieIds.has(movie.id)}
                    isWatched={isWatched(movie.id)}
                    onLike={() => handleLike(movie)}
                    onUnlike={() => handleUnlike(movie.id)}
                    onNotInterested={() => handleNotInterested(movie.id)}
                    isNotInterestedLoading={notInterestedLoadingIds.has(movie.id)}
                    onClick={() => openMovie(movie)}
                    onDirectorClick={(director) => updateFilter("director", director)}
                    onGenreClick={(genreId) => updateFilter("genre", genreId.toString())}
                    onYearClick={(year) => updateFilter("year", year.toString())}
                    imdbRating={imdbRatings.get(movie.id?.toString())}
                    projectId={projectId}
                    publicAnonKey={publicAnonKey}
                    globalImdbCache={imdbRatings}
                  />
                ))}
              </div>
            )}

            {/* ── Compact grid ── */}
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleMovies.map((movie) => {
                  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
                  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                  const imdbRating = imdbRatings.get(movie.id?.toString());
                  const isLiked = likedMovieIds.has(movie.id);
                  const isWatchedMovie = isWatched(movie.id);
                  return (
                    <div
                      key={movie.id}
                      data-movie-id={movie.id}
                      className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                      onClick={() => openMovie(movie)}
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] overflow-hidden">
                        {posterUrl
                          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-10 text-slate-600" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />

                        {/* top-left: bookmark */}
                        <div className="absolute top-4 left-4">
                          <button
                            className={`size-10 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'}`}
                            onClick={(e) => { e.stopPropagation(); isLiked ? handleUnlike(movie.id) : handleLike(movie); }}
                            aria-label={isLiked ? 'Remove from watchlist' : 'Save to watchlist'}
                          >
                            <svg className={`size-5 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          </button>
                        </div>

                        {/* top-right: not interested */}
                        <div className="absolute top-4 right-4">
                          <button
                            className="size-10 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}
                            aria-label="Not interested"
                          >
                            <Ban className="size-5 text-white" />
                          </button>
                        </div>

                        {/* bottom-right: ratings */}
                        {movie.vote_average > 0 && (
                          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
                            <div className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                              <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                            </div>
                            {imdbRating && imdbRating !== 'N/A' && (
                              <div className="bg-[#F5C518] backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <span className="text-[9px] font-bold text-black/70 uppercase tracking-wide">IMDb</span>
                                <span className="text-xs font-bold text-black">{imdbRating}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          {year && <span>{year}</span>}
                          {year && runtime && <span className="text-slate-500">·</span>}
                          {runtime && <span>{runtime}</span>}
                        </div>
                        {movie.genres && movie.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {movie.genres.slice(0, 2).map((genre) => (
                              <span key={genre.id} className="bg-purple-600/70 text-white border border-purple-500 text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-purple-700" onClick={(e) => { e.stopPropagation(); updateFilter("genre", genre.id.toString()); }}>{genre.name}</span>
                            ))}
                          </div>
                        )}
                        {movie.overview && <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{movie.overview}</p>}
                        {movie.director && <div className="text-xs text-slate-400">Dir: <span className="text-slate-300">{movie.director}</span></div>}
                        {movie.actors && movie.actors.length > 0 && <div className="text-xs text-slate-400">Cast: <span className="text-slate-300">{movie.actors.slice(0, 2).join(', ')}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── List view ── */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {visibleMovies.map((movie) => {
                  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '';
                  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                  const imdbRating = imdbRatings.get(movie.id?.toString());
                  const isLiked = likedMovieIds.has(movie.id);
                  const isWatchedMovie = isWatched(movie.id);
                  return (
                    <div
                      key={movie.id}
                      data-movie-id={movie.id}
                      className={`group flex gap-3 bg-gradient-to-r from-slate-800/50 to-slate-900/80 border border-slate-700/50 hover:border-slate-600 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                      onClick={() => openMovie(movie)}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-14 flex-shrink-0">
                        {posterUrl
                          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-6 text-slate-600" /></div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 py-2.5 min-w-0">
                        <p className="font-semibold text-white text-sm leading-tight truncate">{movie.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {[year, runtime, movie.genres?.[0]?.name].filter(Boolean).join(' · ')}
                        </p>
                        {movie.director && <p className="text-slate-500 text-xs mt-0.5">Dir: {movie.director}</p>}
                      </div>

                      {/* Right side: ratings + action */}
                      <div className="flex items-center gap-2 pr-3 flex-shrink-0">
                        {movie.vote_average > 0 && (
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="bg-blue-600/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                              <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                            </div>
                            {imdbRating && imdbRating !== 'N/A' && (
                              <div className="bg-[#F5C518] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="text-[9px] font-bold text-black/70 uppercase tracking-wide">IMDb</span>
                                <span className="text-xs font-bold text-black">{imdbRating}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          className={`size-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'}`}
                          onClick={(e) => { e.stopPropagation(); isLiked ? handleUnlike(movie.id) : handleLike(movie); }}
                          aria-label={isLiked ? 'Remove from watchlist' : 'Save to watchlist'}
                        >
                          <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-white'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load more sentinel — keep exactly as-is */}

Note: Keep all existing load-more / skeleton / sentinel code that was inside the original <> block. Only the grid div and MovieCard calls are replaced above.


File: src/app/components/SavedMoviesTab.tsx
Step 1: Add LayoutGrid and List to lucide import
diff-import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff } from 'lucide-react';
+import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, List } from 'lucide-react';
Step 2: Add view mode state (after const [sortBy, setSortBy] around line 58)
typescriptconst [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>(() => {
  return (localStorage.getItem('duoreel-viewmode-saved') as 'grid' | 'compact' | 'list') || 'grid';
});

const handleViewMode = (mode: 'grid' | 'compact' | 'list') => {
  setViewMode(mode);
  localStorage.setItem('duoreel-viewmode-saved', mode);
};
Step 3: Add toggle buttons to the Sort/Filter bar
Find the Sort/Filter div (around line 448):
tsx          {((viewMode === 'mine' && likedMovies.length > 0) || (viewMode === 'partner' && sortedPartnerMovies.length > 0)) && (
            <div className="flex items-center gap-3 md:justify-between">
Change md:justify-between to keep it but append the toggle at the very end of that div (after the closing </div> of the Sort select group):
tsx              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 ml-auto">
                <button
                  onClick={() => handleViewMode('compact')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="Compact grid view"
                  title="Compact grid"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  onClick={() => handleViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="size-3.5" />
                </button>
              </div>
Step 4: Replace both movie grid divs (My List and Partner's List)
There are two grids in SavedMoviesTab (around lines 604 and 667). For each one, find:
tsx<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {filteredLikedMovies.slice(...).map((movie) => (
    <MovieCard key={movie.id} movie={movie} ... />
  ))}
</div>
Replace each with a conditional that mirrors the same compact/list pattern as MoviesTab above. The saved-tab card uses:

isLiked always true
No onNotInterested
onUnlike={() => handleUnlike(movie.id)}
isWatched={watchedMovieIds.has(movie.id)}

Apply the same compact grid and list JSX from Step 4 of MoviesTab, substituting the correct movie array and handler names. For the Partner's List grid substitute filteredPartnerMovies and omit the bookmark/watched buttons (partner cards are read-only in the current MovieCard — preserve that).

File: src/app/components/MatchesTab.tsx
Step 1: Add LayoutGrid and List to lucide import
diff import {
   Users,
   Heart,
   UserX,
   Check,
   X,
   Bell,
   Tv,
   ArrowUpDown,
   Filter,
+  LayoutGrid,
+  List,
 } from 'lucide-react';
Step 2: Add view mode state (after const [sortBy, setSortBy] around line 67)
typescriptconst [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>(() => {
  return (localStorage.getItem('duoreel-viewmode-matches') as 'grid' | 'compact' | 'list') || 'grid';
});

const handleViewMode = (mode: 'grid' | 'compact' | 'list') => {
  setViewMode(mode);
  localStorage.setItem('duoreel-viewmode-matches', mode);
};
Step 3: Add toggle to the Filter & Sort bar
Find the closing of the matches filter bar (around line 590):
tsx          </div>
        )}

        {/* Match count */}
Just before {/* Match count */}, add the toggle as a separate row below the filter bar:
tsx        {/* View mode toggle */}
        {!loading && partner && matchedMovies.length > 0 && (
          <div className="flex justify-end mb-4 -mt-2">
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5">
              <button
                onClick={() => handleViewMode('compact')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                aria-label="Compact grid view"
                title="Compact grid"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => handleViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                aria-label="List view"
                title="List view"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        )}
Step 4: Replace the matches movie grid
Find the existing grid (search for grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 in MatchesTab.tsx). Replace with the same three-way conditional (grid / compact / list) as MoviesTab. Match cards use isMatch={true}, no onNotInterested, and onDislike={() => handleDislike(movie.id)}.

Testing Checklist

 Open Discover tab → ⊞ ☰ toggle appears at the right end of the filter bar row
 Click ⊞ → cards switch to compact 2-col grid, full poster visible, all badges at same positions
 Click ☰ → cards switch to horizontal list rows with thumbnail on left
 Click full-grid icon (or refresh) → returns to normal grid-cols-1 md:grid-cols-2... layout (full MovieCard)
 Refresh page → Discover tab remembers last chosen view mode
 Switch to Saved tab → has its own independent ⊞ ☰ toggle; preference is independent of Discover
 Switch to Matches tab → has its own independent ⊞ ☰ toggle
 In compact grid: bookmark button (top-left), Not Interested (top-right), TMDB+IMDb badges (bottom-right) are all visible and functional
 In list view: bookmark button toggles save state correctly
 Clicking a card in any view mode opens the movie detail modal
 Genre tags in compact grid trigger Discover filter navigation
 Watched opacity/grayscale applies correctly in compact and list views
 Match badge shows in compact/list for Matches tab cards
 Toggle buttons are accessible (keyboard navigable, aria-labels present)

Summary Table
WhatBeforeAfterCard layoutFull poster card onlyFull / Compact grid / List — toggle per tabPreferencen/aPersisted in localStorage per tab keyFilter barEnds at Refresh button (Discover) / Sort dropdown (Saved, Matches)⊞ ☰ appended to right of filter rowMovieCard.tsxUnchangedUnchanged — compact/list are inline JSXlocalStorage keysn/aduoreel-viewmode-discover, duoreel-viewmode-saved, duoreel-viewmode-matches