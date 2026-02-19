import { Heart, Ban, Star, Calendar, User, ChevronDown, ChevronUp, Film, Users, Tag, Clock, Loader2, Eye, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState, useEffect } from 'react';

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path?: string;
    vote_average: number;
    release_date?: string;
    overview: string;
    director?: string;
    actors?: string[];
    genres?: { id: number; name: string }[];
    external_ids?: { imdb_id?: string };
    runtime?: number;
    'watch/providers'?: {
      results?: {
        US?: {
          flatrate?: Array<{
            provider_id: number;
            provider_name: string;
            logo_path: string;
          }>;
        };
      };
    };
  };
  isLiked?: boolean;
  isMatch?: boolean; // New prop for match badge
  isWatched?: boolean; // New prop for watched status
  onLike: () => void;
  onUnlike?: () => void;
  onDislike?: () => void;
  onNotInterested?: () => void;
  isNotInterestedLoading?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  onDirectorClick?: (director: string) => void;
  onGenreClick?: (genreId: number) => void;
  onYearClick?: (year: number) => void;
  onActorClick?: (actor: string) => void;
  imdbRating?: string; // IMDb rating prop
  projectId?: string; // For API calls
  publicAnonKey?: string;
}

export function MovieCard({ movie, isLiked, isMatch, isWatched, onLike, onUnlike, onDislike, onNotInterested, isNotInterestedLoading, onClick, showActions = true, onDirectorClick, onGenreClick, onYearClick, onActorClick, imdbRating, projectId, publicAnonKey }: MovieCardProps) {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.png'
;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  // Use the imdbRating prop directly if available, otherwise check movie object
  const displayImdbRating = imdbRating || (movie as any).imdbRating;
  const hasImdbId = (movie as any).external_ids?.imdb_id;

  // Reset loading state when isLiked changes (meaning the API call completed)
  useEffect(() => {
    setIsLikeLoading(false);
  }, [isLiked]);

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
    <div 
      data-movie-id={movie.id}
      className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatched ? 'opacity-60 grayscale-[30%]' : ''}`}
      onClick={onClick}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={posterUrl} 
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
        
        {/* Match Badge - shown at top right if isMatch */}
        {isMatch && (
          <div className="absolute top-4 right-4">
            <div className="bg-pink-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold shadow-lg">
              <Heart className="size-4 fill-white" />
              Match
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <>
            <div className="absolute top-4 left-4">
              <Button
                size="icon"
                variant={isLiked ? "default" : "secondary"}
                className={`rounded-full ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLikeLoading(true);
                  isLiked ? onUnlike?.() : onLike();
                }}
                disabled={isLikeLoading}
              >
                {isLikeLoading ? <Loader2 className="size-5 animate-spin" /> : <Heart className={`size-5 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} />}
              </Button>
            </div>
            {onDislike && !isMatch && (
              <div className="absolute top-4 right-4">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-slate-800/90 hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDislike();
                  }}
                >
                  <Ban className="size-5 text-white" />
                </Button>
              </div>
            )}
            {onNotInterested && !isMatch && (
              <div className="absolute top-4 right-4">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-slate-800/90 hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotInterested();
                  }}
                  disabled={isNotInterestedLoading}
                >
                  {isNotInterestedLoading ? <Loader2 className="size-5 animate-spin" /> : <Ban className="size-5 text-white" />}
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Watched Badge - shown at bottom left if isWatched */}
        {isWatched && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium shadow-lg backdrop-blur-sm">
              <Eye className="size-4" />
              Watched
            </div>
          </div>
        )}
        
        {/* TMDb Rating Badge - shown at bottom right */}
        {movie.vote_average > 0 && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            {/* TMDb Rating */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="size-3 fill-white text-white" />
                  <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>TMDb Rating</p>
              </TooltipContent>
            </Tooltip>
            
            {/* IMDb Rating - Always shown, with loading state */}
            <Tooltip>
              <TooltipTrigger asChild>
                {displayImdbRating && displayImdbRating !== 'N/A' ? (
                  <a
                    href={hasImdbId ? `https://www.imdb.com/title/${hasImdbId}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#F5C518] backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg hover:bg-[#F5C518]/90 transition-colors"
                  >
                    <Star className="size-3 fill-black text-black" />
                    <span className="text-xs font-bold text-black">{displayImdbRating}</span>
                  </a>
                ) : (
                  <div className="bg-[#F5C518]/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Loader2 className="size-3 text-black/60 animate-spin" />
                    <span className="text-xs font-bold text-black/60">...</span>
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>{displayImdbRating && displayImdbRating !== 'N/A' ? 'IMDb Rating - Click to view on IMDb' : 'Loading IMDb rating...'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{movie.title}</h3>
          
          {/* Year & Runtime */}
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
            {year && (
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors" onClick={(e) => {
                e.stopPropagation();
                onYearClick?.(year);
              }}>
                <Calendar className="size-4" />
                <span>{year}</span>
              </div>
            )}
            {runtime && (
              <>
                {year && <span className="text-slate-500">•</span>}
                <span className="flex items-center gap-1.5"><Clock className="size-4" />{runtime}</span>
              </>
            )}
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Badge 
                    key={genre.id} 
                    variant="secondary" 
                    className="bg-purple-600/70 text-white border-purple-500 cursor-pointer hover:bg-purple-700 hover:border-purple-400 transition-colors text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenreClick?.(genre.id);
                    }}
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
          {movie.overview}
        </p>

        {/* Director */}
        {movie.director && (
          <div className="text-sm">
            <div className="flex items-center gap-1.5">
              <Film className="size-4 text-slate-400" />
              <span className="text-slate-400">Director:</span>
              <span
                className="text-slate-300 cursor-pointer hover:text-blue-400 transition-colors underline decoration-transparent hover:decoration-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectorClick?.(movie.director!);
                }}
              >
                {movie.director}
              </span>
            </div>
          </div>
        )}

        {/* Cast */}
        {movie.actors && movie.actors.length > 0 && (
          <div className="text-sm">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
              <Users className="size-4 text-slate-400" />
              <span className="text-slate-400">Cast:</span>
              {(isExpanded ? movie.actors : movie.actors.slice(0, 2)).map((actor, index) => (
                <span key={index}>
                  <span
                    className="text-slate-300 cursor-pointer hover:text-blue-400 transition-colors underline decoration-transparent hover:decoration-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActorClick?.(actor);
                    }}
                  >
                    {actor}
                  </span>
                  {index < ((isExpanded ? movie.actors : movie.actors.slice(0, 2)).length - 1) && (
                    <span className="text-slate-500">, </span>
                  )}
                </span>
              ))}
              {movie.actors.length > 2 && (
                <span
                  className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="size-3 inline-block" /> show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3 inline-block" /> +{movie.actors.length - 2} more
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Watch Providers */}
        {(() => {
          const watchProviders = (movie as any)['watch/providers']?.results?.US?.flatrate;
          const movieHomepage = (movie as any).homepage;
          
          // Temporary debug display
          if ((movie as any)['watch/providers']) {
            console.log(`Movie ${movie.title} has watch/providers:`, (movie as any)['watch/providers']);
          }
          
          return watchProviders && watchProviders.length > 0 ? (
            <div className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Watch on:</span>
                {watchProviders.slice(0, 3).map((provider: any) => {
                  const providerUrl = getProviderUrl(provider.provider_name, movie.title, movieHomepage);
                  
                  return (
                    <a
                      key={provider.provider_id}
                      href={providerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md hover:bg-slate-600 transition-colors group/provider"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className="size-4 rounded object-cover"
                      />
                      <span className="text-slate-300 text-xs">{provider.provider_name}</span>
                      <ExternalLink className="size-3 text-slate-400 group-hover/provider:text-slate-300 transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-slate-500 text-xs italic">No streaming info available</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}