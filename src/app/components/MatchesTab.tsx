import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Heart, Link as LinkIcon, Loader2, Users, X, Check, UserX, Bell } from 'lucide-react';
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

export function MatchesTab({ accessToken, projectId, publicAnonKey, navigateToDiscoverWithFilter }: MatchesTabProps) {
  const [partner, setPartner] = useState<any>(null);
  const [matchedMovies, setMatchedMovies] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  
  // Movie modal state from hook
  const { selectedMovie, modalOpen, openMovie, closeMovie, isLoadingDeepLink } = useMovieModal(accessToken);
  const [likedMovies, setLikedMovies] = useState<Set<number>>(new Set());
  const [globalImdbCache, setGlobalImdbCache] = useState<Map<string, string>>(new Map());

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch partner info
      const partnerResponse = await fetch(`${baseUrl}/partner`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const partnerData = await partnerResponse.json();
      if (partnerData.partner) {
        setPartner(partnerData.partner);
      } else {
        setPartner(null);
      }

      // Fetch incoming requests
      const incomingResponse = await fetch(`${baseUrl}/partner/requests/incoming`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const incomingData = await incomingResponse.json();
      setIncomingRequests(incomingData.requests || []);

      // Fetch outgoing requests
      const outgoingResponse = await fetch(`${baseUrl}/partner/requests/outgoing`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const outgoingData = await outgoingResponse.json();
      setOutgoingRequests(outgoingData.requests || []);

      // Fetch matched movies
      const matchesResponse = await fetch(`${baseUrl}/movies/matches`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const matchesData = await matchesResponse.json();
      if (matchesData.movies) {
        setMatchedMovies(matchesData.movies);
        // All matched movies are already liked by definition
        setLikedMovies(new Set(matchesData.movies.map((m: any) => m.id)));
      }
      
      // Mark matches as seen
      await fetch(`${baseUrl}/notifications/matches/seen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
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
      // Extract TMDb IDs that need ratings
      const tmdbIds = matchedMovies
        .filter(movie => !movie.imdbRating) // Only fetch if not already on movie object
        .map(movie => movie.id);

      if (tmdbIds.length === 0) return;

      try {
        // Use the new bulk endpoint
        const response = await fetch(`${baseUrl}/imdb-ratings/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tmdbIds })
        });

        if (!response.ok) {
          console.log('Failed to fetch bulk IMDb ratings');
          return;
        }

        const data = await response.json();
        
        // Attach ratings to movie objects
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

  const handleSendRequest = async () => {
    if (!accessToken || !partnerEmail) return;

    setSaving(true);
    try {
      const response = await fetch(`${baseUrl}/partner/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ partnerEmail })
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ fromUserId })
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ fromUserId })
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

    if (!confirm('Are you sure you want to remove your partner connection?')) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/partner/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
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
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.ok) {
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
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

      // First unlike it
      const unlikeResponse = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Then dislike it
      const dislikeResponse = await fetch(`${baseUrl}/movies/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ movieId })
      });

      if (unlikeResponse.ok && dislikeResponse.ok) {
        setMatchedMovies(prev => prev.filter(m => m.id !== movieId));
        setLikedMovies(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
        toast.success('Removed from matches');
      }
    } catch (error) {
      console.error('Error disliking movie:', error);
      toast.error('Failed to dislike movie');
    }
  };

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
                    <Button
                      onClick={() => handleAcceptRequest(request.fromUserId)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="size-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.fromUserId)}
                      variant="outline"
                      className="bg-slate-800 border-slate-600 text-red-400 hover:bg-red-950 hover:text-red-300"
                      size="sm"
                    >
                      <X className="size-4 mr-1" />
                      Reject
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
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl">
                  <Avatar className="size-20 ring-4 ring-pink-500/30">
                    <AvatarImage src={partner.photoUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-600 text-white text-2xl">
                      {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-pink-400 font-medium mb-2">
                      <Heart className="size-5 fill-pink-400" />
                      Connected
                    </div>
                    <p className="text-white text-xl font-semibold">{partner.name || 'Partner'}</p>
                    <p className="text-slate-400">{partner.email}</p>
                  </div>
                  <Button
                    onClick={handleRemovePartner}
                    variant="outline"
                    className="w-full sm:w-auto bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
                  >
                    <UserX className="size-4 mr-2" />
                    Remove Partner
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {outgoingRequests.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 font-medium mb-2">Pending Request</p>
                    {outgoingRequests.map((request) => (
                      <p key={request.toUserId} className="text-slate-300 text-sm">
                        Waiting for response from {request.toUserId}
                      </p>
                    ))}
                  </div>
                )}
                <Label htmlFor="partnerEmail" className="text-white text-base mb-3 block">
                  Enter your partner's email to send a connection request
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="partnerEmail"
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="bg-slate-900 border-slate-700 text-white text-lg h-12"
                  />
                  <Button 
                    onClick={handleSendRequest} 
                    disabled={saving || !partnerEmail || outgoingRequests.length > 0}
                    className="bg-pink-600 hover:bg-pink-700 h-12 px-6"
                  >
                    {saving ? <Loader2 className="size-5 mr-2 animate-spin" /> : <LinkIcon className="size-5 mr-2" />}
                    Send Request
                  </Button>
                </div>
                <p className="text-sm text-slate-400 mt-3">
                  Your partner must accept the request before you can see matches
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matched Movies Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Heart className="size-8 text-pink-500 fill-pink-500" />
            Your Matches
          </h2>
          <p className="text-slate-400">Movies you both want to watch</p>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {matchedMovies.map((movie) => (
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