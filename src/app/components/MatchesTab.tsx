import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Movie } from '../../types/movie';
import { API_BASE_URL } from '../../utils/api';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import {
  Users,
  Heart,
  UserX,
  Check,
  X,
  Bell,
  Tv,
  ArrowUpDown,
  Filter,
  Loader2,
  LayoutGrid,
  List,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMovieModal } from '../hooks/useMovieModal';
import { STREAMING_SERVICES } from '../../constants/streaming';
import { bulkFetchCachedRatings, fetchMissingRatings, onRatingFetched } from '../../utils/imdbRatings';
import { PartnerConnectCard } from './PartnerConnectCard';
import { useUserInteractions } from './UserInteractionsContext';
import { useWatchedActions } from '../hooks/useWatchedActions';
import { MatchesCache } from '../hooks/useTabCache';

interface MatchesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  matchesCache: MatchesCache | null;
  setMatchesCache: React.Dispatch<React.SetStateAction<MatchesCache | null>>;
  matchNotificationCount: number;
}

export function MatchesTab({ accessToken, projectId, publicAnonKey, navigateToDiscoverWithFilter, globalImdbCache, setGlobalImdbCache, matchesCache, setMatchesCache, matchNotificationCount }: MatchesTabProps) {
  const { watchedMovieIds, isWatched, watchedLoadingIds } = useUserInteractions();
  const [partner, setPartner] = useState<any>(matchesCache?.partner ?? null);
  const [matchedMovies, setMatchedMovies] = useState<Movie[]>(matchesCache?.matchedMovies ?? []);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'year-new' | 'year-old'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'list'>(() => {
    return (localStorage.getItem('duoreel-viewmode-matches') as 'grid' | 'compact' | 'list') || 'grid';
  });
  const handleViewMode = (mode: 'grid' | 'compact' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('duoreel-viewmode-matches', mode);
  };

  // Enrichment state
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  // IMDb ratings keyed by tmdbId to avoid external_ids dependency
  const [imdbRatings, setImdbRatings] = useState<Map<number, string>>(new Map());

  // Invite code state
  const [inviteCode, setInviteCode] = useState(matchesCache?.inviteCode ?? '');
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const { selectedMovie, modalOpen, openMovie, closeMovie } = useMovieModal(accessToken);

  const { handleWatched, handleUnwatched } = useWatchedActions({ accessToken, closeMovie });

  const [likedMovies, setLikedMovies] = useState<Set<number>>(new Set());

  const baseUrl = API_BASE_URL;

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partnerRes, incomingRes, outgoingRes, matchesRes, inviteCodeRes] = await Promise.all([
        fetch(`${baseUrl}/partner`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/requests/incoming`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/requests/outgoing`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/movies/matches`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/partner/invite-code`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const partnerData = await partnerRes.json();
      setPartner(partnerData.partner || null);

      const incomingData = await incomingRes.json();
      setIncomingRequests(incomingData.requests || []);

      const outgoingData = await outgoingRes.json();
      setOutgoingRequests(outgoingData.requests || []);

      const matchesData = await matchesRes.json();
      if (matchesData.movies) {
        setMatchedMovies(matchesData.movies);
        setLikedMovies(new Set(matchesData.movies.map((m: Movie) => m.id)));
        setEnrichedIds(new Set());
        enrichingRef.current = new Set();
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

      await fetch(`${baseUrl}/notifications/matches/seen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseUrl]);

  useEffect(() => {
    if (!accessToken) return;

    // Skip fetch if cache exists and no new matches have appeared since last load.
    // matchNotificationCount > matchCountAtLoad means new matches → must re-fetch.
    if (matchesCache && matchNotificationCount <= matchesCache.matchCountAtLoad) {
      return;
    }

    fetchData();
  }, [accessToken, fetchData, matchesCache, matchNotificationCount]);

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

  // ── Provider enrichment ────────────────────────────────────────────────────
  useEffect(() => {
    if (matchedMovies.length === 0 || !accessToken) return;
    const enrichMovies = async () => {
      const toEnrich = matchedMovies.filter(m => !enrichedIds.has(m.id) && !enrichingRef.current.has(m.id));
      if (toEnrich.length === 0) return;
      toEnrich.forEach(m => enrichingRef.current.add(m.id));

      const BATCH = 3;
      for (let i = 0; i < toEnrich.length; i += BATCH) {
        const batch = toEnrich.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(async (movie) => {
            const res = await fetch(`${baseUrl}/movies/${movie.id}`, {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            });
            if (!res.ok) return null;
            return res.json();
          }),
        );

        setMatchedMovies(prev => prev.map(movie => {
          const idx = batch.findIndex(b => b.id === movie.id);
          if (idx === -1) return movie;
          const result = results[idx];
          if (result.status !== 'fulfilled' || !result.value) return movie;
          const d = result.value;
          return {
            ...movie,
            runtime:           d.runtime           || movie.runtime,
            director:          d.credits?.crew?.find((c) => c.job === 'Director')?.name || movie.director,
            actors:            d.credits?.cast?.slice(0, 5).map((a) => a.name)           || movie.actors,
            genres:            d.genres             || movie.genres,
            'watch/providers': d['watch/providers'] || movie['watch/providers'],
            external_ids:      d.external_ids       || (movie as any).external_ids,
          };
        }));

        setEnrichedIds(prev => {
          const s = new Set(prev);
          batch.forEach(m => s.add(m.id));
          return s;
        });

        if (i + BATCH < toEnrich.length) await new Promise(r => setTimeout(r, 200));
      }
    };
    enrichMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedMovies.length, accessToken]);

  // ── Filtered + sorted view ─────────────────────────────────────────────────
  const filteredAndSortedMovies = useMemo(() => {
    let movies = [...matchedMovies];

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
        break;
    }

    return movies;
  }, [matchedMovies, selectedService, sortBy]);

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
    try {
      const res = await fetch(`${baseUrl}/partner/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to accept request'); }
      else { toast.success('Partner request accepted!'); fetchData(); }
    } catch { toast.error('Failed to accept request'); }
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

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;
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
    toast.success('📋 Invite link copied! Send it to your partner.');
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
                    <Button onClick={() => handleAcceptRequest(request.fromUserId)} className="bg-green-600 hover:bg-green-700" size="sm">
                      <Check className="size-4 mr-1" />Accept
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

        {/* Partner Connection */}
        {loading && !partner ? null : partner ? (
          /* ── Compact connected strip ── */
          <div className="flex items-center gap-3 px-4 py-2.5 mb-6 bg-slate-800/40 border border-slate-700/60 rounded-xl">
            <Avatar className="size-8 ring-2 ring-pink-500/40 flex-shrink-0">
              <AvatarImage src={partner.photoUrl} />
              <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-600 text-white text-xs">
                {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Heart className="size-3.5 text-pink-500 fill-pink-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium truncate">{partner.name || 'Partner'}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-950/30 text-xs h-7 px-2"
                >
                  <UserX className="size-3.5 mr-1" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Disconnect partner?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will remove your connection with {partner.name || 'your partner'}. You'll lose all your movie matches and will need to reconnect to find matches again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemovePartner}
                    className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : !loading ? (
          /* ── Full connection card (no partner) ── */
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="size-6" />Partner Connection
              </CardTitle>
              <CardDescription className="text-slate-400">
                Connect with your partner to find movie matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        ) : null}

        {/* Matched Movies heading */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Heart className="size-8 text-pink-500 fill-pink-500" />
            Your Matches
          </h2>
          <p className="text-slate-400">Movies you both want to watch</p>
        </div>

        {/* ── Filter & Sort bar ── */}
        {!loading && partner && matchedMovies.length > 0 && (
          <div className="flex items-center gap-3 md:justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
              <label className="text-sm font-medium text-slate-300 hidden md:block">Service:</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1 md:w-fit md:min-w-[160px]">
                  <div className="flex items-center gap-2 truncate md:overflow-visible">
                    <Tv className="size-4 md:hidden flex-shrink-0" />
                    <SelectValue />
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

            <div className="flex items-center gap-3 flex-1 md:flex-initial max-w-[calc(50%-6px)] md:max-w-none">
              <label className="text-sm font-medium text-slate-300 hidden md:block">Sort by:</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1 md:w-fit md:min-w-[160px]">
                  <div className="flex items-center gap-2 truncate md:overflow-visible">
                    <ArrowUpDown className="size-4 md:hidden flex-shrink-0" />
                    <SelectValue />
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
          </div>
        )}

        {/* View mode toggle */}
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

        {/* Match count */}
        {!loading && partner && matchedMovies.length > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            {filteredAndSortedMovies.length === matchedMovies.length
              ? `${matchedMovies.length} match${matchedMovies.length !== 1 ? 'es' : ''}`
              : `${filteredAndSortedMovies.length} of ${matchedMovies.length} matches (filtered)`}
          </p>
        )}

        {/* ── Grid / empty states ── */}
        {loading ? (
          <MovieCardSkeletonGrid count={8} />
        ) : !partner ? (
          <div className="text-center py-20">
            <Users className="size-20 mx-auto mb-6 text-slate-700" />
            <h3 className="text-2xl font-semibold text-white mb-3">No Partner Connected</h3>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Connect with your partner above to start finding movies you both love!
            </p>
          </div>
        ) : matchedMovies.length === 0 ? (
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
              No matches on {activeServiceLabel || 'this service'}
            </h3>
            <p className="text-slate-400 mb-6">
              None of your {matchedMovies.length} matches are currently streaming there.
            </p>
            <Button
              variant="ghost"
              onClick={() => setSelectedService('all')}
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
                    onLike={() => {}}
                    onUnlike={() => handleUnlike(movie.id)}
                    onDislike={() => handleDislike(movie.id)}
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
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAndSortedMovies.map((movie) => {
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
                        {/* Match badge */}
                        <div className="absolute top-2 right-2">
                          <span className="bg-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Heart className="size-2.5 fill-white" />Match
                          </span>
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

            {/* ── List view ── */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredAndSortedMovies.map((movie) => {
                  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '';
                  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                  const imdbRating = imdbRatings.get(movie.id);
                  const isWatchedMovie = watchedMovieIds.has(movie.id);
                  return (
                    <div
                      key={movie.id}
                      className={`group flex gap-3 bg-gradient-to-r from-slate-800/50 to-slate-900/80 border border-slate-700/50 hover:border-slate-600 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                      onClick={() => openMovie(movie)}
                    >
                      <div className="relative w-14 flex-shrink-0">
                        {posterUrl
                          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-6 text-slate-600" /></div>
                        }
                      </div>
                      <div className="flex-1 py-2.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white text-sm leading-tight truncate">{movie.title}</p>
                          <span className="bg-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
                            <Heart className="size-2.5 fill-white" />Match
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {[year, runtime, movie.genres?.[0]?.name].filter(Boolean).join(' · ')}
                        </p>
                        {movie.director && <p className="text-slate-500 text-xs mt-0.5">Dir: {movie.director}</p>}
                      </div>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={modalOpen}
        onClose={closeMovie}
        isLiked={selectedMovie ? likedMovies.has(selectedMovie.id) : false}
        onLike={() => {}}
        onUnlike={() => selectedMovie && handleUnlike(selectedMovie.id)}
        onDislike={() => selectedMovie && handleDislike(selectedMovie.id)}
        isWatched={selectedMovie ? watchedMovieIds.has(selectedMovie.id) : false}
        isWatchedLoading={selectedMovie ? watchedLoadingIds.has(selectedMovie.id) : false}
        onWatched={() => selectedMovie && handleWatched(selectedMovie)}
        onUnwatched={() => selectedMovie && handleUnwatched(selectedMovie.id)}
        onGenreClick={(genre) => navigateToDiscoverWithFilter('genre', genre)}
        onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
        onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
        onLanguageClick={(language) => navigateToDiscoverWithFilter('year', language)}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
        imdbRatingFromCard={selectedMovie?.external_ids?.imdb_id
          ? (globalImdbCache.get(selectedMovie.external_ids.imdb_id) || null)
          : null}
      />
    </div>
  );
}