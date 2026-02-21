import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Heart, Link as LinkIcon, Loader2, Users, X, Check, UserX, Bell, Copy, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { MovieCard } from './MovieCard';
import { MovieCardSkeletonGrid } from './MovieCardSkeleton';
import { MovieDetailModal } from './MovieDetailModal';
import { useMovieModal } from '../hooks/useMovieModal';

interface MatchesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  navigateToDiscoverWithFilter: (filterType: 'genre' | 'director' | 'actor' | 'year', value: string | number) => void;
}

// Streaming services — same set used in AdvancedFiltersModal
const STREAMING_SERVICES = [
  { label: 'Netflix',      value: '8',   logo: 'https://image.tmdb.org/t/p/original/9A1JSVmSxsyaBK4SUFsYVqbAYfW.jpg' },
  { label: 'Amazon',       value: '9',   logo: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { label: 'Disney+',      value: '337', logo: 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
  { label: 'Max',          value: '384', logo: 'https://image.tmdb.org/t/p/original/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg' },
  { label: 'Apple TV+',    value: '350', logo: 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { label: 'Hulu',         value: '15',  logo: 'https://image.tmdb.org/t/p/original/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
  { label: 'Paramount+',   value: '531', logo: 'https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' },
  { label: 'Peacock',      value: '387', logo: 'https://image.tmdb.org/t/p/original/xTHltMrZPAJFLkuXDpEAFnD1WRa.jpg' },
];

export function MatchesTab({ accessToken, projectId, publicAnonKey, navigateToDiscoverWithFilter }: MatchesTabProps) {
  const [partner, setPartner] = useState<any>(null);
  const [matchedMovies, setMatchedMovies] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');

  // Filter / sort state
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'year-new' | 'year-old'>('default');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  // Enrichment state (watch/providers, director, actors, runtime)
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  // Invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // Movie modal state from hook
  const { selectedMovie, modalOpen, openMovie, closeMovie, isLoadingDeepLink } = useMovieModal(accessToken);
  const [likedMovies, setLikedMovies] = useState<Set<number>>(new Set());
  const [globalImdbCache, setGlobalImdbCache] = useState<Map<string, string>>(new Map());

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  const fetchData = async () => {
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
        // Reset enrichment so new matches get enriched
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
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchData();
  }, [accessToken]);

  // Fetch IMDb ratings for matched movies (with caching)
  useEffect(() => {
    if (!accessToken || matchedMovies.length === 0) return;

    const fetchImdbRatings = async () => {
      const tmdbIds = matchedMovies
        .filter(movie => !movie.imdbRating)
        .map(movie => movie.id);
      if (tmdbIds.length === 0) return;

      try {
        const response = await fetch(`${baseUrl}/imdb-ratings/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbIds }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.ratings) {
          setMatchedMovies(prev => prev.map(movie => {
            const rating = data.ratings[movie.id];
            if (rating && rating !== 'N/A' && !movie.imdbRating) {
              return { ...movie, imdbRating: rating };
            }
            return movie;
          }));
        }
      } catch (error) {
        console.log('Error fetching IMDb ratings:', error);
      }
    };

    fetchImdbRatings();
  }, [matchedMovies.length, accessToken]);

  // Enrich matched movies with streaming provider data, director, actors, runtime.
  // Uses the same batch pattern as MoviesTab — 3 concurrent requests, 200 ms gap between
  // batches so we don't hammer the TMDb proxy.
  useEffect(() => {
    if (matchedMovies.length === 0 || !accessToken) return;

    const enrichMovies = async () => {
      const toEnrich = matchedMovies.filter(
        m => !enrichedIds.has(m.id) && !enrichingRef.current.has(m.id),
      );
      if (toEnrich.length === 0) return;

      // Mark as in-progress so a re-render doesn't kick off duplicates
      toEnrich.forEach(m => enrichingRef.current.add(m.id));

      const BATCH_SIZE = 3;
      for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
        const batch = toEnrich.slice(i, i + BATCH_SIZE);

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
          const detail = result.value;
          return {
            ...movie,
            runtime:          detail.runtime          || movie.runtime,
            director:         detail.credits?.crew?.find((c: any) => c.job === 'Director')?.name || movie.director,
            actors:           detail.credits?.cast?.slice(0, 5).map((a: any) => a.name)           || movie.actors,
            genres:           detail.genres            || movie.genres,
            'watch/providers': detail['watch/providers'] || movie['watch/providers'],
          };
        }));

        setEnrichedIds(prev => {
          const updated = new Set(prev);
          batch.forEach(m => updated.add(m.id));
          return updated;
        });

        if (i + BATCH_SIZE < toEnrich.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    };

    enrichMovies();
    // We intentionally only re-run when the *count* changes (new matches loaded),
    // not on every matchedMovies mutation — same strategy as IMDb rating effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedMovies.length, accessToken]);

  // ── Filtered + sorted view ────────────────────────────────────────────────
  const filteredAndSortedMovies = useMemo(() => {
    let movies = [...matchedMovies];

    // Provider filter — OR logic: show a movie if it's on ANY selected platform
    if (selectedProviders.size > 0) {
      movies = movies.filter(movie => {
        const providers: any[] = movie['watch/providers']?.results?.US?.flatrate || [];
        return providers.some((p: any) => selectedProviders.has(String(p.provider_id)));
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
        // Keep insertion order (most-recently-matched first as returned by the server)
        break;
    }

    return movies;
  }, [matchedMovies, selectedProviders, sortBy]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleSendRequest = async () => {
    if (!accessToken || !partnerEmail) return;
    setSaving(true);
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
        fetchData();
      }
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptRequest = async (fromUserId: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${baseUrl}/partner/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to accept request');
      } else {
        toast.success('Partner request accepted!');
        fetchData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (fromUserId: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${baseUrl}/partner/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fromUserId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to reject request');
      } else {
        toast.success('Partner request rejected');
        fetchData();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleRemovePartner = async () => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to remove your partner connection?')) return;
    try {
      const response = await fetch(`${baseUrl}/partner/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to remove partner');
      } else {
        toast.success('Partner removed');
        fetchData();
      }
    } catch (error) {
      console.error('Error removing partner:', error);
      toast.error('Failed to remove partner');
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
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => { const s = new Set(prev); s.delete(movieId); return s; });
        toast.success('Removed from your list');
      }
    } catch (error) {
      console.error('Error unliking movie:', error);
      toast.error('Failed to unlike movie');
    }
  };

  const handleDislike = async (movieId: number) => {
    if (!accessToken) return;
    try {
      const movie = matchedMovies.find(m => m.id === movieId);
      if (!movie) return;
      const [unlikeResponse, dislikeResponse] = await Promise.all([
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
      if (unlikeResponse.ok && dislikeResponse.ok) {
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => { const s = new Set(prev); s.delete(movieId); return s; });
        toast.success('Removed from matches');
      }
    } catch (error) {
      console.error('Error disliking movie:', error);
      toast.error('Failed to dislike movie');
    }
  };

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

  // Provider toggle helper
  const toggleProvider = (value: string) => {
    setSelectedProviders(prev => {
      const updated = new Set(prev);
      if (updated.has(value)) updated.delete(value);
      else updated.add(value);
      return updated;
    });
  };

  // Friendly label for the filtered-empty state
  const selectedProviderLabels = Array.from(selectedProviders)
    .map(id => STREAMING_SERVICES.find(s => s.value === id)?.label)
    .filter(Boolean)
    .join(', ');

  // ── Partner Connection UI (reused in empty-state) ─────────────────────────
  const PartnerConnectionUI = (
    <div className="space-y-4">
      {outgoingRequests.length > 0 && (
        <div className="mb-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 font-medium mb-1">Pending Request</p>
          {outgoingRequests.map((request) => (
            <p key={request.toUserId} className="text-slate-300 text-sm">
              Waiting for response from {request.toEmail || request.toUserId}
            </p>
          ))}
        </div>
      )}

      {/* Invite link section */}
      <div className="bg-slate-900/50 border border-slate-700 border-dashed rounded-lg p-4">
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
              <Button onClick={handleCopyInviteLink} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                <Copy className="size-4 mr-2" />Copy
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800 px-3 text-slate-500 font-semibold">or connect by email</span>
        </div>
      </div>

      {/* Email input section */}
      <div className="space-y-2">
        <Label htmlFor="partnerEmailMatches" className="text-white text-sm">Partner's Email</Label>
        <div className="flex gap-2">
          <Input
            id="partnerEmailMatches"
            type="email"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
            placeholder="partner@example.com"
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Button
            onClick={handleSendRequest}
            disabled={saving || !partnerEmail || outgoingRequests.length > 0}
            className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
          >
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LinkIcon className="size-4 mr-2" />}
            Send Request
          </Button>
        </div>
        <p className="text-xs text-slate-500">They'll need to accept your request</p>
      </div>
    </div>
  );

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Users className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view matches</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Incoming Partner Requests */}
        {incomingRequests.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="size-6 text-blue-500" />
                Partner Requests
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

        {/* Partner Connection Section */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="size-6" />
              Partner Connection
            </CardTitle>
            <CardDescription className="text-slate-400">
              Connect with your partner to find movie matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {partner ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl">
                <Avatar className="size-20 ring-4 ring-pink-500/30">
                  <AvatarImage src={partner.photoUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-600 text-white text-2xl">
                    {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-pink-400 font-medium mb-2">
                    <Heart className="size-5 fill-pink-400" />Connected
                  </div>
                  <p className="text-white text-xl font-semibold">{partner.name || 'Partner'}</p>
                  <p className="text-slate-400">{partner.email}</p>
                </div>
                <Button
                  onClick={handleRemovePartner}
                  variant="outline"
                  className="w-full sm:w-auto bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
                >
                  <UserX className="size-4 mr-2" />Remove Partner
                </Button>
              </div>
            ) : (
              PartnerConnectionUI
            )}
          </CardContent>
        </Card>

        {/* ── Matched Movies Section ─────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Heart className="size-8 text-pink-500 fill-pink-500" />
            Your Matches
          </h2>
          <p className="text-slate-400">Movies you both want to watch</p>
        </div>

        {/* ── Filter & Sort Bar ──────────────────────────────────────────── */}
        {!loading && partner && matchedMovies.length > 0 && (
          <div className="mb-6 space-y-3">

            {/* Streaming platform pills */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Available on:</p>
              <div className="flex flex-wrap gap-2">
                {STREAMING_SERVICES.map((service) => {
                  const isSelected = selectedProviders.has(service.value);
                  return (
                    <button
                      key={service.value}
                      onClick={() => toggleProvider(service.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <img
                        src={service.logo}
                        alt={service.label}
                        className="size-4 rounded object-cover flex-shrink-0"
                      />
                      {service.label}
                    </button>
                  );
                })}
                {selectedProviders.size > 0 && (
                  <button
                    onClick={() => setSelectedProviders(new Set())}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="size-3" />Clear
                  </button>
                )}
              </div>
            </div>

            {/* Count + Sort row — same visual rhythm as SavedMoviesTab */}
            <div className="flex items-center gap-3 md:justify-between">
              {/* Match count */}
              <p className="text-sm text-slate-500 flex-1">
                {filteredAndSortedMovies.length === matchedMovies.length
                  ? `${matchedMovies.length} match${matchedMovies.length !== 1 ? 'es' : ''}`
                  : `${filteredAndSortedMovies.length} of ${matchedMovies.length} matches (filtered)`}
              </p>

              {/* Sort dropdown — styled like SavedMoviesTab */}
              <div className="flex items-center gap-3 flex-initial">
                <label className="text-sm font-medium text-slate-300 hidden md:block">Sort by:</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-fit min-w-[160px]">
                    <div className="flex items-center gap-2">
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
          </div>
        )}

        {/* ── Movie Grid / Empty States ──────────────────────────────────── */}
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
              Start liking movies in the Discover tab. When you both like the same movie, it'll appear here!
            </p>
          </div>
        ) : filteredAndSortedMovies.length === 0 ? (
          /* Filtered-empty state */
          <div className="text-center py-20">
            <Filter className="size-16 mx-auto mb-6 text-slate-700" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No matches on {selectedProviderLabels || 'selected platforms'}
            </h3>
            <p className="text-slate-400 mb-6">Try selecting different streaming services or clear the filter.</p>
            <Button
              variant="ghost"
              onClick={() => setSelectedProviders(new Set())}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
            >
              Show all {matchedMovies.length} matches
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
        isWatched={false}
        onGenreClick={(genre) => navigateToDiscoverWithFilter('genre', genre)}
        onDirectorClick={(director) => navigateToDiscoverWithFilter('director', director)}
        onActorClick={(actor) => navigateToDiscoverWithFilter('actor', actor)}
        onLanguageClick={(language) => navigateToDiscoverWithFilter('year', language)}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
      />
    </div>
  );
}
