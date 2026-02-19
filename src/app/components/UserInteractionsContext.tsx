import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { projectId } from '/utils/supabase/info';

interface MovieInteraction {
  tmdbId: number;
  isWatched: boolean;
  isNotInterested: boolean;
  watchedAt?: string | null;
  notInterestedAt?: string | null;
  updatedAt?: string;
  rating?: number | null;
}

interface UserInteractionsContextType {
  interactions: Map<number, MovieInteraction>;
  watchedMovieIds: Set<number>;
  notInterestedMovieIds: Set<number>;
  toggleWatched: (tmdbId: number, watched: boolean) => Promise<void>;
  toggleNotInterested: (tmdbId: number, notInterested: boolean) => Promise<void>;
  isWatched: (tmdbId: number) => boolean;
  isNotInterested: (tmdbId: number) => boolean;
  watchedLoadingIds: Set<number>;
  notInterestedLoadingIds: Set<number>;
  refreshInteractions: () => Promise<void>;
  isInitialLoading: boolean;
}

const UserInteractionsContext = createContext<UserInteractionsContextType | null>(null);

export function UserInteractionsProvider({
  children,
  accessToken,
}: {
  children: ReactNode;
  accessToken: string | null;
}) {
  const [interactions, setInteractions] = useState<Map<number, MovieInteraction>>(new Map());
  const [watchedLoadingIds, setWatchedLoadingIds] = useState<Set<number>>(new Set());
  const [notInterestedLoadingIds, setNotInterestedLoadingIds] = useState<Set<number>>(new Set());
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  // Load all interactions on mount / auth change
  const refreshInteractions = useCallback(async () => {
    if (!accessToken) {
      setInteractions(new Map());
      return;
    }

    setIsInitialLoading(true);
    try {
      const response = await fetch(`${baseUrl}/movies/interactions/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();

      if (data.interactions && Array.isArray(data.interactions)) {
        const map = new Map<number, MovieInteraction>();
        data.interactions.forEach((interaction: MovieInteraction) => {
          if (interaction.tmdbId) {
            map.set(interaction.tmdbId, interaction);
          }
        });
        setInteractions(map);
        console.log(`Loaded ${map.size} user interactions`);
      }
    } catch (error) {
      console.error('Error loading user interactions:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [accessToken, baseUrl]);

  useEffect(() => {
    refreshInteractions();
  }, [refreshInteractions]);

  // Derived sets
  const watchedMovieIds = useMemo(() => {
    const ids = new Set<number>();
    interactions.forEach((interaction) => {
      if (interaction.isWatched) ids.add(interaction.tmdbId);
    });
    return ids;
  }, [interactions]);

  const notInterestedMovieIds = useMemo(() => {
    const ids = new Set<number>();
    interactions.forEach((interaction) => {
      if (interaction.isNotInterested) ids.add(interaction.tmdbId);
    });
    return ids;
  }, [interactions]);

  // Toggle watched status with optimistic update
  const toggleWatched = useCallback(
    async (tmdbId: number, watched: boolean) => {
      if (!accessToken) return;

      // Set loading state
      setWatchedLoadingIds((prev) => new Set(prev).add(tmdbId));

      // Optimistic update
      setInteractions((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(tmdbId) || {
          tmdbId,
          isWatched: false,
          isNotInterested: false,
        };
        updated.set(tmdbId, {
          ...existing,
          isWatched: watched,
          watchedAt: watched ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });

      try {
        if (watched) {
          const response = await fetch(`${baseUrl}/movies/watched`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ movie: { id: tmdbId } }),
          });
          // ✅ FIX Bug 2: Check HTTP response status — fetch() only throws on
          // network failure, not on HTTP 4xx/5xx. Without this check, a server
          // error silently leaves the optimistic update in place while the data
          // is never actually written to the KV store. On reload the state is
          // lost because there's nothing in the backend to restore from.
          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error(
              `Failed to persist watched status for movie ${tmdbId} (HTTP ${response.status}):`,
              errorBody
            );
            throw new Error(`HTTP ${response.status}: Failed to save watched status`);
          }
        } else {
          const response = await fetch(`${baseUrl}/movies/watched/${tmdbId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error(
              `Failed to remove watched status for movie ${tmdbId} (HTTP ${response.status}):`,
              errorBody
            );
            throw new Error(`HTTP ${response.status}: Failed to remove watched status`);
          }
        }
      } catch (error) {
        console.error('Error toggling watched status:', error);
        // Revert optimistic update — fetch fresh state from server
        refreshInteractions();
      } finally {
        setWatchedLoadingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(tmdbId);
          return updated;
        });
      }
    },
    [accessToken, baseUrl, refreshInteractions]
  );

  // Toggle not-interested status with optimistic update
  const toggleNotInterested = useCallback(
    async (tmdbId: number, notInterested: boolean) => {
      if (!accessToken) return;

      // Set loading state
      setNotInterestedLoadingIds((prev) => new Set(prev).add(tmdbId));

      // Optimistic update
      setInteractions((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(tmdbId) || {
          tmdbId,
          isWatched: false,
          isNotInterested: false,
        };
        updated.set(tmdbId, {
          ...existing,
          isNotInterested: notInterested,
          notInterestedAt: notInterested ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });

      try {
        if (notInterested) {
          await fetch(`${baseUrl}/movies/not-interested`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ movieId: tmdbId }),
          });
        } else {
          await fetch(`${baseUrl}/movies/not-interested/${tmdbId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      } catch (error) {
        console.error('Error toggling not-interested status:', error);
        refreshInteractions();
      } finally {
        setNotInterestedLoadingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(tmdbId);
          return updated;
        });
      }
    },
    [accessToken, baseUrl, refreshInteractions]
  );

  // Helper functions
  const isWatched = useCallback(
    (tmdbId: number) => interactions.get(tmdbId)?.isWatched || false,
    [interactions]
  );

  const isNotInterested = useCallback(
    (tmdbId: number) => interactions.get(tmdbId)?.isNotInterested || false,
    [interactions]
  );

  const value = useMemo(
    () => ({
      interactions,
      watchedMovieIds,
      notInterestedMovieIds,
      toggleWatched,
      toggleNotInterested,
      isWatched,
      isNotInterested,
      watchedLoadingIds,
      notInterestedLoadingIds,
      refreshInteractions,
      isInitialLoading,
    }),
    [
      interactions,
      watchedMovieIds,
      notInterestedMovieIds,
      toggleWatched,
      toggleNotInterested,
      isWatched,
      isNotInterested,
      watchedLoadingIds,
      notInterestedLoadingIds,
      refreshInteractions,
      isInitialLoading,
    ]
  );

  return (
    <UserInteractionsContext.Provider value={value}>
      {children}
    </UserInteractionsContext.Provider>
  );
}

export function useUserInteractions() {
  const context = useContext(UserInteractionsContext);
  if (!context) {
    // Return safe no-op defaults when used outside the provider
    // (e.g. during component preview in Figma Make)
    return {
      interactions: new Map<number, any>(),
      watchedMovieIds: new Set<number>(),
      notInterestedMovieIds: new Set<number>(),
      toggleWatched: async () => {},
      toggleNotInterested: async () => {},
      isWatched: () => false,
      isNotInterested: () => false,
      watchedLoadingIds: new Set<number>(),
      notInterestedLoadingIds: new Set<number>(),
      refreshInteractions: async () => {},
      isInitialLoading: false,
    } as UserInteractionsContextType;
  }
  return context;
}