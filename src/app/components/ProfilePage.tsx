import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import {
  Mail, Heart, Upload, Link as LinkIcon, Loader2,
  RefreshCw, LogOut, Minimize2, Maximize2, Copy, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLayoutContext } from './AppLayout';

export function ProfilePage() {
  const { accessToken, userEmail, projectId, onSignOut } = useAppLayoutContext();

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Partner state
  const [partner, setPartner] = useState<any>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [connectingPartner, setConnectingPartner] = useState(false);
  
  // Invite code state
  const [inviteCode, setInviteCode] = useState('');
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // Import Watchlist state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMinimized, setImportMinimized] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });

  // Import Watched state
  const [watchedImportDialogOpen, setWatchedImportDialogOpen] = useState(false);
  const [watchedImportData, setWatchedImportData] = useState('');
  const [watchedImporting, setWatchedImporting] = useState(false);
  const [watchedImportMinimized, setWatchedImportMinimized] = useState(false);
  const [watchedImportProgress, setWatchedImportProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });

  // IMDb update state
  const [updatingImdb, setUpdatingImdb] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // ─── Fetch profile + partner on mount ───────────────────────────
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

        const partnerData = await partnerRes.json();
        if (partnerData.partner) {
          setPartner(partnerData.partner);
        }

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) {
          setInviteCode(inviteData.code);
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

  // ─── Import watchlist ───────────────────────────────────────────
  const handleImportMovies = async () => {
    if (!accessToken || !importData) return;

    setImporting(true);
    setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });

    try {
      const movies = parseCSV(importData);

      if (movies.length === 0) {
        toast.error('No valid movies found in the data');
        setImporting(false);
        return;
      }

      const BATCH_SIZE = 200;
      const batches: any[][] = [];
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
      }

      setImportProgress({ current: 0, total: movies.length, batch: 0, totalBatches: batches.length });
      toast.success(`Found ${movies.length} movies. Starting import in ${batches.length} batch${batches.length > 1 ? 'es' : ''}...`);

      let totalImported = 0;
      let totalFailed = 0;
      let failedMovies: any[] = [];

      for (let i = 0; i < batches.length; i++) {
        setImportProgress({
          current: i * BATCH_SIZE,
          total: movies.length,
          batch: i + 1,
          totalBatches: batches.length,
        });

        const response = await fetch(`${baseUrl}/movies/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ movies: batches[i] }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to import movies');

        totalImported += data.results.imported || 0;
        totalFailed += data.results.failed?.length || 0;
        failedMovies = failedMovies.concat(data.results.failed || []);
      }

      setImportProgress({ current: movies.length, total: movies.length, batch: batches.length, totalBatches: batches.length });
      setImportDialogOpen(false);
      setImportMinimized(false);
      setImportData('');

      if (totalImported > 0) toast.success(`🎉 Successfully imported ${totalImported} of ${movies.length} movies!`);
      if (totalFailed > 0) {
        toast.error(`Could not find ${totalFailed} movies on TMDb`);
        console.log('Failed movies:', failedMovies);
      }
    } catch (error) {
      console.error('Error importing movies:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import movies');
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  // ─── Import watched ─────────────────────────────────────────────
  const handleImportWatchedMovies = async () => {
    if (!accessToken || !watchedImportData) return;

    setWatchedImporting(true);
    setWatchedImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });

    try {
      const movies = parseCSV(watchedImportData);

      if (movies.length === 0) {
        toast.error('No valid movies found in the data');
        setWatchedImporting(false);
        return;
      }

      const BATCH_SIZE = 200;
      const batches: any[][] = [];
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
      }

      setWatchedImportProgress({ current: 0, total: movies.length, batch: 0, totalBatches: batches.length });
      toast.success(`Found ${movies.length} movies. Starting import in ${batches.length} batch${batches.length > 1 ? 'es' : ''}...`);

      let totalImported = 0;
      let totalFailed = 0;

      for (let i = 0; i < batches.length; i++) {
        setWatchedImportProgress({
          current: i * BATCH_SIZE,
          total: movies.length,
          batch: i + 1,
          totalBatches: batches.length,
        });

        const response = await fetch(`${baseUrl}/movies/import-watched`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ movies: batches[i] }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to import watched movies');

        totalImported += data.results.imported || 0;
        totalFailed += data.results.failed || 0;
      }

      setWatchedImportProgress({ current: movies.length, total: movies.length, batch: batches.length, totalBatches: batches.length });
      setWatchedImportDialogOpen(false);
      setWatchedImportMinimized(false);
      setWatchedImportData('');

      if (totalImported > 0) toast.success(`🎉 Successfully marked ${totalImported} movies as watched!`);
      if (totalFailed > 0) toast.error(`Could not find ${totalFailed} movies on TMDb`);
    } catch (error) {
      console.error('Error importing watched movies:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import watched movies');
    } finally {
      setWatchedImporting(false);
      setWatchedImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

  // ─── File upload handler ────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isWatched: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isWatched) {
        setWatchedImportData(content);
      } else {
        setImportData(content);
      }
      toast.success('CSV file loaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
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

  // ─── Sign out ───────────────────────────────────────────────────
  // Uses AppLayout's handleSignOut which properly signs out from Supabase + navigates
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
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profile & Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account, partner connection, and imports</p>
        </div>

        <div className="space-y-6">

          {/* ── Card: Your Profile ────────────────────────────── */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-5">
                <Avatar className="size-20">
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="photoUrl" className="text-white text-sm">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-white text-sm">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-slate-500 flex-shrink-0" />
                  <Input
                    id="email"
                    value={userEmail || ''}
                    disabled
                    className="bg-slate-900 border-slate-700 text-slate-400"
                  />
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
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* ── Card: Partner Connection ──────────────────────── */}
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
                    <Avatar className="size-14">
                      <AvatarImage src={partner.photoUrl} />
                      <AvatarFallback className="bg-green-600 text-white text-xl">
                        {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-green-400 font-medium text-sm mb-1">
                        <Heart className="size-3.5 fill-green-400" />
                        Connected
                      </div>
                      <p className="text-white font-semibold">{partner.name || 'Partner'}</p>
                      <p className="text-slate-400 text-sm">{partner.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDisconnectPartner}
                    disabled={disconnecting}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-900/30 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
                  >
                    {disconnecting ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : null}
                    Disconnect Partner
                  </Button>
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

          {/* ── Card: Import & Data ──────────────────────────── */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Import & Data</CardTitle>
              <CardDescription className="text-slate-400">
                Import your movie lists from Letterboxd or refresh cached ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="size-4 mr-2" />
                  Import Watchlist
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
                  onClick={() => setWatchedImportDialogOpen(true)}
                >
                  <Upload className="size-4 mr-2" />
                  Import Watched Movies
                </Button>
                <Button
                  onClick={handleUpdateImdbRatings}
                  disabled={updatingImdb}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
                >
                  {updatingImdb ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                  Refresh IMDb Ratings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Card: Account ────────────────────────────────── */}
          <Card className="bg-slate-800/50 border-red-900/30">
            <CardHeader>
              <CardTitle className="text-white">Account</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSignOutClick}
                variant="outline"
                className="bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Import Watchlist Dialog ───────────────────────────── */}
      <Dialog open={importDialogOpen && !importMinimized} onOpenChange={(open) => {
        if (!importing) setImportDialogOpen(open);
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Import Movies from Letterboxd</DialogTitle>
              {importing && (
                <Button variant="ghost" size="sm" onClick={() => setImportMinimized(true)} className="hover:bg-slate-700">
                  <Minimize2 className="size-4" />
                </Button>
              )}
            </div>
            <DialogDescription className="text-slate-400">
              {importing
                ? "Import in progress. You can minimize this and continue browsing."
                : "Export your Letterboxd watchlist as CSV and paste it below. Format: Date, Name, Year, Letterboxd URI"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importing && importProgress.total > 0 ? (
              <ImportProgressBar progress={importProgress} color="bg-blue-600" />
            ) : (
              <>
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">Choose CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="bg-slate-900 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-500">Or paste CSV data</span>
                  </div>
                </div>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={"Date,Name,Year,Letterboxd URI\n9/9/2016,Birth of the Dragon,2016,https://boxd.it/a1f8\n..."}
                  className="h-[200px] max-h-[200px] overflow-y-auto bg-slate-900 border-slate-700 text-white font-mono text-xs resize-none"
                />
                <Button
                  onClick={handleImportMovies}
                  disabled={importing || !importData}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {importing ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  {importing ? 'Importing...' : 'Import to Saved Movies'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Import Watched Dialog ────────────────────────────── */}
      <Dialog open={watchedImportDialogOpen && !watchedImportMinimized} onOpenChange={(open) => {
        if (!watchedImporting) setWatchedImportDialogOpen(open);
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Import Watched Movies from Letterboxd</DialogTitle>
              {watchedImporting && (
                <Button variant="ghost" size="sm" onClick={() => setWatchedImportMinimized(true)} className="hover:bg-slate-700">
                  <Minimize2 className="size-4" />
                </Button>
              )}
            </div>
            <DialogDescription className="text-slate-400">
              {watchedImporting
                ? "Import in progress. You can minimize this and continue browsing."
                : "Export your watched films from Letterboxd as CSV and paste it below. These movies will be filtered out from Discover."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {watchedImporting && watchedImportProgress.total > 0 ? (
              <ImportProgressBar progress={watchedImportProgress} color="bg-green-600" />
            ) : (
              <>
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">Choose CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="bg-slate-900 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-500">Or paste CSV data</span>
                  </div>
                </div>
                <Textarea
                  value={watchedImportData}
                  onChange={(e) => setWatchedImportData(e.target.value)}
                  placeholder={"Date,Name,Year,Letterboxd URI\n9/9/2016,Birth of the Dragon,2016,https://boxd.it/a1f8\n..."}
                  className="h-[200px] max-h-[200px] overflow-y-auto bg-slate-900 border-slate-700 text-white font-mono text-xs resize-none"
                />
                <Button
                  onClick={handleImportWatchedMovies}
                  disabled={watchedImporting || !watchedImportData}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {watchedImporting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  {watchedImporting ? 'Importing...' : 'Import as Watched'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Minimized Import Widgets ─────────────────────────── */}
      {importing && importMinimized && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 text-blue-500 animate-spin" />
              <span className="text-white font-semibold text-sm">Importing Watchlist</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportMinimized(false)} className="hover:bg-slate-700 size-8 p-0">
              <Maximize2 className="size-4 text-slate-400" />
            </Button>
          </div>
          {importProgress.total > 0 && (
            <>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Batch {importProgress.batch}/{importProgress.totalBatches}</span>
                <span>{Math.min(importProgress.current + 200, importProgress.total)}/{importProgress.total}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(Math.min(importProgress.current + 200, importProgress.total) / importProgress.total) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {watchedImporting && watchedImportMinimized && (
        <div
          className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 w-80 z-50"
          style={{ bottom: importing && importMinimized ? '8rem' : '1.5rem' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 text-green-500 animate-spin" />
              <span className="text-white font-semibold text-sm">Importing Watched</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWatchedImportMinimized(false)} className="hover:bg-slate-700 size-8 p-0">
              <Maximize2 className="size-4 text-slate-400" />
            </Button>
          </div>
          {watchedImportProgress.total > 0 && (
            <>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Batch {watchedImportProgress.batch}/{watchedImportProgress.totalBatches}</span>
                <span>{Math.min(watchedImportProgress.current + 200, watchedImportProgress.total)}/{watchedImportProgress.total}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-300"
                  style={{ width: `${(Math.min(watchedImportProgress.current + 200, watchedImportProgress.total) / watchedImportProgress.total) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}