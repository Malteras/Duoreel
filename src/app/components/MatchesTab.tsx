import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Movie } from '../../types/movie';
import { API_BASE_URL } from '../../utils/api';
import { MovieCard } from './MovieCard';
import { CompactMovieCard } from './CompactMovieCard';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { MovieDetailModal } from './MovieDetailModal';
import { useEnrichMovies } from '../hooks/useEnrichMovies';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Users,
  Heart,
  Check,
  X,
  Bell,
  Tv,
  ArrowUpDown,
  Filter,
  Loader2,
  Film,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMovieModal } from '../hooks/useMovieModal';
import { STREAMING_SERVICES } from '../../constants/streaming';
import { bulkFetchCachedRatings, fetchMissingRatings, onRatingFetched, readLocalImdbCache, writeBulkLocalImdbCache } from '../../utils/imdbRatings';
import { PartnerConnectCard } from './PartnerConnectCard';
import { useUserInteractions } from './UserInteractionsContext';
import { useWatchedActions } from '../hooks/useWatchedActions';
import { MatchesCache } from '../hooks/useTabCache';
import { WatchedFilterSelect, WatchedFilter } from './WatchedFilterSelect';
import { ViewToggle } from './ViewToggle';
import { PickTonightScreen } from './PickTonightScreen';

interface MatchesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year' | 'keyword', value: string | number, extra?: string) => void;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  matchesCache: MatchesCache | null;
  setMatchesCache: React.Dispatch<React.SetStateAction<MatchesCache | null>>;
  matchNotificationCount: number;
  cardViewMode: 'grid' | 'compact' | 'list';
  setCardViewMode: (mode: 'grid' | 'compact' | 'list') => void;
}

export function MatchesTab({ accessToken, projectId, publicAnonKey, navigateToDiscoverWithFilter, globalImdbCache, setGlobalImdbCache, matchesCache, setMatchesCache, matchNotificationCount, cardViewMode: cardViewModeProp, setCardViewMode }: MatchesTabProps) {
  const { watchedMovieIds, isWatched, watchedLoadingIds, partnerWatchedIds, partnerName } = useUserInteractions();
  const [partner, setPartner] = useState<any>(matchesCache?.partner ?? null);
  const [matchedMovies, setMatchedMovies] = useState<Movie[]>(matchesCache?.matchedMovies ?? []);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [pendingInvites, setPendingInvites] = useState<{ inviterId: string; inviterName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'year-new' | 'year-old'>('default');
  const [filterBy, setFilterBy] = useState<WatchedFilter>('unwatched');
  const [showPickTonight, setShowPickTonight] = useState(false);
  // View mode — shared across all tabs via AppLayout
  const viewMode = cardViewModeProp;
  const handleViewMode = setCardViewMode;

  const baseUrl = API_BASE_URL;

  // Enrichment — delegated to shared hook
  const { resetEnrichment } = useEnrichMovies({
    movies: matchedMovies,
    setMovies: setMatchedMovies as (updater: (prev: Movie[]) => Movie[]) => void,
    publicAnonKey,
    baseUrl,
    batchSize: 3,
    dep: accessToken,
  });

  // IMDb ratings keyed by tmdbId to avoid external_ids dependency
  const [imdbRatings, setImdbRatings] = useState<Map<number, string>>(() => readLocalImdbCache());

  // Invite code state
  const [inviteCode, setInviteCode] = useState(matchesCache?.inviteCode ?? '');
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const { selectedMovie, modalOpen, openMovie, closeMovie } = useMovieModal(accessToken);

  const { handleWatched, handleUnwatched } = useWatchedActions({ accessToken, closeMovie });

  const [likedMovies, setLikedMovies] = useState<Set<number>>(
    new Set((matchesCache?.matchedMovies ?? []).map((m: Movie) => m.id))
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchInFlightRef = useRef(false);
  const fetchData = useCallback(async (showSpinner = true) => {
    // Prevent concurrent fetches — if one is already running, skip
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    if (showSpinner) setLoading(true);
    try {
      const [partnerRes, incomingRes, outgoingRes, matchesRes, inviteCodeRes, pendingRes] = await Promise.all([
        fetch(`${baseUrl}/partner`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/requests/incoming`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/requests/outgoing`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/movies/matches`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/invite-code`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/pending`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const partnerData = await partnerRes.json();
      setPartner(partnerData.partner || null);

      const incomingData = await incomingRes.json();
      setIncomingRequests(incomingData.requests || []);

      const outgoingData = await outgoingRes.json();
      setOutgoingRequests(outgoingData.requests || []);

      const pendingData = await pendingRes.json();
      setPendingInvites(pendingData.pending || []);

      const matchesData = await matchesRes.json();
      if (matchesData.movies) {
        setMatchedMovies(matchesData.movies);
        setLikedMovies(new Set(matchesData.movies.map((m: Movie) => m.id)));
        resetEnrichment();
      }

      const inviteData = await inviteCodeRes.json();
      if (inviteData.code) setInviteCode(inviteData.code);

      // Write cache — next visit skips fetch unless new match notifications arrive
      setMatchesCache({
        matchedMovies: matchesData.movies || [],
        partner: partnerData.partner || null,
        inviteCode: inviteData.code || '',
        matchCountAtLoad: matchNotificationCount,
      });

      // Fire-and-forget — must not delay showing matches
      fetch(`${baseUrl}/notifications/matches/seen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [accessToken, baseUrl, matchNotificationCount]);

  const matchesCacheRef = useRef(matchesCache);
  matchesCacheRef.current = matchesCache;

  useEffect(() => {
    if (!accessToken) return;

    const cache = matchesCacheRef.current;

    // Skip fetch entirely if cache is fresh (no new matches)
    if (cache && matchNotificationCount <= cache.matchCountAtLoad) {
      return;
    }

    // If cache exists but stale, refresh silently in background
    if (cache) {
      fetchData(false);
      return;
    }

    // No cache — fetch with loading spinner
    fetchData(true);
  }, [accessToken, fetchData, matchNotificationCount]);

  // ── IMDb ratings — keyed by tmdbId to avoid external_ids dependency ────────
  useEffect(() => {
    if (matchedMovies.length === 0) return;

    const fetchRatings = async () => {
      const tmdbIds = matchedMovies.map(m => m.id);

      // Step 1: bulk-fetch whatever is already in the cache
      const cached = await bulkFetchCachedRatings(tmdbIds, projectId, publicAnonKey);

      if (cached.size > 0) {
        // Store by tmdbId — no external_ids lookup needed for card display
        setImdbRatings(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            if (value.rating) updated.set(tmdbId, value.rating);
          });
          return updated;
        });
        writeBulkLocalImdbCache(
          [...cached.entries()]
            .filter(([, v]) => v.rating && v.rating !== 'NOT_FOUND')
            .map(([tmdbId, v]) => ({
              tmdbId,
              rating: v.rating,
              releaseDate: matchedMovies.find(m => m.id === tmdbId)?.release_date,
            }))
        );

        // Also populate globalImdbCache for movies that DO have external_ids
        // (used by MovieDetailModal's imdbRatingFromCard prop)
        setGlobalImdbCache(prev => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            const imdbId = matchedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
            if (imdbId && value.rating) updated.set(imdbId, value.rating);
          });
          return updated;
        });
      }

      // Step 2: background-fetch ratings not yet in the cache.
      // Include ALL movies (not just those with external_ids) so uncached
      // ratings are fetched even when external_ids is missing.
      const moviesNeedingRatings = matchedMovies.filter(
        m => !cached.has(m.id) && !imdbRatings.has(m.id)
      );
      if (moviesNeedingRatings.length > 0) {
        const visibleIds = new Set(matchedMovies.slice(0, 8).map(m => m.id));
        fetchMissingRatings(moviesNeedingRatings, visibleIds, projectId, publicAnonKey);
      }
    };

    fetchRatings();
  }, [matchedMovies.length, publicAnonKey]);

  // Listen for background fetch updates from fetchMissingRatings
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      // Always store by tmdbId for card display
      setImdbRatings(prev => new Map(prev).set(tmdbId, rating));

      // Also store by imdbId for modal (only if external_ids available)
      const imdbId = matchedMovies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) {
        setGlobalImdbCache(prev => new Map(prev).set(imdbId, rating));
      }
    });
    return unsubscribe;
  }, [matchedMovies]);

  // ── Filtered + sorted view ─────────────────────────────────────────────────
  const filteredAndSortedMovies = useMemo(() => {
    let movies = [...matchedMovies];

    if (filterBy === 'unwatched') {
      movies = movies.filter(m => !watchedMovieIds.has(m.id));
    } else if (filterBy === 'watched') {
      movies = movies.filter(m => watchedMovieIds.has(m.id));
    }

    if (selectedService !== 'all') {
      movies = movies.filter(movie => {
        const flatrate = movie['watch/providers']?.results?.US?.flatrate || [];
        return flatrate.some((p) => String(p.provider_id) === selectedService);
      });
    }

    switch (sortBy) {
      case 'rating':
        movies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'year-new':
        movies.sort((a, b) =>
          new Date(b.release_date || '1900').getTime() - new Date(a.release_date || '1900').getTime()
        );
        break;
      case 'year-old':
        movies.sort((a, b) =>
          new Date(a.release_date || '1900').getTime() - new Date(b.release_date || '1900').getTime()
        );
        break;
      default:
        movies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        break;
    }

    return movies;
  }, [matchedMovies, filterBy, watchedMovieIds, selectedService, sortBy]);

  const hiddenWatchedCount = useMemo(
    () => matchedMovies.filter(m => watchedMovieIds.has(m.id)).length,
    [matchedMovies, watchedMovieIds]
  );

  const activeServiceLabel = STREAMING_SERVICES.find(s => s.value === selectedService)?.label;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendRequest = async () => {
    if (!accessToken || !partnerEmail) return;
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/partner/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ partnerEmail }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to send request'); }
      else { toast.success('Partner request sent!'); setPartnerEmail(''); fetchData(); }
    } catch { toast.error('Failed to send partner request'); }
    finally { setSaving(false); }
  };

  const handleAcceptRequest = async (fromUserId: string) => {
    if (!accessToken) return;
    setAcceptingRequestId(fromUserId);
    try {
      const res = await fetch(`${baseUrl}/partner/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to accept request'); setAcceptingRequestId(null); }
      else { toast.success('Partner request accepted!'); fetchData(); }
    } catch { toast.error('Failed to accept request'); setAcceptingRequestId(null); }
  };

  const handleRejectRequest = async (fromUserId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${baseUrl}/partner/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to reject request'); }
      else { toast.success('Partner request rejected'); fetchData(); }
    } catch { toast.error('Failed to reject request'); }
  };

  const handleAcceptInvite = async (inviterId: string) => {
    if (!accessToken) return;
    setAcceptingInviteId(inviterId);
    try {
      const res = await fetch(`${baseUrl}/partner/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId: inviterId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to accept invite'); setAcceptingInviteId(null); }
      else {
        toast.success('🎬 Connected! Start finding movies to watch together.');
        setPendingInvites(prev => prev.filter(i => i.inviterId !== inviterId));
        fetchData(false);
      }
    } catch { toast.error('Failed to accept invite'); setAcceptingInviteId(null); }
  };

  const handleDeclineInvite = async (inviterId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${baseUrl}/partner/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId: inviterId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to decline invite'); }
      else {
        toast.success('Invite declined');
        setPendingInvites(prev => prev.filter(i => i.inviterId !== inviterId));
      }
    } catch { toast.error('Failed to decline invite'); }
  };

  const handleRemovePartner = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${baseUrl}/partner/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to remove partner'); }
      else { toast.success('Partner removed'); fetchData(); }
    } catch { toast.error('Failed to remove partner'); }
  };

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<number>>(new Set());

  const handleLike = async (movie: Movie) => {
    if (!accessToken) return;
    setIsLikeLoading(true);
    try {
      const response = await fetch(`${baseUrl}/movies/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ movie }),
      });
      if (response.ok) {
        setLikedMovies(prev => new Set(prev).add(movie.id));
        toast.success(`Saved "${movie.title}"`);
      }
    } catch {
      toast.error('Failed to save movie');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;
    setIsLikeLoading(true);
    setLikeLoadingIds((prev) => new Set(prev).add(movieId));
    try {
      const res = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => { const s = new Set(prev); s.delete(movieId); return s; });
        toast.success('Removed from your list');
      }
    } catch { toast.error('Failed to unlike movie'); }
    finally {
      setIsLikeLoading(false);
      setLikeLoadingIds((prev) => { const s = new Set(prev); s.delete(movieId); return s; });
    }
  };

  const handleDislike = async (movieId: number) => {
    if (!accessToken) return;
    try {
      const [unlikeRes, dislikeRes] = await Promise.all([
        fetch(`${baseUrl}/movies/like/${movieId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${baseUrl}/movies/dislike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ movieId }),
        }),
      ]);
      if (unlikeRes.ok && dislikeRes.ok) {
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => { const s = new Set(prev); s.delete(movieId); return s; });
        toast.success('Removed from matches');
      }
    } catch { toast.error('Failed to dislike movie'); }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
  };

  const handleRegenerateCode = async () => {
    if (!accessToken) return;
    setRegeneratingCode(true);
    try {
      const res = await fetch(`${baseUrl}/partner/regenerate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.code) { setInviteCode(data.code); toast.success('✨ New invite link generated!'); }
    } catch { toast.error('Failed to regenerate invite code'); }
    finally { setRegeneratingCode(false); }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center text-white">
          <Users className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view matches</h2>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ minHeight: '100dvh' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Pending invite-link requests */}
        {pendingInvites.map(invite => (
          <div key={invite.inviterId} className="flex items-center gap-4 bg-slate-800/50 border border-pink-500/30 rounded-2xl px-5 py-4 mb-4 animate-fade-in-up">
            <div className="size-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Heart className="size-5 text-pink-400 fill-pink-400" />
            </div>
            <p className="flex-1 text-white text-sm font-medium">
              <span className="text-pink-400">{invite.inviterName}</span> invited you to be movie partners
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => handleAcceptInvite(invite.inviterId)}
                disabled={acceptingInviteId === invite.inviterId}
                className="bg-pink-600 hover:bg-pink-700 cursor-pointer"
              >
                {acceptingInviteId === invite.inviterId
                  ? <><Loader2 className="size-4 mr-1 animate-spin" />Accepting...</>
                  : <><Check className="size-4 mr-1" />Accept</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeclineInvite(invite.inviterId)}
                className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700/50 cursor-pointer"
              >
                <X className="size-4 mr-1" />Decline
              </Button>
            </div>
          </div>
        ))}

        {/* Incoming Partner Requests */}
        {incomingRequests.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="size-6 text-blue-500" />Partner Requests
              </CardTitle>
              <CardDescription className="text-slate-400">
                You have {incomingRequests.length} pending request{incomingRequests.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {incomingRequests.map((request) => (
                <div key={request.fromUserId} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{request.fromName}</p>
                    <p className="text-slate-400 text-sm">{request.fromEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.fromUserId)}
                      disabled={acceptingRequestId === request.fromUserId}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {acceptingRequestId === request.fromUserId
                        ? <><Loader2 className="size-4 mr-1 animate-spin" />Accepting...</>
                        : <><Check className="size-4 mr-1" />Accept</>}
                    </Button>
                    <Button onClick={() => handleRejectRequest(request.fromUserId)} variant="outline" className="bg-slate-800 border-slate-600 text-red-400 hover:bg-red-950 hover:text-red-300" size="sm">
                      <X className="size-4 mr-1" />Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Partner Connection — shown only when no partner is connected */}
        {!partner && !loading && (
          <div className="max-w-lg mx-auto mb-8">
            <div className="text-center mb-10">
              <Users className="size-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Partner Connected</h3>
              <p className="text-slate-400 text-center">Connect with your partner below to start finding movies you both love!</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Users className="size-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Partner Connection</h3>
                  <p className="text-slate-400 text-sm">Connect with your partner to find movie matches</p>
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
                sending={saving}
                outgoingRequests={outgoingRequests}
                inputId="partnerEmailMatches"
              />
            </div>
          </div>
        )}

        {/* ── Heading + controls ── */}
        {partner && (
          <div className="mb-4">
            {/* Row 1: Title + (mobile: Sort + View toggle) | (desktop: centered title) */}
            <div className="flex items-center justify-between md:justify-center mb-3">
              <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-1">
                <div className="flex items-center gap-2">
                  <Heart className="size-5 md:size-7 text-pink-500 fill-pink-500 flex-shrink-0" />
                  <h2 className="text-lg md:text-3xl font-bold text-white leading-tight">Your Matches</h2>
                </div>
                <p className="text-slate-400 text-xs md:text-sm hidden md:block">Movies you both want to watch</p>
              </div>

              {/* Mobile: Sort + View toggle on heading row */}
              {!loading && matchedMovies.length > 0 && (
                <div className="md:hidden flex items-center gap-2 flex-shrink-0">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white max-w-[140px] h-8 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ArrowUpDown className="size-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate"><SelectValue /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Recently Matched</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="year-new">Newest First</SelectItem>
                      <SelectItem value="year-old">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                  <ViewToggle value={viewMode} onChange={handleViewMode} />
                </div>
              )}
            </div>

            {/* Pick Tonight — desktop header button */}
            {!loading && matchedMovies.length >= 3 && (
              <div className="hidden md:flex justify-center mb-3">
                <button
                  type="button"
                  onClick={() => setShowPickTonight(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-all cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  Pick Tonight
                </button>
              </div>
            )}

            {/* Row 2 (mobile): Show + Service filters full width | (desktop): all controls */}
            {!loading && matchedMovies.length > 0 && (
              <div className="flex items-center gap-2 overflow-hidden">
                {/* Show filter */}
                <div className="flex flex-1 min-w-0 md:flex-none items-center gap-2">
                  <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Show:</label>
                  <WatchedFilterSelect value={filterBy} onChange={setFilterBy} />
                </div>

                {/* Service filter */}
                <div className="flex flex-1 min-w-0 md:flex-none items-center gap-2">
                  <label className="text-sm font-medium text-slate-300 hidden md:block whitespace-nowrap">Service:</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-full md:min-w-[110px] md:w-auto h-8 text-sm min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Tv className="size-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate"><SelectValue /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {STREAMING_SERVICES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <img src={s.logo} alt={s.label} className="size-4 rounded object-cover flex-shrink-0" />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort — desktop only (mobile sort is in heading row) */}
                <div className="hidden md:flex flex-none items-center gap-2 ml-auto">
                  <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Sort by:</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-[155px] h-8 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ArrowUpDown className="size-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate"><SelectValue /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Recently Matched</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="year-new">Newest First</SelectItem>
                      <SelectItem value="year-old">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View toggle — desktop only */}
                <div className="hidden md:block">
                  <ViewToggle value={viewMode} onChange={handleViewMode} />
                </div>
              </div>
            )}

            {/* Match count — centered below filter row, matching Saved tab pattern */}
            {!loading && matchedMovies.length > 0 && (
              <p className="text-sm text-slate-500 text-center mt-2">
                {filteredAndSortedMovies.length === matchedMovies.length
                  ? `${matchedMovies.length} match${matchedMovies.length !== 1 ? 'es' : ''}`
                  : `Showing ${filteredAndSortedMovies.length} of ${matchedMovies.length} matches`}
                {filterBy === 'unwatched' && hiddenWatchedCount > 0 && (
                  <>
                    {' · '}
                    <button
                      onClick={() => setFilterBy('all')}
                      className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline cursor-pointer"
                    >
                      {hiddenWatchedCount} watched {hiddenWatchedCount === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                    </button>
                  </>
                )}
                {filterBy === 'watched' && (matchedMovies.length - hiddenWatchedCount) > 0 && (
                  <>
                    {' · '}
                    <button
                      onClick={() => setFilterBy('all')}
                      className="text-xs text-slate-500 hover:text-blue-400 transition-colors inline cursor-pointer"
                    >
                      {matchedMovies.length - hiddenWatchedCount} unwatched {(matchedMovies.length - hiddenWatchedCount) === 1 ? 'movie' : 'movies'} hidden · <span className="underline">Show all</span>
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {/* ── Grid / empty states ── */}
        {loading ? (
          <MovieCardSkeletonGrid count={8} viewMode={viewMode === 'compact' ? 'compact' : 'grid'} />
        ) : !partner ? null : matchedMovies.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="size-20 mx-auto mb-6 text-slate-700" />
            <h3 className="text-2xl font-semibold text-white mb-3">No Matches Yet</h3>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Start saving movies in the Discover tab. When you both save the same movie, it'll appear here!
            </p>
          </div>
        ) : filteredAndSortedMovies.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="size-16 mx-auto mb-6 text-slate-700" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {filterBy === 'unwatched' && hiddenWatchedCount === matchedMovies.length
                ? "You've watched all your matches!"
                : filterBy === 'watched'
                ? 'No watched matches yet'
                : `No matches on ${activeServiceLabel || 'this service'}`}
            </h3>
            <p className="text-slate-400 mb-6">
              {filterBy === 'unwatched' && hiddenWatchedCount === matchedMovies.length
                ? `All ${matchedMovies.length} matched movies are marked as watched.`
                : filterBy === 'watched'
                ? 'Mark movies as watched from the matches grid to see them here.'
                : `None of your ${matchedMovies.length} matches are currently streaming there.`}
            </p>
            <Button
              variant="ghost"
              onClick={() => { setFilterBy('all'); setSelectedService('all'); }}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
            >
              Show all matches
            </Button>
          </div>
        ) : (
          <>
            {/* ── Full grid ── */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovies.has(movie.id)}
                    isMatch={true}
                    isWatched={watchedMovieIds.has(movie.id)}
                    onLike={() => handleLike(movie)}
                    onUnlike={() => handleUnlike(movie.id)}
                    onDislike={() => handleDislike(movie.id)}
                    onClick={() => openMovie(movie)}
                    onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
                    onKeywordClick={(keywordId, keywordName) => navigateToDiscoverWithFilter('keyword', keywordId, keywordName)}
                    onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
                    onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
                    onYearClick={(year) => navigateToDiscoverWithFilter('year', year)}
                    projectId={projectId}
                    publicAnonKey={publicAnonKey}
                    globalImdbCache={globalImdbCache}
                    imdbRating={imdbRatings.get(movie.id)}
                    partnerWatchedIds={partnerWatchedIds}
                    partnerName={partnerName}
                  />
                ))}
              </div>
            )}

            {/* ─ Compact grid ── */}
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAndSortedMovies.map((movie) => (
                  <CompactMovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => openMovie(movie)}
                    isWatched={watchedMovieIds.has(movie.id)}
                    imdbRating={imdbRatings.get(movie.id)}
                    globalImdbCache={globalImdbCache}
                    onGenreClick={(genreId) => navigateToDiscoverWithFilter('genre', genreId)}
                    partnerWatchedIds={partnerWatchedIds}
                    partnerName={partnerName}
                    topLeftOverlay={
                      <button
                        className={`size-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors ${likeLoadingIds.has(movie.id) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={(e) => { e.stopPropagation(); if (!likeLoadingIds.has(movie.id)) handleUnlike(movie.id); }}
                        disabled={likeLoadingIds.has(movie.id)}
                        aria-label="Remove from saved list"
                      >
                        {likeLoadingIds.has(movie.id)
                          ? <Loader2 className="size-4 text-white animate-spin" />
                          : <svg className="size-4 fill-white text-white" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        }
                      </button>
                    }
                    topRightOverlay={
                      <span className="bg-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Heart className="size-2.5 fill-white" />Match
                      </span>
                    }
                  />
                ))}
              </div>
            )}

            {/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
                but not currently exposed in the UI toggle. To re-enable: add a List icon
                button to the toggle above calling handleViewMode('list').
            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredAndSortedMovies.map((movie) => { ... })}
              </div>
            )}
            ── end of list view dead code ── */}
          </>
        )}
      </div>

      {/* Mobile Pick Tonight FAB */}
      {partner && !loading && matchedMovies.length >= 3 && (
        <button
          type="button"
          className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer"
          onClick={() => setShowPickTonight(true)}
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
          <Sparkles className="size-4" />
          Pick Tonight
        </button>
      )}

      {/* Pick Tonight overlay */}
      {showPickTonight && (
        <PickTonightScreen
          movies={filteredAndSortedMovies}
          watchedIds={watchedMovieIds}
          partnerWatchedIds={partnerWatchedIds}
          onBack={() => setShowPickTonight(false)}
          onOpenMovie={openMovie}
        />
      )}

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={modalOpen}
        onClose={closeMovie}
        isLiked={selectedMovie ? likedMovies.has(selectedMovie.id) : false}
        onLike={() => selectedMovie && handleLike(selectedMovie)}
        onUnlike={() => selectedMovie && handleUnlike(selectedMovie.id)}
        onDislike={() => selectedMovie && handleDislike(selectedMovie.id)}
        isLikeLoading={isLikeLoading}
        showNotInterested={false}
        isWatched={selectedMovie ? watchedMovieIds.has(selectedMovie.id) : false}
        isWatchedLoading={selectedMovie ? watchedLoadingIds.has(selectedMovie.id) : false}
        onWatched={() => selectedMovie && handleWatched(selectedMovie)}
        onUnwatched={() => selectedMovie && handleUnwatched(selectedMovie.id)}
        onGenreClick={(genre) => navigateToDiscoverWithFilter('genre', genre)}
        onKeywordClick={(keywordId, keywordName) => navigateToDiscoverWithFilter('keyword', keywordId, keywordName)}
        onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
        onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
        onYearClick={(year) => navigateToDiscoverWithFilter('year', year)}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
        imdbRatingFromCard={selectedMovie?.external_ids?.imdb_id
          ? (globalImdbCache.get(selectedMovie.external_ids.imdb_id) || null)
          : null}
        partnerWatchedIds={partnerWatchedIds}
        partnerName={partnerName}
      />
    </div>
  );
}