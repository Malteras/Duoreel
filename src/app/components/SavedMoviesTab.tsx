import { useState, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { useUserInteractions } from './UserInteractionsContext';
import { useMovieModal } from '../hooks/useMovieModal';
import { Heart, Loader2, Users, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SavedMoviesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
  likedMovies: any[];
  setLikedMovies: React.Dispatch<React.SetStateAction<any[]>>;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

export function SavedMoviesTab({ 
  accessToken, 
  projectId, 
  publicAnonKey, 
  navigateToDiscoverWithFilter,
  likedMovies,
  setLikedMovies,
  globalImdbCache,
  setGlobalImdbCache
}: SavedMoviesTabProps) {
  const { watchedMovieIds, toggleWatched, isWatched, watchedLoadingIds } = useUserInteractions();
  const { selectedMovie, modalOpen, openMovie, closeMovie, isLoadingDeepLink } = useMovieModal(accessToken);
  const [partnerLikedMovies, setPartnerLikedMovies] = useState<any[]>([]);
  const [partnerName, setPartnerName] = useState<string>('');
  const [hasPartner, setHasPartner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'mine' | 'partner'>('mine');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'rating' | 'release-newest' | 'release-oldest'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'unwatched' | 'watched'>('unwatched');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // Fetch partner info and partner's list
  useEffect(() => {
    if (!accessToken) return;

    const fetchPartnerData = async () => {
      setLoading(true);
      try {
        const partnerResponse = await fetch(`${baseUrl}/partner`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const partnerData = await partnerResponse.json();

        if (partnerData.partner) {
          setHasPartner(true);
          setPartnerName(partnerData.partner.name || partnerData.partner.email);

          // Fetch partner's liked movies (refresh every time)
          const partnerLikedResponse = await fetch(`${baseUrl}/movies/partner-liked`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const partnerLikedData = await partnerLikedResponse.json();

          if (!partnerLikedData.error) {
            setPartnerLikedMovies(partnerLikedData.movies || []);
          }
        } else {
          setHasPartner(false);
          setPartnerName('');
          setPartnerLikedMovies([]);
        }
      } catch (error) {
        console.error('Error fetching partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [accessToken, viewMode]); // Re-fetch when switching to partner view

  // TEMPORARILY DISABLED - Fetch IMDb ratings for liked movies (with caching)
  // Disabled to improve app performance
  /*
  useEffect(() => {
    if (!accessToken || likedMovies.length === 0) return;

    const fetchImdbRatings = async () => {
      for (const movie of likedMovies) {
        // Skip if movie already has imdbRating property OR is already in our local cache
        if (movie.imdbRating || imdbRatings.has(movie.id)) continue;

        // Set loading state
        setImdbRatings(prev => new Map(prev).set(movie.id, 'loading'));

        try {
          // First, get the IMDb ID from movie data or fetch from TMDb
          let imdbId = movie.imdb_id;
          
          if (!imdbId) {
            // Fetch movie details from backend to get imdb_id
            const tmdbResponse = await fetch(`${baseUrl}/movies/${movie.id}/details`);
            if (tmdbResponse.ok) {
              const tmdbData = await tmdbResponse.json();
              imdbId = tmdbData.imdb_id;
            }
          }

          if (!imdbId) {
            console.log(`No IMDb ID found for movie ${movie.id}`);
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
            continue;
          }

          // Use the working /omdb/rating/:imdbId endpoint
          const response = await fetch(`${baseUrl}/omdb/rating/${imdbId}`);
          
          if (!response.ok) {
            console.error(`IMDb rating fetch failed for movie ${movie.id}:`, {
              status: response.status,
              statusText: response.statusText,
              url: `${baseUrl}/omdb/rating/${imdbId}`
            });
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
            continue;
          }

          const data = await response.json();
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            // Save permanently to local state
            setImdbRatings(prev => new Map(prev).set(movie.id, data.imdbRating));
          } else {
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
          }
        } catch (error) {
          console.log(`IMDb rating not available for movie ${movie.id}:`, error);
          setImdbRatings(prev => {
            const newMap = new Map(prev);
            newMap.delete(movie.id);
            return newMap;
          });
        }
      }
    };

    fetchImdbRatings();
  }, [likedMovies, accessToken]);
  */

  // TEMPORARILY DISABLED - Fetch IMDb ratings for partner's liked movies
  // Disabled to improve app performance
  /*
  useEffect(() => {
    if (!accessToken || partnerLikedMovies.length === 0) return;

    const fetchPartnerImdbRatings = async () => {
      for (const movie of partnerLikedMovies) {
        // Skip if movie already has imdbRating OR is in local cache
        if (movie.imdbRating || imdbRatings.has(movie.id)) continue;

        // Set loading state
        setImdbRatings(prev => new Map(prev).set(movie.id, 'loading'));

        try {
          // First, get the IMDb ID from movie data or fetch from backend
          let imdbId = movie.imdb_id;
          
          if (!imdbId) {
            // Fetch movie details from backend to get imdb_id
            const tmdbResponse = await fetch(`${baseUrl}/movies/${movie.id}/details`);
            if (tmdbResponse.ok) {
              const tmdbData = await tmdbResponse.json();
              imdbId = tmdbData.imdb_id;
            }
          }

          if (!imdbId) {
            console.log(`No IMDb ID found for movie ${movie.id}`);
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
            continue;
          }

          // Use the working /omdb/rating/:imdbId endpoint
          const response = await fetch(`${baseUrl}/omdb/rating/${imdbId}`);
          
          if (!response.ok) {
            console.log(`IMDb rating fetch failed for movie ${movie.id}: ${response.status}`);
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
            continue;
          }

          const data = await response.json();
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            // Save permanently to local state
            setImdbRatings(prev => new Map(prev).set(movie.id, data.imdbRating));
          } else {
            setImdbRatings(prev => {
              const newMap = new Map(prev);
              newMap.delete(movie.id);
              return newMap;
            });
          }
        } catch (error) {
          console.log(`IMDb rating not available for movie ${movie.id}:`, error);
          setImdbRatings(prev => {
            const newMap = new Map(prev);
            newMap.delete(movie.id);
            return newMap;
          });
        }
      }
    };

    fetchPartnerImdbRatings();
  }, [partnerLikedMovies, accessToken]);
  */

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.ok) {
        setLikedMovies(prev => prev.filter(m => m.id !== movieId));
        toast.success('Removed from your list');
      }
    } catch (error) {
      console.error('Error unliking movie:', error);
      toast.error('Failed to unlike movie');
    }
  };

  const handleLike = async (movie: any) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${baseUrl}/movies/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ movie })
      });

      if (response.ok) {
        setLikedMovies(prev => [...prev, movie]);
        toast.success('Added to your saved list');
      }
    } catch (error) {
      console.error('Error liking movie:', error);
      toast.error('Failed to like movie');
    }
  };

  const handleWatched = async (movie: any) => {
    if (!accessToken) {
      toast.error('Please sign in to mark movies as watched');
      return;
    }

    try {
      await toggleWatched(movie.id, true);
      toast.success(`Marked "${movie.title}" as watched`);
      closeMovie();
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      toast.error('Failed to mark as watched');
    }
  };

  const handleUnwatched = async (movieId: number) => {
    if (!accessToken) return;

    try {
      await toggleWatched(movieId, false);
      toast.success('Removed from watched list');
    } catch (error) {
      console.error('Error unmarking movie as watched:', error);
      toast.error('Failed to unmark as watched');
    }
  };

  // Sort movies based on current sort option
  const getSortedMovies = (movies: any[]) => {
    const sortedMovies = [...movies];
    
    switch (sortBy) {
      case 'newest':
        return sortedMovies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      case 'oldest':
        return sortedMovies.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      case 'title':
        return sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating':
        return sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      case 'release-newest':
        return sortedMovies.sort((a, b) => new Date(b.release_date || '1900-01-01').getTime() - new Date(a.release_date || '1900-01-01').getTime());
      case 'release-oldest':
        return sortedMovies.sort((a, b) => new Date(a.release_date || '1900-01-01').getTime() - new Date(b.release_date || '1900-01-01').getTime());
      default:
        return sortedMovies;
    }
  };

  // Filter movies based on watched status
  const getFilteredMovies = (movies: any[]) => {
    switch (filterBy) {
      case 'watched':
        return movies.filter(movie => watchedMovieIds.has(movie.id));
      case 'unwatched':
        return movies.filter(movie => !watchedMovieIds.has(movie.id));
      case 'all':
      default:
        return movies;
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'title': return 'A-Z';
      case 'rating': return 'Highest Rated';
      case 'release-newest': return 'Release Date (Newest)';
      case 'release-oldest': return 'Release Date (Oldest)';
      default: return 'Newest First';
    }
  };

  const sortedLikedMovies = getSortedMovies(likedMovies);
  const sortedPartnerMovies = getSortedMovies(partnerLikedMovies);

  // Apply filter to the sorted movies
  const filteredLikedMovies = getFilteredMovies(sortedLikedMovies);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Heart className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to see your saved movies</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Always visible header section */}
        <div className="mb-6 space-y-4">
          {/* Explanation text - always visible */}
          <p className="text-slate-300 text-lg text-center max-w-2xl mx-auto">
            {viewMode === 'mine' 
              ? "Your personal movie collection - all the movies you'd love to watch"
              : hasPartner 
                ? `Explore ${partnerName}'s saved movies to find what they want to watch`
                : "Connect with a partner to see their saved movies"}
          </p>

          {/* Toggle Buttons - always visible */}
          <div className="flex justify-center">
            <div className="inline-flex gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
              <Button
                variant={viewMode === 'mine' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mine')}
                className={viewMode === 'mine' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'}
              >
                <Heart className="size-4 mr-2" />
                My List
              </Button>
              <Button
                variant={viewMode === 'partner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('partner')}
                className={viewMode === 'partner' 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'}
              >
                <Users className="size-4 mr-2" />
                Partner's List
              </Button>
            </div>
          </div>

          {/* Sort Dropdown - Show when viewing "My List" and has movies */}
          {viewMode === 'mine' && likedMovies.length > 0 && (
            <div className="flex items-center gap-3 md:justify-between">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
                <label className="text-sm font-medium text-slate-300 hidden md:block">Show:</label>
                <Select value={filterBy} onValueChange={(value: 'all' | 'unwatched' | 'watched') => setFilterBy(value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1 md:w-fit">
                    <div className="flex items-center gap-2 truncate md:overflow-visible">
                      <Filter className="size-4 md:hidden flex-shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Movies</SelectItem>
                    <SelectItem value="unwatched">Unwatched</SelectItem>
                    <SelectItem value="watched">Watched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
                <label className="text-sm font-medium text-slate-300 hidden md:block">Sort by:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1 md:w-fit md:max-w-[280px]">
                    <div className="flex items-center gap-2 truncate md:overflow-visible">
                      <ArrowUpDown className="size-4 md:hidden flex-shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Recently Added</SelectItem>
                    <SelectItem value="oldest">First Added</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="release-newest">Release Date (Newest First)</SelectItem>
                    <SelectItem value="release-oldest">Release Date (Oldest First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {loading ? (
          <MovieCardSkeletonGrid count={8} />
        ) : (
          /* Display movies based on view mode */
          viewMode === 'mine' ? (
            filteredLikedMovies.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="size-20 mx-auto mb-6 text-slate-700" />
                <h3 className="text-2xl font-semibold text-white mb-3">No movies yet</h3>
                <p className="text-slate-400 text-lg">Start liking movies in the Discover tab to build your watchlist</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLikedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={true}
                    isWatched={watchedMovieIds.has(movie.id)}
                    onLike={() => {}}
                    onUnlike={() => handleUnlike(movie.id)}
                    onClick={() => openMovie(movie)}
                    onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
                    onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
                    onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
                    onYearClick={(year) => navigateToDiscoverWithFilter('year', year)}
                    projectId={projectId}
                    publicAnonKey={publicAnonKey}
                  />
                ))}
              </div>
            )
          ) : (
            sortedPartnerMovies.length === 0 ? (
              <div className="text-center py-20">
                <Users className="size-20 mx-auto mb-6 text-slate-700" />
                <h3 className="text-2xl font-semibold text-white mb-3">{partnerName ? `${partnerName} hasn't liked any movies yet` : "No partner connected"}</h3>
                <p className="text-slate-400 text-lg">{partnerName ? "They can start liking movies in the Discover tab" : "Connect with a partner in the Profile tab"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedPartnerMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovies.some(m => m.id === movie.id)}
                    onLike={() => handleLike(movie)}
                    onUnlike={() => handleUnlike(movie.id)}
                    onClick={() => openMovie(movie)}
                    onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
                    onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
                    onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
                    onYearClick={(year) => navigateToDiscoverWithFilter('year', year)}
                    projectId={projectId}
                    publicAnonKey={publicAnonKey}
                  />
                ))}
              </div>
            )
          )
        )}
      </div>

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={modalOpen}
        onClose={closeMovie}
        isLiked={selectedMovie ? likedMovies.some(m => m.id === selectedMovie.id) : false}
        onLike={() => selectedMovie && handleLike(selectedMovie)}
        onUnlike={() => selectedMovie && handleUnlike(selectedMovie.id)}
        onDislike={() => {}}
        isWatched={watchedMovieIds.has(selectedMovie?.id)}
        onGenreClick={(genre) => navigateToDiscoverWithFilter('genre', genre)}
        onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
        onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
        onLanguageClick={() => {}}
        isLikeLoading={isLikeLoading}
        isDislikeLoading={false}
        isWatchedLoading={watchedLoadingIds.has(selectedMovie?.id)}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
        onWatched={() => selectedMovie && handleWatched(selectedMovie)}
        onUnwatched={() => selectedMovie && handleUnwatched(selectedMovie.id)}
      />
    </div>
  );
}