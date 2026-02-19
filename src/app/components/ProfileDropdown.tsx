import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Mail, LogOut, Loader2, Upload, FileUp, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface ProfileDropdownProps {
  accessToken: string | null;
  userEmail: string | null;
  projectId: string;
  onSignOut: () => void;
}

export function ProfileDropdown({ accessToken, userEmail, projectId, onSignOut }: ProfileDropdownProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [watchedImportDialogOpen, setWatchedImportDialogOpen] = useState(false);
  const [watchedImportData, setWatchedImportData] = useState('');
  const [watchedImporting, setWatchedImporting] = useState(false);
  const [importMinimized, setImportMinimized] = useState(false);
  const [watchedImportMinimized, setWatchedImportMinimized] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });
  const [watchedImportProgress, setWatchedImportProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });
  const [updatingImdb, setUpdatingImdb] = useState(false);

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

    fetchProfile();
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

  const handleImportMovies = async () => {
    if (!accessToken || !importData) return;

    setImporting(true);
    setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    
    try {
      const lines = importData.split('\n').filter(line => line.trim());
      
      // Detect if it's tab-separated (TSV) or comma-separated (CSV)
      const isTSV = lines[0]?.includes('\t');
      
      console.log('Format detected:', isTSV ? 'TSV (tab-separated)' : 'CSV (comma-separated)');
      
      // Skip header row if it exists
      const dataLines = lines[0]?.toLowerCase().includes('date') || lines[0]?.toLowerCase().includes('name') 
        ? lines.slice(1) 
        : lines;
      
      const movies = dataLines.map(line => {
        let parts;
        
        if (isTSV) {
          // Tab-separated format
          parts = line.split('\t');
        } else {
          // CSV format with proper quote handling
          const result = [];
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
        
        // Letterboxd format: Date, Name, Year, Letterboxd URI (or tab-separated)
        if (parts.length >= 3) {
          const name = parts[1]?.trim();
          const year = parts[2]?.trim();
          
          if (name && year) {
            return { name, year };
          }
        }
        return null;
      }).filter(Boolean);

      console.log('Parsed movies:', movies);

      if (movies.length === 0) {
        toast.error('No valid movies found in the data');
        setImporting(false);
        return;
      }

      // Split into batches of 200 movies
      const BATCH_SIZE = 200;
      const batches = [];
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
      }

      setImportProgress({ current: 0, total: movies.length, batch: 0, totalBatches: batches.length });
      toast.success(`Found ${movies.length} movies. Starting import in ${batches.length} batch${batches.length > 1 ? 'es' : ''}...`);

      let totalImported = 0;
      let totalFailed = 0;
      let failedMovies: any[] = [];

      // Process batches sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        setImportProgress({ 
          current: i * BATCH_SIZE, 
          total: movies.length, 
          batch: i + 1, 
          totalBatches: batches.length 
        });

        // Send to backend for processing
        const response = await fetch(`${baseUrl}/movies/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ movies: batch })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to import movies');
        }

        totalImported += data.results.imported || 0;
        totalFailed += data.results.failed?.length || 0;
        failedMovies = failedMovies.concat(data.results.failed || []);
      }

      setImportProgress({ 
        current: movies.length, 
        total: movies.length, 
        batch: batches.length, 
        totalBatches: batches.length 
      });

      setImportDialogOpen(false);
      setImportMinimized(false);
      setImportData('');
      
      if (totalImported > 0) {
        toast.success(`🎉 Successfully imported ${totalImported} of ${movies.length} movies!`);
      }
      
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

  const handleImportWatchedMovies = async () => {
    if (!accessToken || !watchedImportData) return;

    setWatchedImporting(true);
    setWatchedImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    
    try {
      const lines = watchedImportData.split('\n').filter(line => line.trim());
      
      // Detect if it's tab-separated (TSV) or comma-separated (CSV)
      const isTSV = lines[0]?.includes('\t');
      
      console.log('Format detected:', isTSV ? 'TSV (tab-separated)' : 'CSV (comma-separated)');
      
      // Skip header row if it exists
      const dataLines = lines[0]?.toLowerCase().includes('date') || lines[0]?.toLowerCase().includes('name') 
        ? lines.slice(1) 
        : lines;
      
      const movies = dataLines.map(line => {
        let parts;
        
        if (isTSV) {
          // Tab-separated format
          parts = line.split('\t');
        } else {
          // CSV format with proper quote handling
          const result = [];
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
        
        // Letterboxd format: Date, Name, Year, Letterboxd URI (or tab-separated)
        if (parts.length >= 3) {
          // Remove quotes from the title if present
          const title = parts[1]?.trim().replace(/^"|"$/g, '');
          const year = parts[2]?.trim();
          
          if (title && year) {
            return { title, year };
          }
        }
        return null;
      }).filter(Boolean);

      console.log('Parsed watched movies:', movies);

      if (movies.length === 0) {
        toast.error('No valid movies found in the data');
        setWatchedImporting(false);
        return;
      }

      // Split into batches of 200 movies
      const BATCH_SIZE = 200;
      const batches = [];
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
      }

      setWatchedImportProgress({ current: 0, total: movies.length, batch: 0, totalBatches: batches.length });
      toast.success(`Found ${movies.length} movies. Starting import in ${batches.length} batch${batches.length > 1 ? 'es' : ''}. You'll be notified when complete!`);

      let totalImported = 0;
      let totalFailed = 0;

      // Process batches sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        setWatchedImportProgress({ 
          current: i * BATCH_SIZE, 
          total: movies.length, 
          batch: i + 1, 
          totalBatches: batches.length 
        });

        // Send to backend for processing
        const response = await fetch(`${baseUrl}/movies/import-watched`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ movies: batch })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to import watched movies');
        }

        totalImported += data.results.imported || 0;
        totalFailed += data.results.failed || 0;
      }

      setWatchedImportProgress({ 
        current: movies.length, 
        total: movies.length, 
        batch: batches.length, 
        totalBatches: batches.length 
      });

      setWatchedImportDialogOpen(false);
      setWatchedImportMinimized(false);
      setWatchedImportData('');
      
      if (totalImported > 0) {
        toast.success(`🎉 Successfully marked ${totalImported} movies as watched!`);
      }
      
      if (totalFailed > 0) {
        toast.error(`Could not find ${totalFailed} movies on TMDb`);
      }
    } catch (error) {
      console.error('Error importing watched movies:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import watched movies');
    } finally {
      setWatchedImporting(false);
      setWatchedImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    }
  };

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

  const handleUpdateImdbRatings = async () => {
    if (!accessToken) return;

    setUpdatingImdb(true);
    toast.info('Updating IMDb ratings for your saved movies... This may take a moment.');

    try {
      const response = await fetch(`${baseUrl}/movies/update-imdb-ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✨ Successfully updated ${data.results.updated} IMDb ratings!`);
        if (data.results.failed > 0) {
          toast.error(`Could not update ${data.results.failed} ratings`);
        }
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar className="size-10 ring-2 ring-slate-700 hover:ring-blue-500 transition-all">
              <AvatarImage src={photoUrl} />
              <AvatarFallback className="bg-blue-600 text-white">
                {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-slate-800 border-slate-700 p-0" align="end">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <Avatar className="size-16">
                <AvatarImage src={photoUrl} />
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {name ? name[0]?.toUpperCase() : userEmail?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{name || 'User'}</p>
                <p className="text-slate-400 text-sm truncate">{userEmail}</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name" className="text-white text-sm">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-slate-900 border-slate-700 text-white mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="profile-photo" className="text-white text-sm">Photo URL</Label>
                <Input
                  id="profile-photo"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="bg-slate-900 border-slate-700 text-white mt-1.5"
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Save Profile
              </Button>
            </div>

            {/* Import Movies */}
            <div className="pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white mb-2"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="size-4 mr-2" />
                Import Watchlist
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
                onClick={() => setWatchedImportDialogOpen(true)}
              >
                <Upload className="size-4 mr-2" />
                Import Watched Movies
              </Button>
            </div>

            {/* Update IMDb Ratings */}
            <div className="pt-4 border-t border-slate-700">
              <Button 
                onClick={handleUpdateImdbRatings} 
                disabled={updatingImdb}
                variant="outline"
                className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:text-white"
              >
                {updatingImdb ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                Update IMDb Ratings
              </Button>
            </div>

            {/* Sign Out */}
            <div className="pt-4 border-t border-slate-700">
              <Button 
                onClick={onSignOut}
                variant="outline"
                className="w-full bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-800"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen && !importMinimized} onOpenChange={(open) => {
        if (!importing) setImportDialogOpen(open);
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Import Movies from Letterboxd</DialogTitle>
              {importing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportMinimized(true)}
                  className="hover:bg-slate-700"
                >
                  <Minimize2 className="size-4" />
                </Button>
              )}
            </div>
            <DialogDescription className="text-slate-400">
              {importing 
                ? "Import in progress. You can minimize this and continue browsing. We'll notify you when it's done!"
                : "Export your Letterboxd watchlist as CSV and paste it below. The format should be: Date, Name, Year, Letterboxd URI"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importing && importProgress.total > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Batch {importProgress.batch} of {importProgress.totalBatches}</span>
                  <span>{Math.min(importProgress.current + 200, importProgress.total)} / {importProgress.total} movies</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 flex items-center justify-center"
                    style={{ width: `${(Math.min(importProgress.current + 200, importProgress.total) / importProgress.total) * 100}%` }}
                  >
                    <Loader2 className="size-3 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-center text-slate-400 text-sm">
                  Processing batch {importProgress.batch}... This may take a few minutes.
                </p>
              </div>
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
                  placeholder="Date,Name,Year,Letterboxd URI&#10;9/9/2016,Birth of the Dragon,2016,https://boxd.it/a1f8&#10;9/9/2016,Charley Varrick,1973,https://boxd.it/1Z3s&#10;..."
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

      {/* Import Watched Movies Dialog */}
      <Dialog open={watchedImportDialogOpen && !watchedImportMinimized} onOpenChange={(open) => {
        if (!watchedImporting) setWatchedImportDialogOpen(open);
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Import Watched Movies from Letterboxd</DialogTitle>
              {watchedImporting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWatchedImportMinimized(true)}
                  className="hover:bg-slate-700"
                >
                  <Minimize2 className="size-4" />
                </Button>
              )}
            </div>
            <DialogDescription className="text-slate-400">
              {watchedImporting 
                ? "Import in progress. You can minimize this and continue browsing. We'll notify you when it's done!"
                : "Export your watched films from Letterboxd as CSV and paste it below. These movies will be filtered out from Discover."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {watchedImporting && watchedImportProgress.total > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Batch {watchedImportProgress.batch} of {watchedImportProgress.totalBatches}</span>
                  <span>{Math.min(watchedImportProgress.current + 200, watchedImportProgress.total)} / {watchedImportProgress.total} movies</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-green-600 h-full transition-all duration-300 flex items-center justify-center"
                    style={{ width: `${(Math.min(watchedImportProgress.current + 200, watchedImportProgress.total) / watchedImportProgress.total) * 100}%` }}
                  >
                    <Loader2 className="size-3 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-center text-slate-400 text-sm">
                  Processing batch {watchedImportProgress.batch}... This may take a few minutes.
                </p>
              </div>
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
                  placeholder="Date,Name,Year,Letterboxd URI&#10;9/9/2016,Birth of the Dragon,2016,https://boxd.it/a1f8&#10;9/9/2016,Charley Varrick,1973,https://boxd.it/1Z3s&#10;..."
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

      {/* Minimized Import Widgets */}
      {importing && importMinimized && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 text-blue-500 animate-spin" />
              <span className="text-white font-semibold text-sm">Importing Watchlist</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportMinimized(false)}
              className="hover:bg-slate-700 size-8 p-0"
            >
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
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 w-80 z-50" style={{ bottom: importing && importMinimized ? '8rem' : '1.5rem' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 text-green-500 animate-spin" />
              <span className="text-white font-semibold text-sm">Importing Watched</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWatchedImportMinimized(false)}
              className="hover:bg-slate-700 size-8 p-0"
            >
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