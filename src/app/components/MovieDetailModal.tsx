import { useState, useEffect } from 'react';
import type { Movie } from '../../types/movie';
import { API_BASE_URL } from '../../utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bookmark, Ban, X, Star, Calendar, Clock, Users, Eye, Loader2, ExternalLink, Film, Play, ScanSearch } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface MovieDetailModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  isLiked: boolean;
  onLike: () => void;
  onUnlike: () => void;
  onDislike: () => void;
  onWatched?: () => void;
  onUnwatched?: () => void;
  isWatched?: boolean;
  isLikeLoading?: boolean;
  isDislikeLoading?: boolean;
  isWatchedLoading?: boolean;
  onGenreClick?: (genreId: number) => void;
  onKeywordClick?: (keywordId: number, keywordName: string) => void;
  onDirectorClick?: (director: string) => void;
  onActorClick?: (actor: string) => void;
  onLanguageClick?: (language: string) => void;
  onNotInterested?: () => void;
  showNotInterested?: boolean;
  onFindSimilar?: () => void;
  projectId?: string;
  publicAnonKey?: string;
  globalImdbCache?: Map<string, string>;
  setGlobalImdbCache?: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  imdbRatingFromCard?: string | null;
  partnerWatchedIds?: Set<number>;
  partnerName?: string;
}

export function MovieDetailModal({ 
  movie, 
  isOpen, 
  onClose, 
  isLiked, 
  onLike, 
  onUnlike,
  onDislike,
  onWatched,
  onUnwatched,
  isWatched = false,
  isLikeLoading = false,
  isDislikeLoading = false,
  isWatchedLoading = false,
  onGenreClick,
  onKeywordClick,
  onDirectorClick,
  onActorClick,
  onLanguageClick,
  onNotInterested,
  showNotInterested = false,
  onFindSimilar,
  projectId,
  publicAnonKey,
  globalImdbCache,
  setGlobalImdbCache,
  imdbRatingFromCard,
  partnerWatchedIds,
  partnerName
}: MovieDetailModalProps) {
  const [loadingImdb, setLoadingImdb] = useState(false);

  // Strip wrapping quotes from TMDB titles (e.g., "\"Wuthering Heights\"" → "Wuthering Heights")
  const cleanTitle = (title: string) => title.replace(/^[\"']+|[\"']+$/g, '').trim();

  // Derive the user's country code from their browser locale (e.g. 'en-US' → 'US')
  // Falls back to 'US' if the locale doesn't include a region.
  const getUserCountryCode = (): string => {
    const locale = navigator.language || 'en-US';
    const parts = locale.split('-');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'US';
  };

  // Returns the watch/providers result for the user's region,
  // falling back to US if their region has no data.
  const getRegionProviders = (watchProviders: Movie['watch/providers']) => {
    if (!watchProviders?.results) return null;
    const countryCode = getUserCountryCode();
    return watchProviders.results[countryCode] || watchProviders.results['US'] || null;
  };

  // Fetch IMDb rating when modal opens — skip if already available from any source
  useEffect(() => {
    const imdbId = movie?.external_ids?.imdb_id;
    
    if (isOpen && imdbId && publicAnonKey && globalImdbCache && setGlobalImdbCache) {
      // Check all existing sources: card prop, movie object, cache
      const existingRating = imdbRatingFromCard || (movie as any)?.imdbRating;
      if (existingRating && existingRating !== 'N/A') {
        // Write to cache so other cards benefit too
        if (!globalImdbCache.has(imdbId)) {
          const newCache = new Map(globalImdbCache);
          newCache.set(imdbId, existingRating);
          setGlobalImdbCache(newCache);
        }
        return; // Already have it, no fetch needed
      }

      // Check cache
      if (globalImdbCache.has(imdbId) && globalImdbCache.get(imdbId) !== 'N/A') {
        return; // Already cached from a previous modal open
      }

      // Not available anywhere — fetch it
      setLoadingImdb(true);
      fetch(`${API_BASE_URL}/omdb/rating/${imdbId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      })
        .then(async res => {
          // Check if response is OK
          if (!res.ok) {
            console.error(`IMDb rating fetch failed: ${res.status}`);
            return null;
          }

          // Check if response is JSON
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error(`Non-JSON response:`, text.substring(0, 200));
            return null;
          }

          return res.json();
        })
        .then(data => {
          if (data && !data.error) {
            // Add to cache
            const newCache = new Map(globalImdbCache);
            newCache.set(imdbId, data.imdbRating);
            setGlobalImdbCache(newCache);
          }
        })
        .catch(err => console.error('Error fetching IMDb rating:', err))
        .finally(() => setLoadingImdb(false));
    }
  }, [isOpen, movie?.external_ids?.imdb_id, publicAnonKey, globalImdbCache, setGlobalImdbCache, imdbRatingFromCard]);

  // --- Trailer logic ---
  const [showTrailer, setShowTrailer] = useState(false);

  // Find the best YouTube trailer: prefer official trailers, then any trailer, then any YouTube video
  const trailerKey = (() => {
    const videos = movie?.videos?.results;
    if (!videos || videos.length === 0) return null;

    const youtubeVideos = videos.filter((v) => v.site === 'YouTube');
    // Priority 1: Official trailer
    const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer' && v.official);
    if (officialTrailer) return officialTrailer.key;
    // Priority 2: Any trailer
    const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
    if (anyTrailer) return anyTrailer.key;
    // Priority 3: Official teaser
    const officialTeaser = youtubeVideos.find((v) => v.type === 'Teaser' && v.official);
    if (officialTeaser) return officialTeaser.key;
    // Priority 4: Any YouTube video (clip, featurette, etc.)
    return youtubeVideos[0]?.key || null;
  })();

  // Reset trailer playback when modal closes or movie changes
  useEffect(() => {
    if (!isOpen) setShowTrailer(false);
  }, [isOpen, movie?.id]);

  if (!movie) return null;

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '';
  
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : posterUrl;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90dvh] p-0 bg-slate-900 border-slate-700 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{cleanTitle(movie.title)}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[90dvh] overflow-y-auto">
          {/* Backdrop Image */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            {showTrailer && trailerKey ? (
              /* YouTube embed — active when user clicks play */
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              /* Thumbnail state — poster/backdrop with optional play button */
              <>
                {trailerKey && backdropUrl ? (
                  /* Backdrop image with play button — trailer available */
                  <div
                    className="w-full h-full cursor-pointer group/trailer"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={backdropUrl}
                      alt={cleanTitle(movie.title)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className="bg-black/60 group-hover/trailer:bg-red-600 transition-colors rounded-full p-4 shadow-2xl">
                        <Play className="size-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : trailerKey && !backdropUrl ? (
                  /* No backdrop but trailer exists — use YouTube thumbnail as last resort */
                  <div
                    className="w-full h-full cursor-pointer group/trailer"
                    onClick={() => setShowTrailer(true)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`}
                      alt={`${cleanTitle(movie.title)} trailer`}
                      className="w-full h-full object-cover"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className="bg-black/60 group-hover/trailer:bg-red-600 transition-colors rounded-full p-4 shadow-2xl">
                        <Play className="size-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : backdropUrl ? (
                  <img
                    src={backdropUrl}
                    alt={cleanTitle(movie.title)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!trailerKey && (
                  <div
                    className="w-full h-full bg-slate-800 items-center justify-center"
                    style={{ display: backdropUrl ? 'none' : 'flex' }}
                  >
                    <Film className="size-20 text-slate-600" />
                  </div>
                )}
              </>
            )}
            {/* Gradient overlay — hide during video playback for clean player */}
            {!showTrailer && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            )}
            
            {/* Rating Badges - Bottom Right (overlay on thumbnail, hidden during playback) */}
            {!showTrailer && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                {/* TMDB Rating Badge */}
                {movie.vote_average && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                        <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                        <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white border-slate-700">
                      <p>TMDB community rating ({movie.vote_count?.toLocaleString()} votes)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* IMDb Rating Badge — always a link when imdb_id exists */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    {movie.external_ids?.imdb_id ? (
                      <a
                        href={`https://www.imdb.com/title/${movie.external_ids.imdb_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                          ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                            ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                            : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                        }`}
                      >
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${
                          ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                            ? 'text-black/70'
                            : 'text-black/40'
                        }`}>IMDb</span>
                        {(() => {
                          const cachedVal = globalImdbCache?.get(movie.external_ids.imdb_id);
                          const rating = (movie as any).imdbRating || (cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND' ? cachedVal : null);
                          if (rating) return <span className="text-xs font-bold text-black leading-4">{rating}</span>;
                          if (cachedVal === 'NOT_FOUND') return <span className="text-xs font-bold text-black/40 leading-4">—</span>;
                          return <span className="inline-flex items-center h-4"><Loader2 className="size-3 text-black/50 animate-spin" /></span>;
                        })()}
                      </a>
                    ) : (
                      <div className="bg-[#F5C518]/30 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                        <span className="inline-flex items-center h-4"><Loader2 className="size-3 text-black/40 animate-spin" /></span>
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700">
                    <p>{movie.external_ids?.imdb_id
                      ? (() => {
                          const cachedVal = globalImdbCache?.get(movie.external_ids!.imdb_id);
                          if ((movie as any).imdbRating || (cachedVal && cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND')) return 'View on IMDb';
                          if (cachedVal === 'NOT_FOUND') return 'Not rated on IMDb — click to view page';
                          return 'Rating loading — click to view on IMDb';
                        })()
                      : 'Fetching IMDb info...'
                    }</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}


          </div>

          {/* Rating Badges — shown below video during trailer playback */}
          {showTrailer && (
            <div className="flex items-center justify-end gap-2 px-4 py-2 bg-slate-900">
              {/* TMDB Rating Badge */}
              {movie.vote_average && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 bg-blue-600/90 px-2 py-1 rounded-full shadow-lg">
                      <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                      <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700">
                    <p>TMDB community rating ({movie.vote_count?.toLocaleString()} votes)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* IMDb Rating Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  {movie.external_ids?.imdb_id ? (
                    <a
                      href={`https://www.imdb.com/title/${movie.external_ids.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                          ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                          : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A' && globalImdbCache.get(movie.external_ids.imdb_id) !== 'NOT_FOUND'))
                          ? 'text-black/70'
                          : 'text-black/40'
                      }`}>IMDb</span>
                      {(() => {
                        const cachedVal = globalImdbCache?.get(movie.external_ids.imdb_id);
                        const rating = (movie as any).imdbRating || (cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND' ? cachedVal : null);
                        if (rating) return <span className="text-xs font-bold text-black leading-4">{rating}</span>;
                        if (cachedVal === 'NOT_FOUND') return <span className="text-xs font-bold text-black/40 leading-4">—</span>;
                        return <span className="inline-flex items-center h-4"><Loader2 className="size-3 text-black/50 animate-spin" /></span>;
                      })()}
                    </a>
                  ) : (
                    <div className="bg-[#F5C518]/30 px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                      <span className="inline-flex items-center h-4"><Loader2 className="size-3 text-black/40 animate-spin" /></span>
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700">
                  <p>{movie.external_ids?.imdb_id
                    ? (() => {
                        const cachedVal = globalImdbCache?.get(movie.external_ids!.imdb_id);
                        if ((movie as any).imdbRating || (cachedVal && cachedVal !== 'N/A' && cachedVal !== 'NOT_FOUND')) return 'View on IMDb';
                        if (cachedVal === 'NOT_FOUND') return 'Not rated on IMDb — click to view page';
                        return 'Rating loading — click to view on IMDb';
                      })()
                    : 'Fetching IMDb info...'
                  }</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Title and Meta */}
            <div>
              {/* Partner watched eyebrow */}
              {partnerWatchedIds?.has(movie?.id) && partnerName && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="size-3.5 text-pink-500 shrink-0" />
                  <span className="text-xs font-bold tracking-widest uppercase text-pink-500">
                    {partnerName} has seen this
                  </span>
                </div>
              )}
              <DialogTitle className="text-3xl font-bold text-white mb-3">
                {cleanTitle(movie.title)}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center gap-4 text-slate-300 mb-4">
                {year && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    <span>{year}</span>
                  </div>
                )}
                {runtime && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>{runtime}</span>
                  </div>
                )}
                {movie.vote_count && (
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    <span>{movie.vote_count.toLocaleString()} votes</span>
                  </div>
                )}
              </div>

              {/* Partner watched indicator moved above title */}

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {movie.genres.map((genre) => (
                    <Badge 
                      key={genre.id} 
                      variant="secondary" 
                      className="rounded-full bg-purple-500/20 text-purple-300 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 hover:border-purple-400/50 transition-colors" 
                      onClick={() => {
                        onGenreClick?.(genre.id);
                      }}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.keywords.slice(0, 8).map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="secondary"
                      className="rounded-full bg-slate-700/80 text-slate-300 border-slate-600 text-xs font-normal cursor-pointer hover:bg-slate-600 hover:text-slate-200 hover:border-slate-500 transition-colors"
                      onClick={() => {
                        onKeywordClick?.(kw.id, kw.name);
                      }}
                    >
                      {kw.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {/* Mobile: flex-col (Save full-width top, secondary pair below) */}
            {/* Desktop sm+: flex-row (all three side by side, equal flex-1) */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Primary action — full width on mobile, flex-1 on desktop */}
              <Button
                onClick={isLiked ? onUnlike : onLike}
                className={`flex-1 ${isLiked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
                disabled={isLikeLoading}
              >
                {isLikeLoading ? (
                  <Loader2 className="size-5 mr-2 animate-spin" />
                ) : (
                  <Bookmark className={`size-5 mr-2 ${isLiked ? 'fill-white' : 'fill-slate-900'}`} />
                )}
                {isLiked ? 'Remove' : 'Save'}
              </Button>

              {/* Secondary actions — equal halves on mobile, flex-1 each on desktop */}
              <div className="flex gap-2 sm:gap-3 sm:contents">
                {showNotInterested && (
                <Button
                  onClick={onNotInterested || onDislike}
                  variant="outline"
                  className="flex-1 bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                  disabled={isDislikeLoading}
                >
                  {isDislikeLoading ? (
                    <Loader2 className="size-5 mr-2 animate-spin" />
                  ) : (
                    <Ban className="size-5 mr-2" />
                  )}
                  Not Interested
                </Button>
                )}

                {onWatched && onUnwatched && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={isWatched ? onUnwatched : onWatched}
                        variant="outline"
                        className="flex-1 bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                        disabled={isWatchedLoading}
                      >
                        {isWatchedLoading ? (
                          <Loader2 className="size-5 mr-2 animate-spin" />
                        ) : (
                          <Eye className="size-5 mr-2" />
                        )}
                        {isWatched ? 'Unwatched' : 'Watched'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5} className="bg-slate-800 text-white border-slate-700">
                      <p>{isWatched ? 'Mark as not watched yet' : 'Mark as already watched'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {onFindSimilar && (
                  <Button
                    onClick={onFindSimilar}
                    variant="outline"
                    className="flex-1 bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                  >
                    <ScanSearch className="size-5 mr-2" />
                    Find Similar
                  </Button>
                )}
              </div>
            </div>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-slate-400 italic text-lg">"{movie.tagline}"</p>
            )}

            {/* Overview */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Overview</h3>
              <p className="text-slate-300 leading-relaxed">{movie.overview}</p>
            </div>

            {/* Director */}
            {movie.director && (
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Director</h3>
                <Badge 
                  variant="secondary" 
                  className="bg-slate-700 text-slate-200 border-slate-600 cursor-pointer hover:bg-slate-600 hover:border-slate-500 transition-colors text-base px-3 py-1"
                  onClick={() => {
                    onDirectorClick?.(movie.director);
                  }}
                >
                  {movie.director}
                </Badge>
              </div>
            )}

            {/* Cast */}
            {movie.actors && movie.actors.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.actors.map((actor: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-blue-600/80 text-white border-blue-500 cursor-pointer hover:bg-blue-700 hover:border-blue-400 transition-colors"
                      onClick={() => {
                        onActorClick?.(actor);
                      }}
                    >
                      {actor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              {movie.budget && movie.budget > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Budget</h4>
                  <p className="text-white">${(movie.budget / 1000000).toFixed(1)}M</p>
                </div>
              )}
              {movie.revenue && movie.revenue > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Revenue</h4>
                  <p className="text-white">${(movie.revenue / 1000000).toFixed(1)}M</p>
                </div>
              )}
              {movie.original_language && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Language</h4>
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-slate-200 border-slate-600 cursor-pointer hover:bg-slate-600 hover:border-slate-500 transition-colors uppercase"
                    onClick={() => {
                      onLanguageClick?.(movie.original_language);
                    }}
                  >
                    {movie.original_language}
                  </Badge>
                </div>
              )}
              {movie.status && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Status</h4>
                  <p className="text-white">{movie.status}</p>
                </div>
              )}
            </div>

            {/* Watch Providers */}
            {(() => {
              const regionData = getRegionProviders(movie['watch/providers']);
              const providers = regionData?.flatrate;
              // regionData.link is the TMDB /watch page for this exact movie in the user's region.
              // TMDB does not provide direct platform deep-links; this page lists all options and
              // links out to the correct streaming services. Far better than a constructed search URL.
              const watchLink = regionData?.link
                || `https://www.justwatch.com/search?q=${encodeURIComponent(cleanTitle(movie.title))}`;

              return (
                <div className="pt-4 border-t border-slate-800">
                  {providers && providers.length > 0 ? (
                    <>
                      <h4 className="text-sm font-semibold text-slate-400 mb-3">Watch on:</h4>
                      <div className="flex flex-wrap gap-2">
                        {providers.map((provider) => (
                          <a
                            key={provider.provider_id}
                            href={watchLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors group"
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="size-5 rounded object-cover"
                            />
                            <span className="text-slate-200 text-sm">{provider.provider_name}</span>
                            <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-300 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <a
                      href={watchLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 text-sm hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      Find where to watch
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}