import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Movie } from '../../types/movie';
import { API_BASE_URL } from '../../utils/api';
import { STREAMING_SERVICES } from '../../constants/streaming';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
import { Heart, Loader2, Users, X, Check, UserX, Bell, Filter, ArrowUpDown, Tv } from 'lucide-react';
import { toast } from 'sonner';
import { MovieCard } from './MovieCard';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { MovieDetailModal } from './MovieDetailModal';
import { useMovieModal } from '../hooks/useMovieModal';
import { PartnerConnectCard } from './PartnerConnectCard';
import { useUserInteractions } from './UserInteractionsContext';

interface MatchesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
}

export function MatchesTab({ accessToken, projectId, publicAnonKey, navigateToDiscoverWithFilter }: MatchesTabProps) {
  const { watchedMovieIds, toggleWatched, isWatched, watchedLoadingIds } = useUserInteractions();
  const [partner, setPartner] = useState<any>(null);
  const [matchedMovies, setMatchedMovies] = useState<Movie[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]); // partner request objects, not movies
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'year-new' | 'year-old'>('default');

  // Enrichment state
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  // Invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const { selectedMovie, modalOpen, openMovie, closeMovie } = useMovieModal(accessToken);
  const [likedMovies, setLikedMovies] = useState<Set<number>>(new Set());
  const [globalImdbCache, setGlobalImdbCache] = useState<Map<string, string>>(new Map());

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
        setLikedMovies(new Set(matchesData.movies.map((m: any) => m.id)));
        setEnrichedIds(new Set());
        enrichingRef.current = new Set();
      }

      const inviteData = await inviteCodeRes.json();
      if (inviteData.code) setInviteCode(inviteData.code);

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
    fetchData();
  }, [accessToken, fetchData]);

  // ── IMDb ratings ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || matchedMovies.length === 0) return;
    const fetchImdbRatings = async () => {
      const tmdbIds = matchedMovies.filter(m => !m.imdbRating).map(m => m.id);
      if (tmdbIds.length === 0) return;
      try {
        const res = await fetch(`${baseUrl}/imdb-ratings/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbIds }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.ratings) {
          setMatchedMovies(prev => prev.map(movie => {
            const rating = data.ratings[movie.id];
            return rating && rating !== 'N/A' && !movie.imdbRating ? { ...movie, imdbRating: rating } : movie;
          }));
        }
      } catch (err) {
        console.error('Error fetching IMDb ratings:', err);
      }
    };
    fetchImdbRatings();
  }, [matchedMovies.length, accessToken]);

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
            director:          d.credits?.crew?.find((c: any) => c.job === 'Director')?.name || movie.director,
            actors:            d.credits?.cast?.slice(0, 5).map((a: any) => a.name)           || movie.actors,
            genres:            d.genres             || movie.genres,
            'watch/providers': d['watch/providers'] || movie['watch/providers'],
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
        const flatrate: any[] = movie['watch/providers']?.results?.US?.flatrate || [];
        return flatrate.some((p: any) => String(p.provider_id) === selectedService);
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

  const handleWatched = async (movie: any) => {
    if (!accessToken) {
      toast.error('Please sign in to mark movies as watched');
      return;
    }
    try {
      await toggleWatched(movie.id, true, movie);
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
      <div className="max-w-6xl mx-auto px-4 py-8">

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
        {partner ? (
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
        ) : (
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
        )}

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
              />
            ))}
          </div>
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
        imdbRatingFromCard={selectedMovie ? ((selectedMovie as any).imdbRating || null) : null}
      />
    </div>
  );
}