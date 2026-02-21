import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router';
import { Film, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { UserInteractionsProvider, useUserInteractions } from './UserInteractionsContext';
import { ImportProvider, useImportContext } from './ImportContext';
import { MinimizedImportWidget } from './MinimizedImportWidget';
import { TooltipProvider } from './ui/tooltip';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationBell } from './NotificationBell';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import duoReelLogo from 'figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png';

export interface AppLayoutContext {
  accessToken: string;
  userEmail: string | null;
  projectId: string;
  publicAnonKey: string;
  likedMovies: any[];
  setLikedMovies: React.Dispatch<React.SetStateAction<any[]>>;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  navigateToDiscoverWithFilter: (
    filterType: 'genre' | 'director' | 'actor' | 'year',
    value: string | number
  ) => void;
  onSignOut: () => Promise<void>;
}

export function useAppLayoutContext() {
  return useOutletContext<AppLayoutContext>();
}

function GlobalImportWidgets() {
  const { watchlist, watched } = useImportContext();

  const watchlistOffset = 24;
  const watchedOffset =
    watchlist.importing && watchlist.minimized ? 128 : 24;

  return (
    <>
      <MinimizedImportWidget
        importState={watchlist}
        color="blue"
        bottomOffset={watchlistOffset}
      />
      <MinimizedImportWidget
        importState={watched}
        color="green"
        bottomOffset={watchedOffset}
      />
    </>
  );
}

// ── Fix 3: inner component that can consume UserInteractionsContext ──
// AppLayout is the Provider, so we can't call useUserInteractions() there.
// AppLayoutContent sits inside the Provider and can call it freely.
interface AppLayoutContentProps {
  context: AppLayoutContext;
  baseUrl: string;
  accessToken: string;
  setLikedMovies: React.Dispatch<React.SetStateAction<any[]>>;
  handleSignOut: () => Promise<void>;
  handleMatchesClick: () => void;
  matchNotificationCount: number;
}

function AppLayoutContent({
  context,
  baseUrl,
  accessToken,
  setLikedMovies,
  handleSignOut,
  handleMatchesClick,
  matchNotificationCount,
}: AppLayoutContentProps) {
  const { refreshInteractions } = useUserInteractions();

  const tabCls = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-200 hover:text-white hover:bg-slate-700'
    }`;

  const matchTabCls = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
      isActive
        ? 'bg-pink-600 text-white'
        : 'text-slate-200 hover:text-white hover:bg-slate-700'
    }`;

  return (
    <ImportProvider
      accessToken={accessToken}
      onWatchlistImported={(imported, failed, total) => {
        // Re-fetch liked movies to reflect the import
        fetch(`${baseUrl}/movies/liked`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then(r => r.ok ? r.json() : Promise.reject(r.status))
          .then(data => { if (data.movies) setLikedMovies(data.movies); })
          .catch(err => console.error('Error refreshing liked movies:', err));

        // Create bell notification for import completion
        fetch(`${baseUrl}/notifications/import-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ type: 'watchlist', imported, failed, total }),
        }).catch(err => console.error('Error creating import notification:', err));
      }}
      onWatchedImported={(imported, failed, total) => {
        // Fix 3: refresh interactions so watchedMovieIds updates immediately
        // without requiring a page reload
        refreshInteractions();

        // Create bell notification for watched import completion
        fetch(`${baseUrl}/notifications/import-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ type: 'watched', imported, failed, total }),
        }).catch(err => console.error('Error creating import notification:', err));
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Sticky header */}
        <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Logo row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={duoReelLogo} alt="DuoReel" className="h-10 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    <span className="text-pink-500">Duo</span>Reel
                  </h1>
                  <p className="text-sm text-slate-400">Find movies you both love</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell accessToken={accessToken} />
                <ProfileDropdown
                  accessToken={accessToken}
                  userEmail={context.userEmail}
                  projectId={projectId}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>

            {/* Tab nav */}
            <nav className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/80 border border-slate-600 rounded-lg p-1 gap-1">
              <NavLink to="/discover" className={tabCls}>
                <Film className="size-4" />
                Discover
              </NavLink>

              <NavLink to="/saved" className={tabCls}>
                <Heart className="size-4" />
                Saved
              </NavLink>

              <NavLink
                to="/matches"
                onClick={handleMatchesClick}
                className={matchTabCls}
              >
                <Users className="size-4" />
                Matches
                {matchNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center animate-pulse">
                    {matchNotificationCount}
                  </span>
                )}
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Page content */}
        <Outlet context={context} />
        <GlobalImportWidgets />
      </div>
    </ImportProvider>
  );
}

export function AppLayout() {
  const { accessToken, userEmail, signOut } = useAuth();
  const navigate = useNavigate();

  const [matchNotificationCount, setMatchNotificationCount] = useState(0);
  const [likedMovies, setLikedMovies] = useState<any[]>([]);
  const [globalImdbCache, setGlobalImdbCache] = useState<Map<string, string>>(new Map());

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // Fetch liked movies once on mount
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${baseUrl}/movies/liked`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (data.movies) setLikedMovies(data.movies); })
      .catch(err => console.error('Error fetching liked movies:', err));
  }, [accessToken]);

  // Poll match notifications every 30 s
  useEffect(() => {
    if (!accessToken) return;

    const fetchNotifications = async () => {
      try {
        const r = await fetch(`${baseUrl}/notifications/matches`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await r.json();
        if (data.count) setMatchNotificationCount(data.count);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleSignOut = async () => {
    try {
      await fetch(`${baseUrl}/auth/signout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('Sign-out request error:', err);
    }
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleMatchesClick = () => {
    if (matchNotificationCount > 0 && accessToken) {
      fetch(`${baseUrl}/notifications/matches/seen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(() => setMatchNotificationCount(0));
    }
  };

  const navigateToDiscoverWithFilter: AppLayoutContext['navigateToDiscoverWithFilter'] = (
    filterType,
    value
  ) => {
    navigate('/discover', { state: { filterType, filterValue: value } });
  };

  const context: AppLayoutContext = {
    accessToken: accessToken!,
    userEmail,
    projectId,
    publicAnonKey,
    likedMovies,
    setLikedMovies,
    globalImdbCache,
    setGlobalImdbCache,
    navigateToDiscoverWithFilter,
    onSignOut: handleSignOut,
  };

  return (
    <TooltipProvider>
      <UserInteractionsProvider accessToken={accessToken}>
        <AppLayoutContent
          context={context}
          baseUrl={baseUrl}
          accessToken={accessToken!}
          setLikedMovies={setLikedMovies}
          handleSignOut={handleSignOut}
          handleMatchesClick={handleMatchesClick}
          matchNotificationCount={matchNotificationCount}
        />
      </UserInteractionsProvider>
    </TooltipProvider>
  );
}