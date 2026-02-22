import { useState, useEffect, useMemo } from 'react';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { useUserInteractions } from './UserInteractionsContext';
import { useMovieModal } from '../hooks/useMovieModal';
import { Bookmark, Users, Filter, ArrowUpDown, Upload, HelpCircle, Film, Link as LinkIcon, Copy, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useImportContext } from './ImportContext';
import { ImportDialog } from './ImportDialog';

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
  const { watchlist } = useImportContext();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Partner connection state (for the no-partner empty state)
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

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // Fetch partner info and partner's list
  useEffect(() => {
    if (!accessToken) return;

    const fetchPartnerData = async () => {
      setLoading(true);
      try {
        const [partnerRes, outgoingRes, inviteCodeRes] = await Promise.all([
          fetch(`${baseUrl}/partner`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${baseUrl}/partner/requests/outgoing`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${baseUrl}/partner/invite-code`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);

        const partnerData = await partnerRes.json();
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

        const outgoingData = await outgoingRes.json();
        setOutgoingRequests(outgoingData.requests || []);

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) setInviteCode(inviteData.code);
      } catch (error) {
        console.error('Error fetching partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [accessToken, viewMode]); // Re-fetch when switching to partner view

  // ── Partner connection helpers ─────────────────────────────
  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
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
        // Refresh outgoing requests
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

  // ── Partner Connection UI (same as Profile / Matches) ─────
  const PartnerConnectionUI = (
    <div className="max-w-lg mx-auto">
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

      {outgoingRequests.length > 0 && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 font-medium mb-1">Pending Request</p>
          {outgoingRequests.map((request) => (
            <p key={request.toUserId} className="text-slate-300 text-sm">
              Waiting for response from {request.toEmail || request.toUserId}
            </p>
          ))}
        </div>
      )}

      {/* Invite link section */}
      <div className="bg-slate-900/50 border border-slate-700 border-dashed rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="size-4 text-cyan-400" />
          <Label className="text-white font-semibold text-sm">Share Your Invite Link</Label>
        </div>

        {inviteCode ? (
          <>
            <div className="flex gap-2 mb-3">
              <Input
                value={`${window.location.origin}/invite/${inviteCode}`}
                readOnly
                className="bg-slate-800 border-slate-600 text-cyan-400 font-mono text-xs"
              />
              <Button
                onClick={handleCopyInviteLink}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                <Copy className="size-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Send this link to your partner — they'll need to accept your request
              </p>
              <Button
                onClick={handleRegenerateCode}
                disabled={regeneratingCode}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {regeneratingCode
                  ? <Loader2 className="size-3 mr-1 animate-spin" />
                  : <RotateCcw className="size-3 mr-1" />}
                <span className="text-xs">Regenerate</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading invite code...</span>
          </div>
        )}
      </div>

      {/* OR divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-3 text-slate-500 font-semibold">or connect by email</span>
        </div>
      </div>

      {/* Email input section */}
      <div className="space-y-2">
        <Label htmlFor="partnerEmailSaved" className="text-white text-sm">Partner's Email</Label>
        <div className="flex gap-2">
          <Input
            id="partnerEmailSaved"
            type="email"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
            placeholder="partner@example.com"
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Button
            onClick={handleSendRequest}
            disabled={sendingRequest || !partnerEmail || outgoingRequests.length > 0}
            className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
          >
            {sendingRequest ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LinkIcon className="size-4 mr-2" />}
            Send Request
          </Button>
        </div>
        <p className="text-xs text-slate-500">They'll need to accept your request</p>
      </div>
    </div>
  );

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
      await toggleWatched(movie.id, true, movie); // Fix 2: pass full movie for richer KV entry
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

  const sortedLikedMovies = useMemo(
    () => getSortedMovies(likedMovies),
    [likedMovies, sortBy]
  );
  const filteredLikedMovies = useMemo(
    () => getFilteredMovies(sortedLikedMovies),
    [sortedLikedMovies, filterBy, watchedMovieIds]
  );
  const sortedPartnerMovies = useMemo(
    () => getSortedMovies(partnerLikedMovies),
    [partnerLikedMovies, sortBy]
  );

  // Paginated slices for rendering
  const visibleLikedMovies = useMemo(
    () => filteredLikedMovies.slice(0, visibleCount),
    [filteredLikedMovies, visibleCount]
  );
  const visiblePartnerMovies = useMemo(
    () => sortedPartnerMovies.slice(0, visibleCount),
    [sortedPartnerMovies, visibleCount]
  );

  const hasMoreMovies = viewMode === 'mine'
    ? visibleCount < filteredLikedMovies.length
    : visibleCount < sortedPartnerMovies.length;

  // Reset pagination when filter, sort, or view mode changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterBy, sortBy, viewMode]);

  // Infinite scroll — load more movies when sentinel enters viewport
  useEffect(() => {
    if (!sentinelEl || !hasMoreMovies) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setLoadingMore(false);
          }, 150);
        }
      },
      { threshold: 0.1 }
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
                <Bookmark className="size-4 mr-2" />
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

          {/* Movie count */}
          {viewMode === 'mine' && filteredLikedMovies.length > 0 && (
            <p className="text-sm text-slate-500 text-center">
              Showing {Math.min(visibleCount, filteredLikedMovies.length)} of {filteredLikedMovies.length} movies
            </p>
          )}
          {viewMode === 'partner' && sortedPartnerMovies.length > 0 && (
            <p className="text-sm text-slate-500 text-center">
              Showing {Math.min(visibleCount, sortedPartnerMovies.length)} of {sortedPartnerMovies.length} movies
            </p>
          )}
        </div>

        {/* Loading indicator */}
        {loading ? (
          <MovieCardSkeletonGrid count={8} />
        ) : (
          /* Display movies based on view mode */
          viewMode === 'mine' ? (
            filteredLikedMovies.length === 0 ? (
              likedMovies.length === 0 ? (
                /* ── True empty state: no movies at all ── */
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <Upload className="size-20 mx-auto text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Your watchlist is empty
                  </h3>
                  <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                    Already have a Letterboxd account? Import your watchlist
                    instantly — or start discovering movies.
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Button
                      onClick={() => watchlist.setDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
                    >
                      <Upload className="size-4 mr-2" />
                      Import from Letterboxd
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHelpModalOpen(true)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"
                      title="How to export from Letterboxd"
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
                /* ── Filter empty state: has movies but filter hides them ── */
                <div className="text-center py-20">
                  <Filter className="size-16 mx-auto mb-6 text-slate-700" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No {filterBy === 'watched' ? 'watched' : 'unwatched'} movies
                  </h3>
                  <p className="text-slate-400">
                    {filterBy === 'watched'
                      ? "You haven't marked any saved movies as watched yet."
                      : "All your saved movies have been watched! Nice work."}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setFilterBy('all')}
                    className="mt-4 text-blue-400 hover:text-blue-300"
                  >
                    Show all movies
                  </Button>
                </div>
              )
            ) : (
              <>
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
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div
                ref={setSentinelEl}
                className="flex justify-center mt-8 h-12 items-center"
              >
                {loadingMore && (
                  <Film className="size-8 animate-spin text-slate-400" />
                )}
              </div>
              </>
            )
          ) : (
            /* ── Partner's List view ── */
            !hasPartner ? (
              /* No partner at all — show full connection UI */
              <div className="py-16 px-4">
                <div className="max-w-lg mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
                  {PartnerConnectionUI}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visiblePartnerMovies.map((movie) => (
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

              {/* Infinite scroll sentinel */}
              <div
                ref={setSentinelEl}
                className="flex justify-center mt-8 h-12 items-center"
              >
                {loadingMore && (
                  <Film className="size-8 animate-spin text-slate-400" />
                )}
              </div>
              </>
            )
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
            <div className="flex gap-3">
              <div className="flex-shrink-0 size-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</div>
              <div>
                <p className="text-white font-medium">Go to letterboxd.com</p>
                <p className="text-slate-400 text-sm">Sign in to your account</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 size-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">2</div>
              <div>
                <p className="text-white font-medium">Open Settings</p>
                <p className="text-slate-400 text-sm">Click your profile picture → Settings → Import & Export</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 size-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">3</div>
              <div>
                <p className="text-white font-medium">Export Your Data</p>
                <p className="text-slate-400 text-sm">Click "Export Your Data" — this downloads a .zip file</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 size-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">4</div>
              <div>
                <p className="text-white font-medium">Unzip and find your files</p>
                <p className="text-slate-400 text-sm">
                  Look for <span className="text-cyan-400 font-mono text-xs">watchlist.csv</span> (your
                  want-to-watch list) or <span className="text-cyan-400 font-mono text-xs">watched.csv</span> (movies
                  you've already seen)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 size-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">5</div>
              <div>
                <p className="text-white font-medium">Upload it here</p>
                <p className="text-slate-400 text-sm">Click "Import from Letterboxd" and upload the CSV file</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setHelpModalOpen(false);
              watchlist.setDialogOpen(true);
            }}
            className="w-full bg-green-600 hover:bg-green-700 mt-4"
          >
            <Upload className="size-4 mr-2" />
            Got it — Import now
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Import Watchlist Dialog (shared via ImportContext) ── */}
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
        onWatched={() => selectedMovie && handleWatched(selectedMovie)}
        onUnwatched={() => selectedMovie && handleUnwatched(selectedMovie.id)}
      />
    </div>
  );
}