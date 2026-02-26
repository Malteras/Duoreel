import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
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
  Mail, Upload, Link as LinkIcon, Loader2,
  RefreshCw, LogOut, Copy, RotateCcw, Unlink,
  CheckCircle2, Bookmark, Film, Heart, Eye, EyeOff, X,
  ChevronUp, ChevronDown, ChevronsUpDown, BookmarkX
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLayoutContext } from './AppLayout';
import { useImportContext } from './ImportContext';
import { ImportDialog } from './ImportDialog';
import { MovieDetailModal } from './MovieDetailModal';
import { useMovieModal } from '../hooks/useMovieModal';

export function ProfilePage() {
  const { accessToken, userEmail, projectId, onSignOut } = useAppLayoutContext();
  const { watchlist, watched } = useImportContext();
  const { selectedMovie, modalOpen, openMovie, closeMovie } = useMovieModal(accessToken);

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [showCustomUrl, setShowCustomUrl] = useState(false);

  // Gradient avatar presets — stored as gradient strings, rendered via inline styles
  const avatarPresets = [
    { id: 'blue', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    { id: 'pink', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
    { id: 'green', gradient: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    { id: 'orange', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
    { id: 'cyan', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
    { id: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
  ];

  // Partner state
  const [partner, setPartner] = useState<any>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [connectingPartner, setConnectingPartner] = useState(false);
  
  // Invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // IMDb update state
  const [updatingImdb, setUpdatingImdb] = useState(false);

  // Letterboxd sync state
  const [letterboxdUsername, setLetterboxdUsername] = useState('');
  const [letterboxdInput, setLetterboxdInput] = useState('');
  const [letterboxdSyncing, setLetterboxdSyncing] = useState(false);
  const [letterboxdLastSynced, setLetterboxdLastSynced] = useState<Date | null>(null);
  const [letterboxdConnecting, setLetterboxdConnecting] = useState(false);
  const [letterboxdLastError, setLetterboxdLastError] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<{
    saved: number;
    matches: number;
    watched: number;
  } | null>(null);

  // Shared stats modal state
  type StatsModalType = 'saved' | 'matches' | 'watched' | null;
  const [statsModal, setStatsModal] = useState<StatsModalType>(null);
  const [statsModalMovies, setStatsModalMovies] = useState<any[]>([]);
  const [statsModalLoading, setStatsModalLoading] = useState(false);
  const [removingWatchedId, setRemovingWatchedId] = useState<number | null>(null);
  const [statsSort, setStatsSort] = useState<{ col: 'title' | 'date'; dir: 'asc' | 'desc' }>({ col: 'date', dir: 'desc' });
  const [statsModalPage, setStatsModalPage] = useState(1);
  const STATS_PAGE_SIZE = 50;
  const [removingSavedId, setRemovingSavedId] = useState<number | null>(null);

  // Partner activity state
  const [partnerStats, setPartnerStats] = useState<{
    savedCount: number;
  } | null>(null);

  // Dirty tracking for profile form
  const [originalName, setOriginalName] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');
  const isDirty = name !== originalName || photoUrl !== originalPhotoUrl;

  const baseUrl = API_BASE_URL;

  // ─── Fetch profile + partner + stats on mount ──────────────────
  useEffect(() => {
    if (!accessToken) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, partnerRes, inviteCodeRes] = await Promise.all([
          fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner/invite-code`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const profileData = await profileRes.json();
        setProfile(profileData);
        setName(profileData.name || '');
        setPhotoUrl(profileData.photoUrl || '');
        setOriginalName(profileData.name || '');
        setOriginalPhotoUrl(profileData.photoUrl || '');
        if (profileData.letterboxdUsername) {
          setLetterboxdUsername(profileData.letterboxdUsername);
        }

        const partnerData = await partnerRes.json();
        if (partnerData.partner) {
          setPartner(partnerData.partner);
        }

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) {
          setInviteCode(inviteData.code);
        }

        // Fetch stats (non-blocking — page works without them)
        try {
          const [likedRes, matchesRes, watchedRes] = await Promise.all([
            fetch(`${baseUrl}/movies/liked`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            fetch(`${baseUrl}/movies/matches`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            fetch(`${baseUrl}/movies/watched`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
          ]);

          const likedData = await likedRes.json();
          const matchesData = await matchesRes.json();
          const watchedData = await watchedRes.json();

          setStats({
            saved: likedData.movies?.length || 0,
            matches: matchesData.movies?.length || 0,
            watched: watchedData.movies?.length || 0,
          });

          // If partner connected, get partner's saved count
          if (partnerData.partner) {
            try {
              const partnerLikedRes = await fetch(`${baseUrl}/movies/partner-liked`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const partnerLikedData = await partnerLikedRes.json();
              setPartnerStats({
                savedCount: partnerLikedData.movies?.length || 0,
              });
            } catch {
              // Non-critical
            }
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // ─── Profile save ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const response = await fetch(`${baseUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, photoUrl }),
      });

      const data = await response.json();
      if (data.success) {
        setProfile({ ...profile, ...data.profile });
        setOriginalName(name);
        setOriginalPhotoUrl(photoUrl);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Partner connect (sends request, partner must accept) ────
  const handleConnectPartner = async () => {
    if (!accessToken || !partnerEmail) return;

    setConnectingPartner(true);
    try {
      const response = await fetch(`${baseUrl}/partner/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ partnerEmail }),
      });

      const data = await response.json();

      if (response.status === 404) {
        toast.error('User not found. Make sure they have signed up first.');
      } else if (data.success) {
        toast.success('Partner request sent! They need to accept it.');
        setPartnerEmail('');
      }
    } catch (error) {
      console.error('Error sending partner request:', error);
      toast.error('Failed to send partner request');
    } finally {
      setConnectingPartner(false);
    }
  };

  // ─── Partner disconnect ─────────────────────────────────────────
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnectPartner = async () => {
    if (!accessToken) return;

    setDisconnecting(true);
    try {
      const response = await fetch(`${baseUrl}/partner/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPartner(null);
        toast.success('Partner disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting partner:', error);
      toast.error('Failed to disconnect partner');
    } finally {
      setDisconnecting(false);
    }
  };

  // ─── CSV parsing helper ─────────────────────────────────────────
  const parseCSV = (rawData: string) => {
    const lines = rawData.split('\n').filter(line => line.trim());
    const isTSV = lines[0]?.includes('\t');

    const dataLines = lines[0]?.toLowerCase().includes('date') || lines[0]?.toLowerCase().includes('name')
      ? lines.slice(1)
      : lines;

    return dataLines.map(line => {
      let parts: string[];

      if (isTSV) {
        parts = line.split('\t');
      } else {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        parts = result;
      }

      if (parts.length >= 3) {
        const title = parts[1]?.trim().replace(/^"|"$/g, '');
        const year = parts[2]?.trim();
        if (title && year) {
          return { title, name: title, year };
        }
      }
      return null;
    }).filter(Boolean);
  };

  // ─── Update IMDb ratings ────────────────────────────────────────
  const handleUpdateImdbRatings = async () => {
    if (!accessToken) return;

    setUpdatingImdb(true);
    toast.info('Updating IMDb ratings for your saved movies... This may take a moment.');

    try {
      const response = await fetch(`${baseUrl}/movies/update-imdb-ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✨ Successfully updated ${data.results.updated} IMDb ratings!`);
        if (data.results.failed > 0) toast.error(`Could not update ${data.results.failed} ratings`);
      } else {
        toast.error(data.error || 'Failed to update IMDb ratings');
      }
    } catch (error) {
      console.error('Error updating IMDb ratings:', error);
      toast.error('Failed to update IMDb ratings');
    } finally {
      setUpdatingImdb(false);
    }
  };

  // ─── Open stats modal (Saved / Matches / Watched) ──────────────
  const openStatsModal = async (type: StatsModalType) => {
    if (!accessToken || !type) return;
    setStatsModal(type);
    setStatsModalMovies([]);
    setStatsModalPage(1);
    setStatsModalLoading(true);
    setStatsSort({ col: 'date', dir: 'desc' });

    const endpointMap: Record<string, string> = {
      saved: `${baseUrl}/movies/liked`,
      matches: `${baseUrl}/movies/matches`,
      watched: `${baseUrl}/movies/watched`,
    };

    try {
      const res = await fetch(endpointMap[type], {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setStatsModalMovies(data.movies || []);
    } catch (err) {
      console.error(`Failed to fetch ${type} movies:`, err);
    } finally {
      setStatsModalLoading(false);
    }
  };

  // ─── Remove watched movie ───────────────────────────────────────
  const handleRemoveWatched = async (movieId: number) => {
    if (!accessToken) return;
    setRemovingWatchedId(movieId);
    try {
      const res = await fetch(`${baseUrl}/movies/watched/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setStatsModalMovies(prev => prev.filter(m => m.id !== movieId));
        // Also decrement the stats counter shown on the profile
        setStats(prev => prev ? { ...prev, watched: Math.max(0, prev.watched - 1) } : null);
        toast.success('Removed from watched list');
      }
    } catch (err) {
      console.error('Failed to remove watched movie:', err);
      toast.error('Failed to remove from watched list');
    } finally {
      setRemovingWatchedId(null);
    }
  };

  // ─── Unsave movie ────────────────────────────────────────────────
  const handleUnsave = async (movieId: number) => {
    if (!accessToken) return;
    setRemovingSavedId(movieId);
    try {
      const res = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setStatsModalMovies(prev => prev.filter(m => m.id !== movieId));
        setStats(prev => prev ? { ...prev, saved: Math.max(0, prev.saved - 1) } : null);
        toast.success('Removed from saved list');
      }
    } catch (err) {
      console.error('Failed to unsave movie:', err);
      toast.error('Failed to remove from saved list');
    } finally {
      setRemovingSavedId(null);
    }
  };

  // ─── Stats modal sort helpers ───────────────────────────────────
  const sortedStatsMovies = [...statsModalMovies].sort((a, b) => {
    if (statsSort.col === 'title') {
      const cmp = (a.title || '').localeCompare(b.title || '');
      return statsSort.dir === 'asc' ? cmp : -cmp;
    } else {
      const cmp = (a.timestamp || 0) - (b.timestamp || 0);
      return statsSort.dir === 'desc' ? -cmp : cmp;
    }
  });

  const toggleStatsSort = (col: 'title' | 'date') => {
    setStatsModalPage(1); // reset to first page on sort change
    setStatsSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: col === 'date' ? 'desc' : 'asc' }
    );
  };

  // ─── Copy invite link ───────────────────────────────────────────
  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success('📋 Invite link copied! Send it to your partner.');
  };

  // ─── Regenerate invite code ─────────────────────────────────────
  const handleRegenerateCode = async () => {
    if (!accessToken) return;

    setRegeneratingCode(true);
    try {
      const response = await fetch(`${baseUrl}/partner/regenerate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
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

  // ─── Letterboxd connect ─────────────────────────────────────────────────────
  const handleLetterboxdConnect = async () => {
    if (!accessToken || !letterboxdInput.trim()) return;
    setLetterboxdConnecting(true);

    // Normalize: strip https://letterboxd.com/ prefix if pasted as URL
    const username = letterboxdInput.trim()
      .replace(/^https?:\/\/letterboxd\.com\//i, '')
      .replace(/\/$/, '');

    try {
      // Validate by attempting to fetch the RSS feed
      const testRes = await fetch(`${baseUrl}/letterboxd/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username }),
      });

      if (!testRes.ok) {
        toast.error(`Couldn't find Letterboxd user "${username}". Check the username and try again.`);
        return;
      }

      // Save username to profile
      await fetch(`${baseUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ letterboxdUsername: username }),
      });

      setLetterboxdUsername(username);
      setLetterboxdInput('');
      setLetterboxdLastError(null);
      toast.success(`Connected to @${username}! Syncing your watch history...`);
      
      // Trigger first sync
      handleLetterboxdSync(false);
    } catch {
      toast.error('Failed to connect Letterboxd account');
    } finally {
      setLetterboxdConnecting(false);
    }
  };

  // ─── Letterboxd disconnect ──────────────────────────────────────────────────
  const handleLetterboxdDisconnect = async () => {
    if (!accessToken) return;
    try {
      await fetch(`${baseUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ letterboxdUsername: '', letterboxdLastSyncGuid: '' }),
      });
      setLetterboxdUsername('');
      setLetterboxdLastSynced(null);
      setLetterboxdLastError(null);
      toast.success('Letterboxd account disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  // ─── Letterboxd sync ────────────────────────────────────────────────────────
  const handleLetterboxdSync = async (silent = false) => {
    if (!accessToken || !letterboxdUsername || letterboxdSyncing) return;
    setLetterboxdSyncing(true);
    setLetterboxdLastError(null);

    try {
      const res = await fetch(`${baseUrl}/letterboxd/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (res.ok) {
        setLetterboxdLastSynced(new Date());
        if (!silent || data.synced > 0) {
          if (data.synced > 0) {
            toast.success(`✅ Synced ${data.synced} new movie${data.synced === 1 ? '' : 's'} from Letterboxd`);
          } else if (!silent) {
            toast.info('Already up to date — no new Letterboxd entries');
          }
        }
      } else {
        setLetterboxdLastError(data.error || 'Sync failed');
        if (!silent) toast.error(data.error || 'Sync failed');
      }
    } catch (err) {
      const errorMsg = 'Failed to sync with Letterboxd';
      setLetterboxdLastError(errorMsg);
      if (!silent) toast.error(errorMsg);
    } finally {
      setLetterboxdSyncing(false);
    }
  };

  // ─── Letterboxd reset & full sync ───────────────────────────────────────────
  const handleLetterboxdReset = async () => {
    if (!accessToken) return;
    try {
      await fetch(`${baseUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ letterboxdLastSyncGuid: '' }),
      });
      toast.info('Resetting sync history...');
      handleLetterboxdSync(false);
    } catch {
      toast.error('Failed to reset sync');
    }
  };

  // ─── Format relative time helper ───────────────────────────────────────────
  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
  };

  // ─── Sign out ───────────────────────────────────────────────────
  const handleSignOutClick = () => onSignOut();

  // ─── Progress bar component ─────────────────────────────────────
  const ImportProgressBar = ({ progress, color }: { progress: typeof importProgress; color: string }) => (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-slate-300">
        <span>Batch {progress.batch} of {progress.totalBatches}</span>
        <span>{Math.min(progress.current + 200, progress.total)} / {progress.total} movies</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-300 flex items-center justify-center`}
          style={{ width: `${(Math.min(progress.current + 200, progress.total) / progress.total) * 100}%` }}
        >
          <Loader2 className="size-3 text-white animate-spin" />
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm">
        Processing batch {progress.batch}... This may take a few minutes.
      </p>
    </div>
  );

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ══════════════════════════════════════════════════════════
            PROFILE HERO — Identity + Stats at a glance
            ══════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-5 mb-6">
            {photoUrl && !photoUrl.startsWith('linear-gradient') ? (
              <Avatar className="size-20 ring-2 ring-slate-600 ring-offset-2 ring-offset-slate-900">
                <AvatarImage src={photoUrl} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className="size-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-2 ring-slate-600 ring-offset-2 ring-offset-slate-900"
                style={{ background: photoUrl?.startsWith('linear-gradient') ? photoUrl : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{name || 'Movie Lover'}</h1>
              <p className="text-slate-400 text-sm truncate">{userEmail}</p>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">

              <button
                onClick={() => openStatsModal('saved')}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Bookmark className="size-3.5 text-blue-400" />
                  <span className="text-xs text-slate-400 font-medium">Saved</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.saved}</p>
              </button>

              <button
                onClick={() => openStatsModal('matches')}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Heart className="size-3.5 text-pink-400" />
                  <span className="text-xs text-slate-400 font-medium">Matches</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.matches}</p>
              </button>

              <button
                onClick={() => openStatsModal('watched')}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center hover:bg-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Eye className="size-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-400 font-medium">Watched</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.watched}</p>
              </button>

            </div>
          )}
        </div>

        <div className="space-y-6">

          {/* ══════════════════════════════════════════════════════════
              CARD 1: PARTNER CONNECTION — Promoted to top
              ══════════════════════════════════════════════════════════ */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Partner Connection</CardTitle>
              <CardDescription className="text-slate-400">
                Connect with your partner to find movie matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    {partner.photoUrl && !partner.photoUrl.startsWith('linear-gradient') ? (
                      <Avatar className="size-14">
                        <AvatarImage src={partner.photoUrl} />
                        <AvatarFallback className="bg-green-600 text-white text-xl">
                          {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className="size-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                        style={{ background: partner.photoUrl?.startsWith('linear-gradient') ? partner.photoUrl : 'linear-gradient(135deg, #22c55e, #14b8a6)' }}
                      >
                        {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-green-400 font-medium text-sm mb-1">
                        <CheckCircle2 className="size-3.5" />
                        Connected
                      </div>
                      <p className="text-white font-semibold">{partner.name || 'Partner'}</p>
                      {partnerStats && (
                        <p className="text-slate-400 text-xs mt-0.5">
                          {partnerStats.savedCount} movie{partnerStats.savedCount === 1 ? '' : 's'} saved
                        </p>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={disconnecting}
                        variant="outline"
                        size="sm"
                        className="bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800 cursor-pointer"
                      >
                        {disconnecting ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Unlink className="size-3.5 mr-2" />}
                        Disconnect Partner
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
                          onClick={handleDisconnectPartner}
                          className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-4">
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
                            {regeneratingCode ? <Loader2 className="size-3 mr-1 animate-spin" /> : <RotateCcw className="size-3 mr-1" />}
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
                    <Label htmlFor="partnerEmail" className="text-white text-sm">Partner's Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="partnerEmail"
                        type="email"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        placeholder="partner@example.com"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                      <Button
                        onClick={handleConnectPartner}
                        disabled={connectingPartner || !partnerEmail}
                        className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
                      >
                        {connectingPartner ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LinkIcon className="size-4 mr-2" />}
                        Send Request
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      They'll need to accept your request
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════
              CARD 2: EDIT PROFILE — Demoted (set-once content)
              ══════════════════════════════════════════════════════════ */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Edit Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Update your name and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                {/* Avatar preview + presets */}
                <div className="flex items-center gap-5">
                  {photoUrl && !photoUrl.startsWith('linear-gradient') ? (
                    <Avatar className="size-16">
                      <AvatarImage src={photoUrl} />
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div
                      className="size-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                      style={{ background: photoUrl?.startsWith('linear-gradient') ? photoUrl : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                    >
                      {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{name || 'Your avatar'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Choose a style below or add a custom image</p>
                  </div>
                </div>

                {/* Gradient presets */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">Choose an avatar</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {avatarPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => { setPhotoUrl(preset.gradient); setShowCustomUrl(false); }}
                        className={`size-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 ${
                          photoUrl === preset.gradient ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                        }`}
                        style={{ background: preset.gradient }}
                      >
                        {name ? name[0]?.toUpperCase() : '?'}
                      </button>
                    ))}
                    {/* Default option — shows blue initial (replaces confusing "None" dashed circle) */}
                    <button
                      onClick={() => { setPhotoUrl(''); setShowCustomUrl(false); }}
                      className={`size-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 bg-blue-600 ${
                        !photoUrl ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                      }`}
                    >
                      {name ? name[0]?.toUpperCase() : '?'}
                    </button>
                  </div>
                </div>

                {/* Custom URL — collapsed by default */}
                <div>
                  {!showCustomUrl ? (
                    <button
                      onClick={() => setShowCustomUrl(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Use a custom image URL instead
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="photoUrl" className="text-slate-400 text-xs">Custom image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="photoUrl"
                          value={photoUrl?.startsWith('linear-gradient') ? '' : photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="bg-slate-900 border-slate-700 text-white text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCustomUrl(false)}
                          className="text-slate-400 hover:bg-slate-700 hover:text-white flex-shrink-0"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="name" className="text-white text-sm">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving || !isDirty}
                className={`transition-all ${isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
              >
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                {isDirty ? 'Save Changes' : 'No Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════
              CARD 3: INTEGRATIONS & IMPORTS — Merged card
              ══════════════════════════════════════════════════════════ */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Integrations & Imports</CardTitle>
              <CardDescription className="text-slate-400">
                Connect services and import your movie history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* ── Letterboxd group — inner container ── */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-5">
                {/* Letterboxd branded header */}
                <div className="flex items-center gap-2.5">
                  <img src="https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb-500px.png" alt="Letterboxd" className="h-4 flex-shrink-0" />
                  <h3 className="text-white font-semibold text-sm">Letterboxd</h3>
                </div>

                {/* Auto-sync section */}
                {letterboxdUsername ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <div className="size-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                        LB
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold">@{letterboxdUsername}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {letterboxdSyncing
                            ? 'Syncing...'
                            : letterboxdLastSynced
                              ? `Last synced ${formatRelativeTime(letterboxdLastSynced)}`
                              : 'Syncs automatically on app load'}
                        </p>
                      </div>
                    </div>

                    {letterboxdLastError && (
                      <div className="flex items-start gap-2 text-amber-400 text-xs p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <svg className="size-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Last sync failed: {letterboxdLastError}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleLetterboxdSync(false)}
                        disabled={letterboxdSyncing}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                      >
                        {letterboxdSyncing
                          ? <Loader2 className="size-3.5 mr-2 animate-spin" />
                          : <RefreshCw className="size-3.5 mr-2" />}
                        Sync Now
                      </Button>
                      <Button
                        onClick={handleLetterboxdReset}
                        disabled={letterboxdSyncing}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:bg-slate-700/50 hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="size-3.5 mr-2" />
                        Reset & Full Sync
                      </Button>
                      <Button
                        onClick={handleLetterboxdDisconnect}
                        variant="outline"
                        size="sm"
                        className="bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
                      >
                        <Unlink className="size-3.5 mr-2" />
                        Disconnect
                      </Button>
                    </div>

                    <p className="text-slate-500 text-xs flex items-start gap-1.5">
                      <svg className="size-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Auto-syncs your ~50 most recent entries. For full history, use CSV import below.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-400 text-sm">
                      Connect your Letterboxd account to automatically sync your watch history.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={letterboxdInput}
                        onChange={(e) => setLetterboxdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLetterboxdConnect()}
                        placeholder="username or letterboxd.com/username"
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleLetterboxdConnect}
                        disabled={letterboxdConnecting || !letterboxdInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                      >
                        {letterboxdConnecting
                          ? <Loader2 className="size-4 mr-2 animate-spin" />
                          : null}
                        Connect
                      </Button>
                    </div>
                  </div>
                )}

                {/* Light divider within the Letterboxd group */}
                <div className="border-t border-emerald-500/15" />

                {/* CSV Import — inside the Letterboxd group */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="size-3.5 text-slate-400" />
                    <h4 className="text-slate-300 font-medium text-xs uppercase tracking-wide">CSV Import</h4>
                  </div>
                  <p className="text-slate-500 text-xs mb-3">
                    For full history, export your Letterboxd data as CSV and import here.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                      onClick={() => watchlist.setDialogOpen(true)}
                    >
                      <Upload className="size-3.5 mr-2" />
                      Import Watchlist
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                      onClick={() => watched.setDialogOpen(true)}
                    >
                      <Upload className="size-3.5 mr-2" />
                      Import Watched Movies
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Data Management — outside the Letterboxd group ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="size-4 text-amber-400" />
                  <h3 className="text-white font-semibold text-sm">Data Management</h3>
                </div>
                <Button
                  onClick={handleUpdateImdbRatings}
                  disabled={updatingImdb}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                >
                  {updatingImdb ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <RefreshCw className="size-3.5 mr-2" />}
                  Refresh IMDb Ratings
                </Button>
                <p className="text-slate-500 text-xs mt-2">
                  Re-fetches IMDb ratings for all your saved movies. Useful after bulk imports.
                </p>

                {/* NEW: Watched list button */}
                <Button
                  onClick={() => openStatsModal('watched')}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 hover:text-white mt-3"
                >
                  <Eye className="size-3.5 mr-2" />
                  View Watched List
                </Button>
                <p className="text-slate-500 text-xs mt-2">
                  See all movies you've marked as watched. {stats && stats.watched > 0 && `${stats.watched} movies`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ══════════════════════════════════════════════════════════
              FOOTER: Sign Out — replaces the old Account card
              ══════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <p className="text-slate-500 text-xs">
              Signed in as {userEmail}
            </p>
            <Button
              onClick={handleSignOutClick}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-400 hover:bg-transparent"
            >
              <LogOut className="size-3.5 mr-2" />
              Sign Out
            </Button>
          </div>

        </div>
      </div>

      {/* Import Dialogs — state lives in ImportContext, persists across navigation */}
      <ImportDialog
        importState={watchlist}
        title="Import Movies from Letterboxd"
        description="Export your Letterboxd watchlist as CSV and paste it below. Format: Date, Name, Year, Letterboxd URI"
        buttonLabel="Import to Saved Movies"
        progressBarColor="bg-blue-600"
      />

      <ImportDialog
        importState={watched}
        title="Import Watched Movies from Letterboxd"
        description="Export your watched films from Letterboxd as CSV and paste it below. These movies will be filtered out from Discover."
        buttonLabel="Import as Watched"
        progressBarColor="bg-green-600"
      />

      {/* ── Stats List Modal (Saved / Matches / Watched) ── */}
      {statsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setStatsModal(null); }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div>
                <h2 className="text-white font-semibold text-base">
                  {statsModal === 'saved' && 'Saved Movies'}
                  {statsModal === 'matches' && 'Matched Movies'}
                  {statsModal === 'watched' && 'Watched Movies'}
                </h2>
                {!statsModalLoading && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {statsModalMovies.length} {statsModalMovies.length === 1 ? 'movie' : 'movies'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setStatsModal(null)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {statsModalLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 text-pink-400 animate-spin" />
                </div>
              ) : statsModalMovies.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-sm">
                    {statsModal === 'saved' && 'No saved movies yet.'}
                    {statsModal === 'matches' && 'No matches yet.'}
                    {statsModal === 'watched' && 'No watched movies yet.'}
                  </p>
                </div>
              ) : (() => {
                // Lazy-loaded slice — first N rows based on current page
                const visibleMovies = sortedStatsMovies.slice(0, statsModalPage * STATS_PAGE_SIZE);
                const hasMore = visibleMovies.length < sortedStatsMovies.length;
                const showActionCol = statsModal === 'watched' || statsModal === 'saved';

                return (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50">
                          <th className="pb-3 font-medium">
                            <button
                              onClick={() => toggleStatsSort('title')}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              Title
                              {statsSort.col === 'title' ? (
                                statsSort.dir === 'asc'
                                  ? <ChevronUp className="size-3" />
                                  : <ChevronDown className="size-3" />
                              ) : (
                                <ChevronsUpDown className="size-3 opacity-40" />
                              )}
                            </button>
                          </th>
                          <th className="pb-3 font-medium w-32">
                            <button
                              onClick={() => toggleStatsSort('date')}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              Added
                              {statsSort.col === 'date' ? (
                                statsSort.dir === 'asc'
                                  ? <ChevronUp className="size-3" />
                                  : <ChevronDown className="size-3" />
                              ) : (
                                <ChevronsUpDown className="size-3 opacity-40" />
                              )}
                            </button>
                          </th>
                          {showActionCol && <th className="pb-3 w-12"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleMovies.map((movie, i) => {
                          const year = movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : null;

                          return (
                            <tr
                              key={movie.id}
                              className={`border-b border-slate-800/50 last:border-0 ${
                                i % 2 === 0 ? '' : 'bg-slate-800/20'
                              }`}
                            >
                              {/* Clickable title — opens movie preview modal */}
                              <td className="py-3 pr-4 leading-snug">
                                <button
                                  onClick={() => openMovie(movie)}
                                  className="text-left hover:text-pink-300 transition-colors group"
                                >
                                  <span className="text-white font-medium group-hover:underline underline-offset-2">
                                    {movie.title}
                                  </span>
                                  {year && (
                                    <span className="text-slate-500 text-xs ml-1.5">({year})</span>
                                  )}
                                </button>
                              </td>

                              {/* Added date */}
                              <td className="py-3 text-slate-400 text-xs">
                                {movie.timestamp
                                  ? new Date(movie.timestamp).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'N/A'}
                              </td>

                              {/* Action button — Watched: EyeOff, Saved: BookmarkX */}
                              {showActionCol && (
                                <td className="py-3 px-3 text-right">
                                  {statsModal === 'watched' && (
                                    <button
                                      onClick={() => handleRemoveWatched(movie.id)}
                                      disabled={removingWatchedId === movie.id}
                                      className="text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-50 p-1.5 rounded hover:bg-slate-700/50"
                                      title="Mark as unwatched"
                                    >
                                      {removingWatchedId === movie.id
                                        ? <Loader2 className="size-4 animate-spin" />
                                        : <EyeOff className="size-4" />
                                      }
                                    </button>
                                  )}
                                  {statsModal === 'saved' && (
                                    <button
                                      onClick={() => handleUnsave(movie.id)}
                                      disabled={removingSavedId === movie.id}
                                      className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 p-1.5 rounded hover:bg-slate-700/50"
                                      title="Remove from saved"
                                    >
                                      {removingSavedId === movie.id
                                        ? <Loader2 className="size-4 animate-spin" />
                                        : <BookmarkX className="size-4" />
                                      }
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Load more */}
                    {hasMore && (
                      <div className="flex justify-center pt-4 pb-2">
                        <button
                          onClick={() => setStatsModalPage(p => p + 1)}
                          className="text-slate-400 hover:text-white text-xs border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2 transition-colors"
                        >
                          Load more ({sortedStatsMovies.length - visibleMovies.length} remaining)
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Movie preview modal — read-only, opened from stats table title click */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          isOpen={modalOpen}
          onClose={closeMovie}
          isLiked={false}
          onLike={() => {}}
          onUnlike={() => {}}
          onDislike={() => {}}
        />
      )}
    </>
  );
}