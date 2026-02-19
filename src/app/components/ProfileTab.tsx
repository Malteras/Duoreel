import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Mail, Heart, Upload, Link as LinkIcon, Loader2, Search, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

interface ProfileTabProps {
  accessToken: string | null;
  userEmail: string | null;
  projectId: string;
  onSignOut: () => void;
}

export function ProfileTab({ accessToken, userEmail, projectId, onSignOut }: ProfileTabProps) {
  const [profile, setProfile] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  
  // Partner search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  useEffect(() => {
    if (!accessToken) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();
        setProfile(data);
        setName(data.name || '');
        setPhotoUrl(data.photoUrl || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPartner = async () => {
      try {
        const response = await fetch(`${baseUrl}/partner`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data.partner) {
          setPartner(data.partner);
        }
      } catch (error) {
        console.error('Error fetching partner:', error);
      }
    };

    fetchProfile();
    fetchPartner();
  }, [accessToken]);

  const handleSaveProfile = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const response = await fetch(`${baseUrl}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name, photoUrl })
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

  const handleConnectPartner = async () => {
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
      
      if (response.status === 404) {
        toast.error('Partner not found. Make sure they have signed up first.');
      } else if (data.success) {
        toast.success('Connected with partner!');
        // Refresh partner info
        const partnerResponse = await fetch(`${baseUrl}/partner`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const partnerData = await partnerResponse.json();
        if (partnerData.partner) {
          setPartner(partnerData.partner);
        }
        setPartnerEmail('');
      }
    } catch (error) {
      console.error('Error connecting partner:', error);
      toast.error('Failed to connect with partner');
    } finally {
      setSaving(false);
    }
  };

  const handleImportMovies = async () => {
    if (!accessToken || !importData) return;

    setImporting(true);
    try {
      // Parse the import data (simplified example - would need proper parsing for real Letterboxd/IMDb formats)
      const lines = importData.split('\n').filter(line => line.trim());
      const movieTitles = lines.map(line => {
        // Try to extract movie title from common CSV formats
        const parts = line.split(',');
        return parts[0]?.replace(/"/g, '').trim();
      }).filter(Boolean);

      toast.success(`Preparing to import ${movieTitles.length} movies...`);
      
      // For demo purposes, just show success
      // In a real app, you would search for each movie and add to watched list
      setImportDialogOpen(false);
      setImportData('');
      toast.success('Import feature will search and add these movies to your watched list');
    } catch (error) {
      console.error('Error importing movies:', error);
      toast.error('Failed to import movies');
    } finally {
      setImporting(false);
    }
  };

  const handleSearchPartner = async () => {
    if (!accessToken || !searchQuery) return;

    setSearching(true);
    try {
      const response = await fetch(`${baseUrl}/partner/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ searchQuery })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Error searching partner:', error);
      toast.error('Failed to search for partner');
    } finally {
      setSearching(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <User className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="size-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Profile</h1>
          <Button 
            onClick={onSignOut}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Profile Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="size-24">
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="photoUrl" className="text-white">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="bg-slate-900 border-slate-700 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="size-5 text-slate-400" />
                  <Input
                    id="email"
                    value={userEmail || ''}
                    disabled
                    className="bg-slate-900 border-slate-700 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-slate-900 border-slate-700 text-white mt-2"
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

          {/* Partner Connection */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Partner Connection</CardTitle>
              <CardDescription className="text-slate-400">
                Connect with your partner to find movie matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {partner ? (
                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Avatar className="size-16">
                    <AvatarImage src={partner.photoUrl} />
                    <AvatarFallback className="bg-green-600 text-white text-xl">
                      {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-green-400 font-medium mb-1">
                      <Heart className="size-4 fill-green-400" />
                      Connected
                    </div>
                    <p className="text-white font-semibold">{partner.name || 'Partner'}</p>
                    <p className="text-slate-400 text-sm">{partner.email}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="partnerEmail" className="text-white">Partner's Email</Label>
                  <div className="flex gap-2 mt-2">
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
                      disabled={saving || !partnerEmail}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LinkIcon className="size-4 mr-2" />}
                      Connect
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Your partner must sign up first before you can connect
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Movies */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Import Watched Movies</CardTitle>
              <CardDescription className="text-slate-400">
                Import your movie list from Letterboxd or IMDb
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                    <Upload className="size-4 mr-2" />
                    Import Movies
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Import Movies</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Paste your exported movie list (CSV format) from Letterboxd or IMDb
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Title, Year, Rating&#10;Inception, 2010, 5&#10;The Matrix, 1999, 5&#10;..."
                      className="min-h-[200px] bg-slate-900 border-slate-700 text-white"
                    />
                    <Button 
                      onClick={handleImportMovies} 
                      disabled={importing || !importData}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {importing ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Import
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}