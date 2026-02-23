import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bookmark, Ban, X, Star, Calendar, Clock, Users, Eye, Loader2, ExternalLink } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface MovieDetailModalProps {
  movie: any;
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
  onDirectorClick?: (director: string) => void;
  onActorClick?: (actor: string) => void;
  onLanguageClick?: (language: string) => void;
  onNotInterested?: () => void;
  projectId?: string;
  publicAnonKey?: string;
  globalImdbCache?: Map<string, string>;
  setGlobalImdbCache?: React.Dispatch<React.SetStateAction<Map<string, string>>>;
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
  onDirectorClick,
  onActorClick,
  onLanguageClick,
  onNotInterested,
  projectId,
  publicAnonKey,
  globalImdbCache,
  setGlobalImdbCache
}: MovieDetailModalProps) {
  const [loadingImdb, setLoadingImdb] = useState(false);

  // Fetch IMDb rating when modal opens - check cache first
  useEffect(() => {
    const imdbId = movie?.external_ids?.imdb_id;
    
    if (isOpen && imdbId && publicAnonKey && globalImdbCache && setGlobalImdbCache) {
      // Check if we already have this rating in cache
      if (globalImdbCache.has(imdbId)) {
        console.log(`Using cached IMDb rating for ${imdbId}:`, globalImdbCache.get(imdbId));
        return; // Already cached, no need to fetch
      }

      // Not in cache, fetch it
      setLoadingImdb(true);
      fetch(`${API_BASE_URL}/omdb/rating/${imdbId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      })
        .then(async res => {
          // Check if response is OK
          if (!res.ok) {
            console.log(`IMDb rating fetch failed: ${res.status}`);
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
            console.log(`Fetched and caching IMDb rating for ${imdbId}:`, data);
            // Add to cache
            const newCache = new Map(globalImdbCache);
            newCache.set(imdbId, data.imdbRating);
            setGlobalImdbCache(newCache);
          }
        })
        .catch(err => console.error('Error fetching IMDb rating:', err))
        .finally(() => setLoadingImdb(false));
    }
  }, [isOpen, movie?.external_ids?.imdb_id, publicAnonKey, globalImdbCache, setGlobalImdbCache]);

  if (!movie) return null;

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.png';

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : posterUrl;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';

  // Helper function to get streaming provider URL
  const getProviderUrl = (providerName: string, movieTitle: string, homepage?: string) => {
    const encodedTitle = encodeURIComponent(movieTitle);
    
    // If movie has a homepage and it's relevant to the provider, use it
    if (homepage) {
      const homepageLower = homepage.toLowerCase();
      if (
        (providerName.toLowerCase().includes('netflix') && homepageLower.includes('netflix')) ||
        (providerName.toLowerCase().includes('amazon') && (homepageLower.includes('amazon') || homepageLower.includes('prime'))) ||
        (providerName.toLowerCase().includes('hulu') && homepageLower.includes('hulu')) ||
        (providerName.toLowerCase().includes('disney') && homepageLower.includes('disney')) ||
        (providerName.toLowerCase().includes('max') && homepageLower.includes('max')) ||
        (providerName.toLowerCase().includes('apple') && homepageLower.includes('apple'))
      ) {
        return homepage;
      }
    }
    
    // Otherwise, construct URLs for known providers
    const providerLower = providerName.toLowerCase();
    if (providerLower.includes('netflix')) {
      return `https://www.netflix.com/search?q=${encodedTitle}`;
    } else if (providerLower.includes('amazon') || providerLower.includes('prime')) {
      return `https://www.amazon.com/s?k=${encodedTitle}&i=instant-video`;
    } else if (providerLower.includes('hulu')) {
      return `https://www.hulu.com/search?q=${encodedTitle}`;
    } else if (providerLower.includes('disney')) {
      return `https://www.disneyplus.com/search?q=${encodedTitle}`;
    } else if (providerLower.includes('max') || providerLower.includes('hbo')) {
      return `https://www.max.com/search?q=${encodedTitle}`;
    } else if (providerLower.includes('apple')) {
      return `https://tv.apple.com/search?q=${encodedTitle}`;
    } else if (providerLower.includes('criterion')) {
      return `https://www.criterionchannel.com/`;
    } else if (providerLower.includes('paramount')) {
      return `https://www.paramountplus.com/search/?query=${encodedTitle}`;
    } else if (providerLower.includes('peacock')) {
      return `https://www.peacocktv.com/search?q=${encodedTitle}`;
    }
    
    // Default: return homepage if available, otherwise generic search
    return homepage || `https://www.google.com/search?q=watch+${encodedTitle}+online`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90dvh] p-0 bg-slate-900 border-slate-700 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{movie.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[90dvh]">
          {/* Backdrop Image */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img 
              src={backdropUrl} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            
            {/* Rating Badges - Bottom Right */}
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
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A'))
                          ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                          : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${
                        ((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A'))
                          ? 'text-black/70'
                          : 'text-black/40'
                      }`}>IMDb</span>
                      {((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A')) ? (
                        <span className="text-xs font-bold text-black">
                          {(movie as any).imdbRating || globalImdbCache?.get(movie.external_ids.imdb_id)}
                        </span>
                      ) : (
                        <Loader2 className="size-3 text-black/50 animate-spin" />
                      )}
                    </a>
                  ) : (
                    <div className="bg-[#F5C518]/30 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <span className="text-[9px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                      <Loader2 className="size-3 text-black/40 animate-spin" />
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700">
                  <p>{movie.external_ids?.imdb_id
                    ? (((movie as any).imdbRating || (globalImdbCache?.has(movie.external_ids.imdb_id) && globalImdbCache.get(movie.external_ids.imdb_id) !== 'N/A'))
                      ? 'View on IMDb'
                      : 'Rating loading — click to view on IMDb')
                    : 'Fetching IMDb info...'
                  }</p>
                </TooltipContent>
              </Tooltip>
            </div>


          </div>

          <div className="p-6 space-y-6">
            {/* Title and Meta */}
            <div>
              <DialogTitle className="text-3xl font-bold text-white mb-3">
                {movie.title}
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

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genres.map((genre: any) => (
                    <Badge 
                      key={genre.id} 
                      variant="secondary" 
                      className="bg-purple-600/70 text-white border-purple-500 cursor-pointer hover:bg-purple-700 hover:border-purple-400 transition-colors" 
                      onClick={() => {
                        onGenreClick?.(genre.id);
                        onClose();
                      }}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={isLiked ? onUnlike : onLike}
                className={`flex-1 min-w-[120px] ${isLiked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
                disabled={isLikeLoading}
              >
                {isLikeLoading ? (
                  <Loader2 className="size-5 mr-2 animate-spin" />
                ) : (
                  <Bookmark className={`size-5 mr-2 ${isLiked ? 'fill-white' : 'fill-slate-900'}`} />
                )}
                {isLiked ? 'Remove' : 'Save'}
              </Button>
              <Button
                onClick={onNotInterested || onDislike}
                variant="outline"
                className="flex-1 min-w-[100px] bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                disabled={isDislikeLoading}
              >
                {isDislikeLoading ? (
                  <Loader2 className="size-5 sm:mr-2 animate-spin" />
                ) : (
                  <Ban className="size-5 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Not Interested</span>
              </Button>
              {onWatched && onUnwatched && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 min-w-[100px]">
                      <Button
                        onClick={isWatched ? onUnwatched : onWatched}
                        variant="outline"
                        className="w-full bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:border-slate-600 hover:text-white"
                        disabled={isWatchedLoading}
                      >
                        {isWatchedLoading ? (
                          <Loader2 className="size-5 sm:mr-2 animate-spin" />
                        ) : (
                          <Eye className="size-5 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">{isWatched ? 'Unwatched' : 'Watched'}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5} className="bg-slate-800 text-white border-slate-700">
                    <p>{isWatched ? 'Mark as not watched yet' : 'Mark as already watched'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
                    onClose();
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
                        onClose();
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
                      onClose();
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
            {movie['watch/providers']?.results?.US?.flatrate && movie['watch/providers'].results.US.flatrate.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Watch on:</h4>
                <div className="flex flex-wrap gap-2">
                  {movie['watch/providers'].results.US.flatrate.map((provider: any) => {
                    const providerUrl = getProviderUrl(provider.provider_name, movie.title, movie.homepage);
                    
                    return (
                      <a
                        key={provider.provider_id}
                        href={providerUrl}
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}