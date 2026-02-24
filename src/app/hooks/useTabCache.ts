import { useState } from 'react';
import type { Movie } from '../../types/movie';

// ── Discover cache ────────────────────────────────────────────────────────────
// Stores the full browse state so returning to Discover restores exactly where
// the user left off — same movies, same filters, same scroll position (page).
export interface DiscoverCache {
  movies: Movie[];
  page: number;
  filters: {
    genre: string;
    decade: string;
    rating: string;
    year: string;
    director: string | null;
    actor: string | null;
    language: string | null;
    duration: string;
    streamingServices: string[];
  };
  sortBy: string;
  showWatchedMovies: boolean;
  imdbRatings: Map<number, string>;
  enrichedIds: Set<number>;
}

// ── Saved cache ───────────────────────────────────────────────────────────────
// Stores the partner list (partner's own movies never change per the user's
// actions, so they're safe to cache). The key reload signal is likedMoviesLength
// — if the user saved new movies in Discover, Saved must re-fetch.
export interface SavedCache {
  partnerLikedMovies: Movie[];
  partnerName: string;
  hasPartner: boolean;
  inviteCode: string;
  outgoingRequests: any[];
  likedMoviesLengthAtLoad: number; // snapshot of likedMovies.length when Saved last fetched
}

// ── Matches cache ─────────────────────────────────────────────────────────────
// Stores the matched movies list. Reload signal is matchNotificationCount — if
// there are new unread match notifications, the list needs a fresh fetch.
export interface MatchesCache {
  matchedMovies: Movie[];
  partner: any | null;
  inviteCode: string;
  matchCountAtLoad: number; // matchNotificationCount when Matches last fetched
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTabCache() {
  const [discoverCache, setDiscoverCache] = useState<DiscoverCache | null>(null);
  const [savedCache, setSavedCache]       = useState<SavedCache | null>(null);
  const [matchesCache, setMatchesCache]   = useState<MatchesCache | null>(null);

  return {
    discoverCache, setDiscoverCache,
    savedCache,    setSavedCache,
    matchesCache,  setMatchesCache,
  };
}
