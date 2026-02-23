import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import {
  Mail, Bookmark, Upload, Link as LinkIcon, Loader2,
  RefreshCw, LogOut, Minimize2, Maximize2, Copy, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLayoutContext } from './AppLayout';
import { useImportContext } from './ImportContext';
import { ImportDialog } from './ImportDialog';

export function ProfilePage() {
  const { accessToken, userEmail, projectId, onSignOut } = useAppLayoutContext();
  const { watchlist, watched } = useImportContext();

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

  // IMDb update state
  const [updatingImdb, setUpdatingImdb] = useState(false);

  const baseUrl = API_BASE_URL;

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
                        <Bookmark className="size-3.5 fill-green-400" />
                        Connected
                      </div>
                      <p className="text-white font-semibold">{partner.name || 'Partner'}</p>
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
                  onClick={() => watchlist.setDialogOpen(true)}
                >
                  <Upload className="size-4 mr-2" />
                  Import Watchlist
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
                  onClick={() => watched.setDialogOpen(true)}
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
    </>
  );
}