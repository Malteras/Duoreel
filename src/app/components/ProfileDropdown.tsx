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

interface ProfileDropdownProps {
  accessToken: string | null;
  userEmail: string | null;
  projectId: string;
  onSignOut: () => void;
}

export function ProfileDropdown({ accessToken, userEmail, projectId, onSignOut }: ProfileDropdownProps) {
  const [profile, setProfile] = useState<any>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // Fetch profile for avatar + name display
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${baseUrl}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setProfile(data))
      .catch(err => console.error('Error fetching profile:', err));
  }, [accessToken]);

  const displayName = profile?.name || userEmail || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
          <Avatar className="size-9">
            <AvatarImage src={profile?.photoUrl} />
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700 text-white">
        {/* User info header */}
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="size-11">
            <AvatarImage src={profile?.photoUrl} />
            <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
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