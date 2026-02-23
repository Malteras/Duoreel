import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { API_BASE_URL } from '../../utils/api';

interface ProfileDropdownProps {
  accessToken: string | null;
  userEmail: string | null;
  onSignOut: () => void;
}

export function ProfileDropdown({ accessToken, userEmail, onSignOut }: ProfileDropdownProps) {
  const [profile, setProfile] = useState<any>(null);

  // Fetch profile for avatar + name display
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setProfile(data))
      .catch(err => console.error('Error fetching profile:', err));
  }, [accessToken]);

  const displayName = profile?.name || userEmail || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';
  const photoUrl = profile?.photoUrl;

  // Helper to render avatar (handles gradients and image URLs)
  const renderAvatar = (sizeClass: string, textSizeClass: string) => {
    if (photoUrl && !photoUrl.startsWith('linear-gradient')) {
      return (
        <Avatar className={sizeClass}>
          <AvatarImage src={photoUrl} />
          <AvatarFallback className={`bg-blue-600 text-white ${textSizeClass}`}>
            {initial}
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center text-white ${textSizeClass} font-semibold`}
          style={{ background: photoUrl?.startsWith('linear-gradient') ? photoUrl : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          {initial}
        </div>
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
          {renderAvatar('size-9', 'font-semibold')}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700 text-white">
        {/* User info header */}
        <div className="flex items-center gap-3 px-2 py-3">
          {renderAvatar('size-11', 'text-lg font-semibold')}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Profile link */}
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 hover:text-white focus:text-white">
          <NavLink to="/profile" className="flex items-center gap-2 px-2 py-2">
            <User className="size-4" />
            <span>Profile & Settings</span>
          </NavLink>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={onSignOut}
          className="cursor-pointer text-red-400 hover:bg-red-950 hover:text-red-300 focus:bg-red-950 focus:text-red-300"
        >
          <LogOut className="size-4 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}