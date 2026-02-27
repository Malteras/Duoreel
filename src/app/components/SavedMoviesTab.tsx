import { useState, useEffect, useMemo } from 'react';
import type { Movie } from '../../types/movie';
import { API_BASE_URL } from '../../utils/api';
import { bulkFetchCachedRatings, fetchMissingRatings, onRatingFetched } from '../../utils/imdbRatings';
import { MovieCard } from './MovieCard';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { MovieDetailModal } from './MovieDetailModal';
import { useMovieModal } from '../hooks/useMovieModal';
import { useWatchedActions } from '../hooks/useWatchedActions';
import { useEnrichMovies } from '../hooks/useEnrichMovies';
import { useUserInteractions } from './UserInteractionsContext';
import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Eye, EyeOff, LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useImportContext } from './ImportContext';
import { ImportDialog } from './ImportDialog';
import { PartnerConnectCard } from './PartnerConnectCard';

interface SavedMoviesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
  likedMovies: Movie[];
  setLikedMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  savedCache: import('../hooks/useTabCache').SavedCache | null;
  setSavedCache: React.Dispatch<React.SetStateAction<import('../hooks/useTabCache').SavedCache | null>>;
}

export function SavedMoviesTab({
  accessToken,
  projectId,
  publicAnonKey,
  navigateToDiscoverWithFilter,
  likedMovies,
  setLikedMovies,
  globalImdbCache,
  setGlobalImdbCache,
  savedCache,
  setSavedCache,
}: SavedMoviesTabProps) {
  const { watchedMovieIds, isWatched, watchedLoadingIds } = useUserInteractions();
  const { selectedMovie, modalOpen, openMovie, closeMovie, isLoadingDeepLink } = useMovieModal(accessToken);

  const { handleWatched, handleUnwatched } = useWatchedActions({ accessToken, closeMovie });

  const [partnerLikedMovies, setPartnerLikedMovies] = useState<Movie[]>(savedCache?.partnerLikedMovies ?? []);
  const [imdbRatings, setImdbRatings] = useState<Map<number, string>>(new Map());
  const [partnerName, setPartnerName] = useState<string>(savedCache?.partnerName ?? '');
  const [hasPartner, setHasPartner] = useState(savedCache?.hasPartner ?? false);
  const [loading, setLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'mine' | 'partner'>('mine');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'rating' | 'release-newest' | 'release-oldest'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'unwatched' | 'watched'>('unwatched');
  const [cardViewMode, setCardViewMode] = useState<'grid' | 'compact' | 'list'>(() => {
    return (localStorage.getItem('duoreel-viewmode-saved') as 'grid' | 'compact' | 'list') || 'grid';
  });
  const handleCardViewMode = (mode: 'grid' | 'compact' | 'list') => {
    setCardViewMode(mode);
    localStorage.setItem('duoreel-viewmode-saved', mode);
  };
  const [partnerFilterBy, setPartnerFilterBy] = useState<'all' | 'unwatched' | 'watched'>('all');
  const { watchlist } = useImportContext();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Partner connection state
  const [inviteCode, setInviteCode] = useState('');
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

  // Infinite scroll state
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const baseUrl = API_BASE_URL;

  // Fetch partner info and partner's list
  useEffect(() => {
    if (!accessToken) return;

    // Skip fetch if cache is valid: likedMovies hasn't grown since last Saved load.
    // Case 1 (no new saves): return immediately and show cached data.
    // Case 2 (user saved movies in Discover): likedMovies.length grew → re-fetch.
    // viewMode change always re-fetches regardless of cache.
    if (savedCache && savedCache.likedMoviesLengthAtLoad === likedMovies.length) {
      return;
    }

    const fetchPartnerData = async () => {
      setLoading(true);
      let fetchedPartnerLikedMovies: Movie[] = [];
      let fetchedPartnerName = '';
      let fetchedHasPartner = false;
      let fetchedInviteCode = '';
      let fetchedOutgoingRequests: any[] = [];

      try {
        const [partnerRes, outgoingRes, inviteCodeRes] = await Promise.all([
          fetch(`${baseUrl}/partner`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${baseUrl}/partner/requests/outgoing`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${baseUrl}/partner/invite-code`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);

        const partnerData = await partnerRes.json();
        if (partnerData.partner) {
          fetchedHasPartner = true;
          fetchedPartnerName = partnerData.partner.name || partnerData.partner.email;
          setHasPartner(true);
          setPartnerName(fetchedPartnerName);

          const partnerLikedResponse = await fetch(`${baseUrl}/movies/partner-liked`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const partnerLikedData = await partnerLikedResponse.json();
          if (!partnerLikedData.error) {
            fetchedPartnerLikedMovies = partnerLikedData.movies || [];
            setPartnerLikedMovies(fetchedPartnerLikedMovies);
          }
        } else {
          setHasPartner(false);
          setPartnerName('');
          setPartnerLikedMovies([]);
        }

        const outgoingData = await outgoingRes.json();
        fetchedOutgoingRequests = outgoingData.requests || [];
        setOutgoingRequests(fetchedOutgoingRequests);

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) {
          fetchedInviteCode = inviteData.code;
          setInviteCode(fetchedInviteCode);
        }

        // Write cache so the next visit can skip this fetch
        setSavedCache({
          partnerLikedMovies: fetchedPartnerLikedMovies,
          partnerName: fetchedPartnerName,
          hasPartner: fetchedHasPartner,
          inviteCode: fetchedInviteCode,
          outgoingRequests: fetchedOutgoingRequests,
          likedMoviesLengthAtLoad: likedMovies.length,
        });
      } catch (error) {
        console.error('Error fetching partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [accessToken, viewMode, likedMovies.length]);

  // ── Enrich movies missing detail data ──
  useEnrichMovies({
    movies: likedMovies,
    setMovies: setLikedMovies,
    publicAnonKey,
    baseUrl,
  });

  useEnrichMovies({
    movies: partnerLikedMovies,
    setMovies: setPartnerLikedMovies,
    publicAnonKey,
    baseUrl,
  });

  // Listen for individual rating updates
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      setImdbRatings(prev => new Map(prev).set(tmdbId, rating));
      const imdbId = likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) setGlobalImdbCache(prev => new Map(prev).set(imdbId, rating));
    });
    return unsubscribe;
  }, [likedMovies]);

  // ── Partner connection helpers ─────────────────────────────
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
    toast.success('📋 Invite link copied! Send it to your partner.');
  };

  const handleRegenerateCode = async () => {
    if (!accessToken) return;
    setRegeneratingCode(true);
    try {
      const response = await fetch(`${baseUrl}/partner/regenerate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (data.code) {
        setInviteCode(data.code);
        toast.success('✨ New invite link generated!');
      }
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      toast.error('Failed to regenerate invite code');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleSendRequest = async () => {
    if (!accessToken || !partnerEmail) return;
    setSendingRequest(true);
    try {
      const response = await fetch(`${baseUrl}/partner/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ partnerEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to send request');
      } else {
        toast.success('Partner request sent!');
        setPartnerEmail('');
        const outgoingRes = await fetch(`${baseUrl}/partner/requests/outgoing`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const outgoingData = await outgoingRes.json();
        setOutgoingRequests(outgoingData.requests || []);
      }
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
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

  const handleLike = async (movie: Movie) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${baseUrl}/movies/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ movie }),
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

  // Sort movies based on current sort option
  const getSortedMovies = (movies: Movie[]) => {
    const sortedMovies = [...movies];
    switch (sortBy) {
      case 'newest':   return sortedMovies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      case 'oldest':   return sortedMovies.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      case 'title':    return sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating':   return sortedMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      case 'release-newest': return sortedMovies.sort((a, b) => new Date(b.release_date || '1900-01-01').getTime() - new Date(a.release_date || '1900-01-01').getTime());
      case 'release-oldest': return sortedMovies.sort((a, b) => new Date(a.release_date || '1900-01-01').getTime() - new Date(b.release_date || '1900-01-01').getTime());
      default: return sortedMovies;
    }
  };

  // Filter movies based on watched status
  const getFilteredMovies = (movies: Movie[]) => {
    switch (filterBy) {
      case 'watched':   return movies.filter(movie => watchedMovieIds.has(movie.id));
      case 'unwatched': return movies.filter(movie => !watchedMovieIds.has(movie.id));
      default:          return movies;
    }
  };

  const sortedLikedMovies   = useMemo(() => getSortedMovies(likedMovies),        [likedMovies, sortBy]);
  const filteredLikedMovies = useMemo(() => getFilteredMovies(sortedLikedMovies), [sortedLikedMovies, filterBy, watchedMovieIds]);
  const sortedPartnerMovies   = useMemo(() => getSortedMovies(partnerLikedMovies), [partnerLikedMovies, sortBy]);
  const filteredPartnerMovies = useMemo(() => {
    switch (partnerFilterBy) {
      case 'watched':   return sortedPartnerMovies.filter(m => watchedMovieIds.has(m.id));
      case 'unwatched': return sortedPartnerMovies.filter(m => !watchedMovieIds.has(m.id));
      default:          return sortedPartnerMovies;
    }
  }, [sortedPartnerMovies, partnerFilterBy, watchedMovieIds]);

  const visibleLikedMovies   = useMemo(() => filteredLikedMovies.slice(0, visibleCount),   [filteredLikedMovies, visibleCount]);
  const visiblePartnerMovies = useMemo(() => filteredPartnerMovies.slice(0, visibleCount),  [filteredPartnerMovies, visibleCount]);
  const hiddenWatchedCount        = useMemo(() => likedMovies.filter(m => watchedMovieIds.has(m.id)).length,        [likedMovies, watchedMovieIds]);
  const hiddenPartnerWatchedCount = useMemo(() => partnerLikedMovies.filter(m => watchedMovieIds.has(m.id)).length, [partnerLikedMovies, watchedMovieIds]);

  // Fetch IMDb ratings — scoped to currently visible movies only.
  // Re-fires when visibleCount grows (infinite scroll loads more pages)
  // or when the movie list changes.
  useEffect(() => {
    if (likedMovies.length === 0) return;

    const fetchRatings = async () => {
      // Only fetch for the movies currently rendered on screen.
      // visibleLikedMovies is already computed as filteredLikedMovies.slice(0, visibleCount)
      // but at this point in the component, we need to derive it from the base list
      // because visibleLikedMovies is defined below in the render section.
      // Re-derive it here using the same logic: apply sort → filter → slice.
      const currentlyVisible = filteredLikedMovies.slice(0, visibleCount);

      if (currentlyVisible.length === 0) return;

      // Only request IDs we don't already have ratings for — avoids re-fetching
      // on every scroll when most ratings are already loaded.
      const tmdbIdsToFetch = currentlyVisible
        .filter(m => !imdbRatings.has(m.id))
        .map(m => m.id);

      if (tmdbIdsToFetch.length === 0) return; // All visible ratings already loaded

      const cached = await bulkFetchCachedRatings(tmdbIdsToFetch, projectId, publicAnonKey);

      if (cached.size > 0) {
        setImdbRatings(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            if (value.rating) updated.set(tmdbId, value.rating);
          });
          return updated;
        });
        setGlobalImdbCache(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            const imdbId = likedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
            if (imdbId && value.rating) updated.set(imdbId, value.rating);
          });
          return updated;
        });
      }

      // Background-fetch any that weren't in the cache
      const moviesNeedingRatings = currentlyVisible.filter(
        m => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id)
      );

      if (moviesNeedingRatings.length > 0) {
        const visibleIds = new Set(currentlyVisible.slice(0, 8).map(m => m.id));
        fetchMissingRatings(moviesNeedingRatings, visibleIds, projectId, publicAnonKey);
      }
    };

    fetchRatings();
  }, [likedMovies.length, visibleCount, filterBy, sortBy]);
  // Dependencies:
  // - likedMovies.length: new movie added to list
  // - visibleCount: user scrolled to next page → load ratings for new page
  // - filterBy / sortBy: visible set changed due to filter/sort change

  const hasMoreMovies = viewMode === 'mine'
    ? visibleCount < filteredLikedMovies.length
    : visibleCount < filteredPartnerMovies.length;

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filterBy, partnerFilterBy, sortBy, viewMode]);

  useEffect(() => {
    if (!sentinelEl || !hasMoreMovies) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => { setVisibleCount((prev) => prev + PAGE_SIZE); setLoadingMore(false); }, 150);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, hasMoreMovies, loadingMore]);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center text-white">
          <Bookmark className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to see your saved movies</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ minHeight: '100dvh' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6 space-y-4">
          <p className="hidden md:block text-slate-300 text-lg text-center max-w-2xl mx-auto">
            {viewMode === 'mine'
              ? "Your personal movie collection - all the movies you'd love to watch"
              : hasPartner
                ? `Explore ${partnerName}'s saved movies to find what they want to watch`
                : 'Connect with a partner to see their saved movies'}
          </p>

          {/* Toggle Buttons */}
          <div className="flex justify-center">
            <div className="inline-flex gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
              <Button
                variant={viewMode === 'mine' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mine')}
                className={viewMode === 'mine' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}
              >
                <Bookmark className="size-4 mr-2" />My List
              </Button>
              <Button
                variant={viewMode === 'partner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('partner')}
                className={viewMode === 'partner' ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}
              >
                <Users className="size-4 mr-2" />Partner's List
              </Button>
            </div>
          </div>

          {/* Sort / Filter — shown for both My List and Partner's List when there are movies */}
          {((viewMode === 'mine' && likedMovies.length > 0) || (viewMode === 'partner' && sortedPartnerMovies.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 md:justify-between">
              {/* Show filter */}
              <div className="flex items-center gap-2 min-w-0">
                <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Show:</label>
                <Select
                  value={viewMode === 'mine' ? filterBy : partnerFilterBy}
                  onValueChange={(value: 'all' | 'unwatched' | 'watched') =>
                    viewMode === 'mine' ? setFilterBy(value) : setPartnerFilterBy(value)
                  }
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[140px]">
                    <div className="flex items-center gap-2">
                      {(viewMode === 'mine' ? filterBy : partnerFilterBy) === 'unwatched' ? (
                        <EyeOff className="size-4 flex-shrink-0 text-slate-400" />
                      ) : (viewMode === 'mine' ? filterBy : partnerFilterBy) === 'watched' ? (
                        <Eye className="size-4 flex-shrink-0 text-slate-400" />
                      ) : (
                        <Filter className="size-4 flex-shrink-0 text-slate-400" />
                      )}
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

              {/* Sort */}
              <div className="flex items-center gap-2 min-w-0 md:ml-auto">
                <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Sort by:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[160px]">
                    <div className="flex items-center gap-2 truncate md:overflow-visible">
                      <ArrowUpDown className="size-4 md:hidden flex-shrink-0 text-slate-400" />
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

              {/* View mode toggle — Large (default) vs Compact grid */}
              <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
                <button
                  onClick={() => handleCardViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${cardViewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="Large card view"
                  title="Large cards"
                >
                  <LayoutList className="size-3.5" />
                </button>
                <button
                  onClick={() => handleCardViewMode('compact')}
                  className={`p-1.5 rounded transition-colors ${cardViewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="Compact grid view"
                  title="Compact grid"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Movie count + hidden filter hint */}
          {viewMode === 'mine' && filteredLikedMovies.length > 0 && (
            <p className="text-sm text-slate-500 text-center">
              Showing {Math.min(visibleCount, filteredLikedMovies.length)} of {filteredLikedMovies.length} movies
              {filterBy === 'unwatched' && hiddenWatchedCount > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={() => setFilterBy('all')}
                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline"
                  >
                    {hiddenWatchedCount} watched {hiddenWatchedCount === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                  </button>
                </>
              )}
              {filterBy === 'watched' && (likedMovies.length - hiddenWatchedCount) > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={() => setFilterBy('all')}
                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline"
                  >
                    {likedMovies.length - hiddenWatchedCount} unwatched {(likedMovies.length - hiddenWatchedCount) === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                  </button>
                </>
              )}
            </p>
          )}
          {viewMode === 'partner' && filteredPartnerMovies.length > 0 && (
            <p className="text-sm text-slate-500 text-center">
              Showing {Math.min(visibleCount, filteredPartnerMovies.length)} of {filteredPartnerMovies.length} movies
              {partnerFilterBy === 'unwatched' && hiddenPartnerWatchedCount > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={() => setPartnerFilterBy('all')}
                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline"
                  >
                    {hiddenPartnerWatchedCount} watched {hiddenPartnerWatchedCount === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                  </button>
                </>
              )}
              {partnerFilterBy === 'watched' && (partnerLikedMovies.length - hiddenPartnerWatchedCount) > 0 && (
                <>
                  {' · '}
                  <button
                    onClick={() => setPartnerFilterBy('all')}
                    className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline"
                  >
                    {partnerLikedMovies.length - hiddenPartnerWatchedCount} unwatched {(partnerLikedMovies.length - hiddenPartnerWatchedCount) === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <MovieCardSkeletonGrid count={8} />
        ) : viewMode === 'mine' ? (
          filteredLikedMovies.length === 0 ? (
            likedMovies.length === 0 ? (
              /* True empty state */
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <Upload className="size-20 mx-auto text-slate-600" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Your watchlist is empty</h3>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  Already have a Letterboxd account? Import your watchlist instantly — or start discovering movies.
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Button onClick={() => watchlist.setDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-6">
                    <Upload className="size-4 mr-2" />Import from Letterboxd
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setHelpModalOpen(true)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"
                    title="How to export from Letterboxd"
                    aria-label="How to export from Letterboxd"
                  >
                    <HelpCircle className="size-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                  <Film className="size-4" />
                  <span>Or browse the Discover tab to find movies you'll love</span>
                </div>
              </div>
            ) : (
              /* Filter empty state */
              <div className="text-center py-20">
                <Filter className="size-16 mx-auto mb-6 text-slate-700" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No {filterBy === 'watched' ? 'watched' : 'unwatched'} movies
                </h3>
                <p className="text-slate-400">
                  {filterBy === 'watched'
                    ? "You haven't marked any saved movies as watched yet."
                    : 'All your saved movies have been watched! Nice work.'}
                </p>
                <Button variant="ghost" onClick={() => setFilterBy('all')} className="mt-4 text-blue-400 hover:text-blue-300">
                  Show all movies
                </Button>
              </div>
            )
          ) : (
            <>
              {/* ── Full grid ── */}
              {cardViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleLikedMovies.map((movie) => (
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
                      globalImdbCache={globalImdbCache}
                      imdbRating={imdbRatings.get(movie.id)}
                    />
                  ))}
                </div>
              )}

              {/* ── Compact grid ── */}
              {cardViewMode === 'compact' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {visibleLikedMovies.map((movie) => {
                    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
                    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                    const imdbRating = imdbRatings.get(movie.id);
                    const hasImdbId = (movie as any).external_ids?.imdb_id;
                    const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
                    const displayImdbRating = imdbRatings.get(movie.id) || (movie as any).imdbRating || (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);
                    const isWatchedMovie = watchedMovieIds.has(movie.id);
                    return (
                      <div
                        key={movie.id}
                        className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                        onClick={() => openMovie(movie)}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {posterUrl
                            ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-10 text-slate-600" /></div>
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                          <div className="absolute top-2 left-2">
                            <button
                              className="size-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleUnlike(movie.id); }}
                              aria-label="Remove from watchlist"
                            >
                              <svg className="size-4 fill-white text-white" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            </button>
                          </div>
                          {movie.vote_average > 0 && (
                            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                              <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                                <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                              </div>
                              {hasImdbId ? (
                                <a
                                  href={`https://www.imdb.com/title/${hasImdbId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                                    displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                                      ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                                      : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                                  }`}
                                >
                                  <span className={`text-[7px] font-bold uppercase tracking-wide ${
                                    displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
                                  }`}>IMDb</span>
                                  {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
                                    <span className="text-[10px] font-bold text-black">{displayImdbRating}</span>
                                  ) : displayImdbRating === 'NOT_FOUND' ? (
                                    <span className="text-[10px] font-bold text-black/40">—</span>
                                  ) : (
                                    <Loader2 className="size-2.5 text-black/50 animate-spin" />
                                  )}
                                </a>
                              ) : (
                                <div className="bg-[#F5C518]/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                  <span className="text-[7px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                                  <span className="text-[10px] font-bold text-black/40">—</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h3 className="text-xs font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-slate-300">
                            {year && <span>{year}</span>}
                            {year && runtime && <span className="text-slate-500">·</span>}
                            {runtime && <span>{runtime}</span>}
                          </div>
                          {movie.genres && movie.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {movie.genres.slice(0, 2).map((genre) => (
                                <span key={genre.id} className="bg-purple-600/70 text-white border border-purple-500 text-[9px] px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-purple-700" onClick={(e) => { e.stopPropagation(); navigateToDiscoverWithFilter('genre', genre.id); }}>{genre.name}</span>
                              ))}
                            </div>
                          )}
                          {movie.director && <div className="text-[10px] text-slate-400">Dir: <span className="text-slate-300">{movie.director}</span></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
                  but not currently exposed in the UI toggle. To re-enable: add a List icon
                  button to the toggle above calling handleCardViewMode('list').
              {cardViewMode === 'list' && (
                <div className="space-y-2">
                  {visibleLikedMovies.map((movie) => { ... })}
                </div>
              )}
              ── end of list view dead code ── */}

              <div ref={setSentinelEl} className="flex justify-center mt-8 h-12 items-center">
                {loadingMore && <Film className="size-8 animate-spin text-slate-400" />}
              </div>
            </>
          )
        ) : (
          /* ── Partner's List view ── */
          !hasPartner ? (
            <div className="py-16 px-4">
              <div className="max-w-lg mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
                {/* Card header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <Users className="size-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Partner Connection</h3>
                    <p className="text-slate-400 text-sm">Connect with your partner to see their saved movies</p>
                  </div>
                </div>
                <PartnerConnectCard
                  inviteCode={inviteCode}
                  onCopyLink={handleCopyInviteLink}
                  onRegenerate={handleRegenerateCode}
                  regenerating={regeneratingCode}
                  partnerEmail={partnerEmail}
                  onPartnerEmailChange={setPartnerEmail}
                  onSendRequest={handleSendRequest}
                  sending={sendingRequest}
                  outgoingRequests={outgoingRequests}
                  inputId="partnerEmailSaved"
                />
              </div>
            </div>
          ) : sortedPartnerMovies.length === 0 ? (
            <div className="text-center py-20">
              <Users className="size-20 mx-auto mb-6 text-slate-700" />
              <h3 className="text-2xl font-semibold text-white mb-3">{`${partnerName} hasn't saved any movies yet`}</h3>
              <p className="text-slate-400 text-lg">They can start saving movies in the Discover tab</p>
            </div>
          ) : (
            <>
              {/* ── Full grid (partner) ── */}
              {cardViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visiblePartnerMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      isLiked={likedMovies.some(m => m.id === movie.id)}
                      isWatched={watchedMovieIds.has(movie.id)}
                      onLike={() => handleLike(movie)}
                      onUnlike={() => handleUnlike(movie.id)}
                      onClick={() => openMovie(movie)}
                      onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
                      onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
                      onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
                      onYearClick={(year) => navigateToDiscoverWithFilter('year', year)}
                      projectId={projectId}
                      publicAnonKey={publicAnonKey}
                      globalImdbCache={globalImdbCache}
                      imdbRating={imdbRatings.get(movie.id)}
                    />
                  ))}
                </div>
              )}

              {/* ── Compact grid (partner) ── */}
              {cardViewMode === 'compact' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {visiblePartnerMovies.map((movie) => {
                    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
                    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                    const imdbRating = imdbRatings.get(movie.id);
                    const hasImdbId = (movie as any).external_ids?.imdb_id;
                    const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
                    const displayImdbRating = imdbRatings.get(movie.id) || (movie as any).imdbRating || (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);
                    const isWatchedMovie = watchedMovieIds.has(movie.id);
                    return (
                      <div
                        key={movie.id}
                        className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                        onClick={() => openMovie(movie)}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {posterUrl
                            ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-10 text-slate-600" /></div>
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                          {movie.vote_average > 0 && (
                            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                              <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                                <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                              </div>
                              {hasImdbId ? (
                                <a
                                  href={`https://www.imdb.com/title/${hasImdbId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                                    displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                                      ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                                      : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                                  }`}
                                >
                                  <span className={`text-[7px] font-bold uppercase tracking-wide ${
                                    displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
                                  }`}>IMDb</span>
                                  {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
                                    <span className="text-[10px] font-bold text-black">{displayImdbRating}</span>
                                  ) : displayImdbRating === 'NOT_FOUND' ? (
                                    <span className="text-[10px] font-bold text-black/40">—</span>
                                  ) : (
                                    <Loader2 className="size-2.5 text-black/50 animate-spin" />
                                  )}
                                </a>
                              ) : (
                                <div className="bg-[#F5C518]/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                  <span className="text-[7px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                                  <span className="text-[10px] font-bold text-black/40">—</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h3 className="text-xs font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-slate-300">
                            {year && <span>{year}</span>}
                            {year && runtime && <span className="text-slate-500">·</span>}
                            {runtime && <span>{runtime}</span>}
                          </div>
                          {movie.genres && movie.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {movie.genres.slice(0, 2).map((genre) => (
                                <span key={genre.id} className="bg-purple-600/70 text-white border border-purple-500 text-[9px] px-1.5 py-0.5 rounded-full">{genre.name}</span>
                              ))}
                            </div>
                          )}
                          {movie.director && <div className="text-[10px] text-slate-400">Dir: <span className="text-slate-300">{movie.director}</span></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── List view (partner) ── KEPT AS DEAD CODE: list layout is implemented and working
                  but not currently exposed in the UI toggle. To re-enable: add a List icon
                  button to the toggle above calling handleCardViewMode('list').
              {cardViewMode === 'list' && (
                <div className="space-y-2">
                  {visiblePartnerMovies.map((movie) => { ... })}
                </div>
              )}
              ── end of list view dead code ── */}

              <div ref={setSentinelEl} className="flex justify-center mt-8 h-12 items-center">
                {loadingMore && <Film className="size-8 animate-spin text-slate-400" />}
              </div>
            </>
          )
        )}
      </div>

      {/* ── Letterboxd Help Modal ── */}
      <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">How to Export from Letterboxd</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {[
              { n: 1, title: 'Go to letterboxd.com', desc: 'Sign in to your account', color: 'bg-blue-600' },
              { n: 2, title: 'Open Settings', desc: 'Click your profile picture → Settings → Import & Export', color: 'bg-blue-600' },
              { n: 3, title: 'Export Your Data', desc: 'Click "Export Your Data" — this downloads a .zip file', color: 'bg-blue-600' },
              { n: 4, title: 'Unzip and find your files', desc: 'Look for watchlist.csv or watched.csv', color: 'bg-blue-600' },
              { n: 5, title: 'Upload it here', desc: 'Click "Import from Letterboxd" and upload the CSV file', color: 'bg-green-600' },
            ].map(({ n, title, desc, color }) => (
              <div key={n} className="flex gap-3">
                <div className={`flex-shrink-0 size-7 rounded-full ${color} text-white text-sm font-bold flex items-center justify-center`}>{n}</div>
                <div>
                  <p className="text-white font-medium">{title}</p>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => { setHelpModalOpen(false); watchlist.setDialogOpen(true); }}
            className="w-full bg-green-600 hover:bg-green-700 mt-4"
          >
            <Upload className="size-4 mr-2" />Got it — Import now
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog ── */}
      <ImportDialog
        importState={watchlist}
        title="Import Movies from Letterboxd"
        description="Export your Letterboxd watchlist as CSV and paste it below. Format: Date, Name, Year, Letterboxd URI"
        buttonLabel="Import to Saved Movies"
        progressBarColor="bg-blue-600"
      />

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
        imdbRatingFromCard={selectedMovie ? ((selectedMovie as any).imdbRating || null) : null}
        onWatched={() => selectedMovie && handleWatched(selectedMovie)}
        onUnwatched={() => selectedMovie && handleUnwatched(selectedMovie.id)}
      />
    </div>
  );
}