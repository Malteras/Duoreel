import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { API_BASE_URL } from "../../utils/api";
import type { Movie } from "../../types/movie";
import { MovieCard } from "./MovieCard";
import { MovieDetailModal } from "./MovieDetailModal";
import { MovieCardSkeletonGrid } from "./MovieCardSkeleton";
import { AdvancedFiltersModal } from "./AdvancedFiltersModal";
import { useUserInteractions } from "./UserInteractionsContext";
import {
  bulkFetchCachedRatings,
  fetchMissingRatings,
  onRatingFetched,
} from "../../utils/imdbRatings";
import { useMovieModal } from "../hooks/useMovieModal";
import { useWatchedActions } from "../hooks/useWatchedActions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  ChevronDown,
  Ban,
  X,
  Film,
} from "lucide-react";

interface MoviesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  initialGenre?: string | null;
  initialDirector?: string | null;
  initialActor?: string | null;
  initialYear?: number | null;
  onFiltersApplied?: () => void;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<
    React.SetStateAction<Map<string, string>>
  >;
  likedMovies: Movie[];
  setLikedMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  discoverCache: import('../hooks/useTabCache').DiscoverCache | null;
  setDiscoverCache: React.Dispatch<React.SetStateAction<import('../hooks/useTabCache').DiscoverCache | null>>;
}

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity" },
  { label: "Highest Rated", value: "rating" },
  { label: "Newest First", value: "year-new" },
  { label: "Oldest First", value: "year-old" },
];

const DECADE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "2020s", value: "2020-2029" },
  { label: "2010s", value: "2010-2019" },
  { label: "2000s", value: "2000-2009" },
  { label: "1990s", value: "1990-1999" },
  { label: "1980s", value: "1980-1989" },
  { label: "1970s", value: "1970-1979" },
];

const RATING_OPTIONS = [
  { label: "All Ratings", value: "all" },
  { label: "8.0+", value: "8" },
  { label: "7.0+", value: "7" },
  { label: "6.0+", value: "6" },
  { label: "5.0+", value: "5" },
];

const DEFAULT_FILTERS = {
  genre: "all",
  decade: "all",
  rating: "all",
  year: "all",
  director: null as string | null,
  actor: null as string | null,
  language: null as string | null,
  duration: "all",
  streamingServices: [] as string[],
};

export function MoviesTab({
  accessToken,
  projectId,
  publicAnonKey,
  initialGenre,
  initialDirector,
  initialActor,
  initialYear,
  onFiltersApplied,
  globalImdbCache,
  setGlobalImdbCache,
  likedMovies,
  setLikedMovies,
  discoverCache,
  setDiscoverCache,
}: MoviesTabProps) {
  // Core state — restored from cache if available
  const [movies, setMovies] = useState<Movie[]>(discoverCache?.movies ?? []);
  const [loading, setLoading] = useState(!discoverCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(discoverCache?.page ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<
    { id: number; name: string }[]
  >([]);

  // Filter state — restored from cache if available
  const [filters, setFilters] = useState(discoverCache?.filters ?? DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState(discoverCache?.sortBy ?? "popularity");
  const [showWatchedMovies, setShowWatchedMovies] =
    useState(discoverCache?.showWatchedMovies ?? false);
  const [showFiltersModal, setShowFiltersModal] =
    useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Movie detail modal state — synced with ?movie=id URL param
  const {
    selectedMovie,
    setSelectedMovie,
    modalOpen,
    openMovie,
    closeMovie,
  } = useMovieModal(accessToken);

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isWatchedLoading, setIsWatchedLoading] = useState(false);

  const { handleWatched, handleUnwatched } = useWatchedActions({
    accessToken,
    closeMovie,
    onWatchedLoading: (loading) => setIsWatchedLoading(loading),
  });

  // IMDb ratings local state (keyed by TMDb ID) — restored from cache if available
  const [imdbRatings, setImdbRatings] = useState<
    Map<number, string>
  >(discoverCache?.imdbRatings ?? new Map());

  // Keep a ref to movies so the onRatingFetched listener can look up IMDb IDs
  // without needing movies in its dep array (which would cause resubscription
  // mid-fetch and lose rating emissions).
  const moviesRef = useRef<typeof movies>(movies);

  // "Not Interested" pending removal state
  const [pendingRemovals, setPendingRemovals] = useState<
    Set<number>
  >(new Set());
  const pendingTimersRef = useRef<Map<number, NodeJS.Timeout>>(
    new Map(),
  );
  const pendingRemovalsRef = useRef<Set<number>>(new Set());
  const likedMovieIdsRef = useRef<Set<number>>(new Set());

  // Keep ref in sync so fetchMovies can read it without being a reactive dependency
  useEffect(() => {
    pendingRemovalsRef.current = pendingRemovals;
  }, [pendingRemovals]);

  // Keep moviesRef in sync so onRatingFetched listener can look up IMDb IDs
  // without movies being in its dep array.
  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  // Movie details enrichment tracking — restored from cache if available
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(
    discoverCache?.enrichedIds ?? new Set(),
  );
  const enrichingRef = useRef<Set<number>>(discoverCache?.enrichedIds ? new Set(discoverCache.enrichedIds) : new Set());

  // Skip the initial fetch if we restored from cache. Set to true when cache is
  // present; cleared to false on the first user-triggered filter/sort change.
  const skipNextFetchRef = useRef(!!discoverCache);

  // Skip the IMDb ratings fetch if we restored ratings from cache. Ratings are
  // already in imdbRatings state — no need to re-fetch from the DB.
  const skipRatingsFetchRef = useRef(!!discoverCache);

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Context for watched/not-interested
  const {
    watchedMovieIds,
    notInterestedMovieIds,
    toggleNotInterested,
    isWatched,
    isNotInterested,
    watchedLoadingIds,
    notInterestedLoadingIds,
    isInitialLoading: contextLoading,
  } = useUserInteractions();

  const baseUrl = API_BASE_URL;

  // Liked movie IDs set for quick lookup
  const likedMovieIds = useMemo(
    () => new Set(likedMovies.map((m) => m.id)),
    [likedMovies],
  );

  // Keep ref in sync so fetchMovies can read it without being a reactive dependency
  useEffect(() => {
    likedMovieIdsRef.current = likedMovieIds;
  }, [likedMovieIds]);

  // Active filter count for badge display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.genre !== "all") count++;
    if (filters.decade !== "all") count++;
    if (filters.rating !== "all") count++;
    if (filters.year !== "all") count++;
    if (filters.director) count++;
    if (filters.actor) count++;
    if (filters.language) count++;
    if (filters.duration !== "all") count++;
    if (filters.streamingServices.length > 0) count++;
    return count;
  }, [filters]);

  // ──────────────── Fetch genres ────────────────
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${baseUrl}/genres`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        const data = await response.json();
        if (data.genres) {
          setGenres(data.genres);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  // ──────────────── Apply initial filters from cross-tab navigation ────────────────
  useEffect(() => {
    if (initialDirector || initialActor || initialYear) {
      const newFilters = { ...filters };
      if (initialDirector)
        newFilters.director = initialDirector;
      if (initialActor) newFilters.actor = initialActor;
      if (initialYear) newFilters.year = initialYear.toString();
      setFilters(newFilters);
      onFiltersApplied?.();
    }
  }, [initialDirector, initialActor, initialYear]);

  // ──────────────── Fetch movies (discover) ────────────────
  const fetchMovies = useCallback(
    async (pageNum: number, append = false) => {
      if (!accessToken) return;

      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        // Build query params
        const params = new URLSearchParams({
          page: pageNum.toString(),
        });

        if (filters.genre !== "all")
          params.append("genre", filters.genre);
        if (filters.rating !== "all")
          params.append("minRating", filters.rating);
        if (filters.director)
          params.append("director", filters.director);
        if (filters.actor)
          params.append("actor", filters.actor);
        if (filters.language)
          params.append("language", filters.language);
        if (filters.duration !== "all")
          params.append("duration", filters.duration);
        if (showWatchedMovies)
          params.append("includeWatched", "true");

        // Handle year vs decade
        if (filters.year !== "all") {
          params.append("year", filters.year);
        } else if (filters.decade !== "all") {
          // Pass the full decade range (e.g., "2020-2029") so the server can use date range filtering
          params.append("decade", filters.decade);
        }

        // Map sort
        let tmdbSort = "popularity.desc";
        if (sortBy === "rating") tmdbSort = "vote_average.desc";
        else if (sortBy === "year-new")
          tmdbSort = "primary_release_date.desc";
        else if (sortBy === "year-old")
          tmdbSort = "primary_release_date.asc";
        params.append("sortBy", tmdbSort);

        // Streaming services
        if (filters.streamingServices.length > 0) {
          params.append(
            "streamingServices",
            filters.streamingServices.join("|"),
          );
        }

        // Use the server-side filtered endpoint which excludes watched/not-interested
        const response = await fetch(
          `${baseUrl}/movies/discover-filtered?${params}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const data = await response.json();

        if (data.results) {
          // Also filter out liked movies from discover (they already saved them)
          const newMovies = (data.results as Movie[]).filter(
            (m) =>
              !likedMovieIdsRef.current.has(m.id) &&
              !pendingRemovalsRef.current.has(m.id),
          );

          if (append) {
            setMovies((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const deduped = newMovies.filter((m) => !existingIds.has(m.id));
              const next = [...prev, ...deduped];
              // Write cache with the merged list
              setDiscoverCache(c => ({
                movies: next,
                page: pageNum,
                filters,
                sortBy,
                showWatchedMovies,
                imdbRatings,
                enrichedIds: c?.enrichedIds ?? new Set(),
              }));
              return next;
            });
          } else {
            setMovies(newMovies);
            // Write cache with the fresh list
            setDiscoverCache(c => ({
              movies: newMovies,
              page: pageNum,
              filters,
              sortBy,
              showWatchedMovies,
              imdbRatings,
              enrichedIds: c?.enrichedIds ?? new Set(),
            }));
          }

          setHasMore(newMovies.length >= 10);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        toast.error("Failed to load movies");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      accessToken,
      filters,
      sortBy,
      showWatchedMovies,
      baseUrl,
    ],
  );

  // ──────────────── Fetch when filters/sort/showWatched change ────────────────
  // Note: We include `showWatchedMovies` in the dependency array so that when the
  // actual filter/sort change does trigger a fetch, the correct `includeWatched`
  // param is sent to the server.
  useEffect(() => {
    if (contextLoading) return; // Wait for interactions to load first

    // If we just restored from cache, skip this initial fetch. The ref is cleared
    // so the next filter/sort/showWatched change fetches normally.
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    setPage(1);
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
    setImdbRatings(new Map());
    fetchMovies(1, false);
    // fetchMovies is included so this effect always runs with the freshest
    // callback (no stale likedMovieIds / pendingRemovals closures).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, showWatchedMovies, contextLoading, fetchMovies]);

  // ──────────────── Enrich movies with details (director, actors, providers) ────────────────
  useEffect(() => {
    if (movies.length === 0) return;

    const enrichMovies = async () => {
      const moviesToEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id),
      );

      if (moviesToEnrich.length === 0) return;

      // Mark as in-progress
      moviesToEnrich.forEach((m) =>
        enrichingRef.current.add(m.id),
      );

      // Fetch details in batches of 5
      const BATCH_SIZE = 5;
      for (
        let i = 0;
        i < moviesToEnrich.length;
        i += BATCH_SIZE
      ) {
        const batch = moviesToEnrich.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (movie) => {
            try {
              const response = await fetch(
                `${baseUrl}/movies/${movie.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${publicAnonKey}`,
                  },
                },
              );
              if (!response.ok) return null;
              return await response.json();
            } catch {
              return null;
            }
          }),
        );

        setMovies((prev) =>
          prev.map((movie) => {
            const detail = results.find(
              (r) => r && r.id === movie.id,
            );
            if (!detail) return movie;

            const director = detail.credits?.crew?.find(
              (c) => c.job === "Director",
            )?.name;
            const actors = detail.credits?.cast
              ?.slice(0, 5)
              .map((a) => a.name);

            return {
              ...movie,
              director: director || movie.director,
              actors: actors || movie.actors,
              genres: detail.genres || movie.genres,
              runtime: detail.runtime || movie.runtime,
              external_ids:
                detail.external_ids || movie.external_ids,
              "watch/providers":
                detail["watch/providers"] ||
                movie["watch/providers"],
              tagline: detail.tagline,
              budget: detail.budget,
              revenue: detail.revenue,
              original_language:
                detail.original_language ||
                movie.original_language,
              status: detail.status,
              homepage: detail.homepage,
              vote_count: detail.vote_count || movie.vote_count,
            };
          }),
        );

        // Track enriched
        batch.forEach((m) => {
          setEnrichedIds((prev) => new Set(prev).add(m.id));
        });

        // Small delay between batches
        if (i + BATCH_SIZE < moviesToEnrich.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, 200),
          );
        }
      }
    };

    enrichMovies();
  }, [movies.length, enrichedIds.size]);

  // ─────────────── Fetch IMDb ratings ────────────────
  useEffect(() => {
    if (movies.length === 0) return;

    // Skip if we restored ratings from cache — they're already in imdbRatings state.
    if (skipRatingsFetchRef.current) {
      skipRatingsFetchRef.current = false;
      return;
    }

    const fetchRatings = async () => {
      // Get TMDb IDs for bulk fetch
      const tmdbIds = movies.map((m) => m.id);

      // Bulk fetch cached ratings
      const cached = await bulkFetchCachedRatings(
        tmdbIds,
        projectId,
        publicAnonKey,
      );

      if (cached.size > 0) {
        setImdbRatings((prev) => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            if (value.rating) updated.set(tmdbId, value.rating);
          });
          return updated;
        });

        // Also write into globalImdbCache (keyed by IMDb ID) so Saved and Matches tabs benefit
        setGlobalImdbCache((prev) => {
          const updated = new Map(prev);
          cached.forEach((value, tmdbId) => {
            const imdbId = movies.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
            if (imdbId && value.rating) updated.set(imdbId, value.rating);
          });
          return updated;
        });
      }

      // Background fetch missing ratings for movies with IMDb IDs.
      // Also skip movies whose rating is already in local imdbRatings state —
      // they were fetched on a previous visit and don't need another OMDb call.
      const moviesWithImdbIds = movies.filter(
        (m) => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id),
      );

      if (moviesWithImdbIds.length > 0) {
        const visibleIds = new Set(
          movies.slice(0, 8).map((m) => m.id),
        );
        fetchMissingRatings(
          moviesWithImdbIds,
          visibleIds,
          projectId,
          publicAnonKey,
        );
      }
    };

    fetchRatings();
  }, [movies, enrichedIds.size]);

  // Listen for individual rating updates from background fetch
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      setImdbRatings((prev) => new Map(prev).set(tmdbId, rating));
      // Also write into globalImdbCache so other tabs get the rating immediately
      const imdbId = moviesRef.current.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) setGlobalImdbCache((prev) => new Map(prev).set(imdbId, rating));
    });
    return unsubscribe;
  }, []);

  // Keep discoverCache.imdbRatings in sync as background fetches complete.
  // Note: discoverCache intentionally omitted from deps — including it creates
  // an infinite loop (setDiscoverCache produces a new object → dep changes → re-fires).
  // The updater function `c => ...` safely handles the null check without it.
  useEffect(() => {
    setDiscoverCache(c => c ? { ...c, imdbRatings } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imdbRatings]);

  // Keep discoverCache.enrichedIds in sync as enrichment completes.
  // Same reasoning — discoverCache intentionally omitted from deps.
  useEffect(() => {
    setDiscoverCache(c => c ? { ...c, enrichedIds } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedIds]);

  // ──────────────── Search movies ────────────────
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setIsSearchMode(false);
        setPage(1);
        fetchMovies(1, false);
        return;
      }

      setIsSearching(true);
      setIsSearchMode(true);

      try {
        const response = await fetch(
          `${baseUrl}/movies/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const data = await response.json();

        if (data.results) {
          setMovies(data.results);
          setEnrichedIds(new Set());
          enrichingRef.current = new Set();
        }
      } catch (error) {
        console.error("Error searching movies:", error);
        toast.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [baseUrl, publicAnonKey, fetchMovies],
  );

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setIsSearchMode(false);
      setPage(1);
      fetchMovies(1, false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // ──────────────── Like / Unlike ────────────────
  const handleLike = async (movie: Movie) => {
    if (!accessToken) return;

    setIsLikeLoading(true);

    try {
      const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
        genres: movie.genres,
        runtime: movie.runtime,
        director: movie.director,
        actors: movie.actors,
        external_ids: movie.external_ids,
        "watch/providers": movie["watch/providers"],
        original_language: movie.original_language,
        homepage: movie.homepage,
      };

      const response = await fetch(`${baseUrl}/movies/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ movie: movieData }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add to liked movies and remove from discover feed
        setLikedMovies((prev) => [...prev, movieData]);
        setMovies((prev) =>
          prev.filter((m) => m.id !== movie.id),
        );

        if (data.isMatch) {
          toast.success(
            `It's a match! You both like "${movie.title}"`,
            {
              duration: 5000,
              icon: "💕",
            },
          );
        } else {
          toast.success(`Saved "${movie.title}"`);
        }

        closeMovie();
      }
    } catch (error) {
      console.error("Error liking movie:", error);
      toast.error("Failed to save movie");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${baseUrl}/movies/like/${movieId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.ok) {
        setLikedMovies((prev) =>
          prev.filter((m) => m.id !== movieId),
        );
        toast.success("Removed from saved list");
      }
    } catch (error) {
      console.error("Error unliking movie:", error);
      toast.error("Failed to remove movie");
    }
  };

  // ──────────────── Not Interested (pending removal + undo toast) ────────────────
  const handleNotInterested = (movieId: number) => {
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;

    // Immediately hide from feed (optimistic)
    setPendingRemovals((prev) => new Set(prev).add(movieId));

    // Set a timer to actually persist the removal
    const timer = setTimeout(async () => {
      try {
        await toggleNotInterested(movieId, true);
        // Remove movie from list permanently
        setMovies((prev) =>
          prev.filter((m) => m.id !== movieId),
        );
      } catch (error) {
        console.error("Error marking not interested:", error);
      } finally {
        setPendingRemovals((prev) => {
          const updated = new Set(prev);
          updated.delete(movieId);
          return updated;
        });
        pendingTimersRef.current.delete(movieId);
      }
    }, 4000);

    pendingTimersRef.current.set(movieId, timer);

    toast(`"${movie.title}" removed`, {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          // Cancel the pending removal
          const existingTimer =
            pendingTimersRef.current.get(movieId);
          if (existingTimer) {
            clearTimeout(existingTimer);
            pendingTimersRef.current.delete(movieId);
          }
          setPendingRemovals((prev) => {
            const updated = new Set(prev);
            updated.delete(movieId);
            return updated;
          });
          toast.success(`Restored "${movie.title}"`);
        },
      },
    });
  };

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timer) =>
        clearTimeout(timer),
      );
    };
  }, []);

  // ──────────────── Infinite scroll ────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isSearchMode &&
          pendingRemovals.size === 0
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMovies(nextPage, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasMore,
    loadingMore,
    loading,
    isSearchMode,
    page,
    fetchMovies,
    pendingRemovals,
  ]);

  // ──────────────── Filter handlers ────────────────
  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  const updateFilter = (key: keyof typeof filters, value: typeof filters[keyof typeof filters]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortBy("popularity");
    setShowWatchedMovies(false);
    setPage(1);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  const handleRefresh = () => {
    setDiscoverCache(null); // Invalidate  next mount will fetch fresh
    skipNextFetchRef.current = false;
    setPage(1);
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
    setImdbRatings(new Map());
    fetchMovies(1, false);
  };

  // ──────────────── Visible (non-pending) movies ────────────────
  const visibleMovies = useMemo(
    () =>
      movies.filter((m) => {
        // Hide movies pending "not interested" removal
        if (pendingRemovals.has(m.id)) return false;
        // ✅ FIX: Hide watched movies client-side when "Show Watched" is OFF.
        // This is the single source of truth for watched visibility, replacing
        // the manual setMovies() call in handleWatched that caused Scenarios B & D
        // to break. watchedMovieIds comes from UserInteractionsContext and updates
        // reactively whenever toggleWatched() is called (optimistic update).
        if (!showWatchedMovies && watchedMovieIds.has(m.id))
          return false;
        return true;
      }),
    [
      movies,
      pendingRemovals,
      showWatchedMovies,
      watchedMovieIds,
    ],
  );

  // ──────────────── Genre name helper ────────────────
  const getGenreName = (genreId: string) => {
    const genre = genres.find(
      (g) => g.id.toString() === genreId,
    );
    return genre?.name || "Unknown";
  };

  // ──────────────── Render ────────────────
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center text-white">
          <Film className="size-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-2xl font-bold mb-2">
            Sign in to discover movies
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ minHeight: '100dvh' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Row 1: Search · Genre · Decade · Rating · Filters · Refresh */}
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) =>
                  handleSearchInputChange(e.target.value)
                }
                placeholder="Search movies..."
                className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 h-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 animate-spin" />
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchMode(false);
                    fetchMovies(1, false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Genre · Decade · Rating — desktop only */}
            <div className="hidden md:flex gap-3 items-center">
              {/* Genre */}
              <Select
                value={filters.genre}
                onValueChange={(value) => updateFilter("genre", value)}
              >
                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white h-11 w-[150px]">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Genres
                  </SelectItem>
                  {genres.map((g) => (
                    <SelectItem
                      key={g.id}
                      value={g.id.toString()}
                    >
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Decade */}
              <Select
                value={filters.decade}
                onValueChange={(value) => updateFilter("decade", value)}
              >
                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white h-11 w-[130px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  {DECADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Rating */}
              <Select
                value={filters.rating}
                onValueChange={(value) => updateFilter("rating", value)}
              >
                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white h-11 w-[130px]">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  {RATING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters (advanced) — always visible */}
            <Button
              variant="outline"
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:text-white h-9 px-3 relative shrink-0"
              onClick={() => setShowFiltersModal(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="size-3.5 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Refresh — always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:text-white h-9 px-3 shrink-0"
                  onClick={handleRefresh}
                  aria-label="Refresh movies"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>Refresh movies</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Row 2: Sort + remaining active filter badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-fit min-w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active filter badges — Genre/Decade/Rating handled by inline dropdowns above */}
            {filters.director && (
              <Badge
                variant="secondary"
                className="bg-blue-600/70 text-white border-blue-500 cursor-pointer hover:bg-blue-700"
                onClick={() =>
                  setFilters({ ...filters, director: null })
                }
              >
                Director: {filters.director}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {filters.actor && (
              <Badge
                variant="secondary"
                className="bg-blue-600/70 text-white border-blue-500 cursor-pointer hover:bg-blue-700"
                onClick={() =>
                  setFilters({ ...filters, actor: null })
                }
              >
                Actor: {filters.actor}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {filters.year !== "all" && (
              <Badge
                variant="secondary"
                className="bg-green-600/70 text-white border-green-500 cursor-pointer hover:bg-green-700"
                onClick={() =>
                  setFilters({ ...filters, year: "all" })
                }
              >
                Year: {filters.year}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {filters.language && (
              <Badge
                variant="secondary"
                className="bg-cyan-600/70 text-white border-cyan-500 cursor-pointer hover:bg-cyan-700"
                onClick={() =>
                  setFilters({ ...filters, language: null })
                }
              >
                Language: {filters.language.toUpperCase()}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {filters.duration !== "all" && (
              <Badge
                variant="secondary"
                className="bg-orange-600/70 text-white border-orange-500 cursor-pointer hover:bg-orange-700"
                onClick={() =>
                  setFilters({ ...filters, duration: "all" })
                }
              >
                Duration: {filters.duration}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {filters.streamingServices.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-indigo-600/70 text-white border-indigo-500 cursor-pointer hover:bg-indigo-700"
                onClick={() =>
                  setFilters({
                    ...filters,
                    streamingServices: [],
                  })
                }
              >
                {filters.streamingServices.length} streaming
                service
                {filters.streamingServices.length !== 1
                  ? "s"
                  : ""}{" "}
                <X className="size-3 ml-1" />
              </Badge>
            )}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-7 text-xs"
                onClick={handleClearFilters}
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Search mode indicator */}
          {isSearchMode && (
            <div className="flex items-center gap-2 text-slate-300">
              <Search className="size-4" />
              <span>
                Search results for "{searchQuery}" —{" "}
                {visibleMovies.length} movie
                {visibleMovies.length !== 1 ? "s" : ""} found
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 h-6"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchMode(false);
                  fetchMovies(1, false);
                }}
              >
                Back to discover
              </Button>
            </div>
          )}
        </div>

        {/* Movie Grid */}
        {loading || contextLoading ? (
          <MovieCardSkeletonGrid count={8} />
        ) : visibleMovies.length === 0 ? (
          <div className="text-center py-20">
            <Film className="size-20 mx-auto mb-6 text-slate-700" />
            <h3 className="text-2xl font-semibold text-white mb-3">
              {isSearchMode
                ? "No movies found"
                : "No more movies to discover"}
            </h3>
            <p className="text-slate-400 text-lg mb-6">
              {isSearchMode
                ? "Try a different search term"
                : "Try adjusting your filters or refreshing"}
            </p>
            {activeFilterCount > 0 && (
              <Button
                onClick={handleClearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLiked={likedMovieIds.has(movie.id)}
                  isWatched={isWatched(movie.id)}
                  onLike={() => handleLike(movie)}
                  onUnlike={() => handleUnlike(movie.id)}
                  onNotInterested={() =>
                    handleNotInterested(movie.id)
                  }
                  isNotInterestedLoading={notInterestedLoadingIds.has(
                    movie.id,
                  )}
                  onClick={() => openMovie(movie)}
                  onDirectorClick={(director) => updateFilter("director", director)}
                  onGenreClick={(genreId) => updateFilter("genre", genreId.toString())}
                  onYearClick={(year) => updateFilter("year", year.toString())}
                  onActorClick={(actor) => updateFilter("actor", actor)}
                  imdbRating={imdbRatings.get(movie.id)}
                  projectId={projectId}
                  publicAnonKey={publicAnonKey}
                  globalImdbCache={globalImdbCache}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel + loading indicator */}
            {!isSearchMode && (
              <div
                ref={sentinelRef}
                className="flex justify-center mt-8 h-12 items-center"
              >
                {loadingMore && (
                  <Film className="size-8 animate-spin text-slate-400" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile Filters FAB — only on mobile, only outside search mode ── */}
      {!isSearchMode && (
        <button
          className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-slate-800 border border-slate-600 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
          onClick={() => setShowFiltersModal(true)}
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        genres={genres}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        showWatchedMovies={showWatchedMovies}
        onShowWatchedMoviesChange={setShowWatchedMovies}
        watchedMoviesCount={watchedMovieIds.size}
      />

      {/* Movie Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={modalOpen}
        onClose={closeMovie}
        isLiked={
          selectedMovie
            ? likedMovieIds.has(selectedMovie.id)
            : false
        }
        onLike={() =>
          selectedMovie && handleLike(selectedMovie)
        }
        onUnlike={() =>
          selectedMovie && handleUnlike(selectedMovie.id)
        }
        onDislike={() => {}}
        onNotInterested={() =>
          selectedMovie && handleNotInterested(selectedMovie.id)
        }
        isWatched={
          selectedMovie ? isWatched(selectedMovie.id) : false
        }
        onWatched={() =>
          selectedMovie && handleWatched(selectedMovie)
        }
        onUnwatched={() =>
          selectedMovie && handleUnwatched(selectedMovie.id)
        }
        isLikeLoading={isLikeLoading}
        isDislikeLoading={false}
        isWatchedLoading={
          isWatchedLoading ||
          (selectedMovie
            ? watchedLoadingIds.has(selectedMovie.id)
            : false)
        }
        onGenreClick={(genreId) => {
          updateFilter("genre", genreId.toString());
          closeMovie();
        }}
        onDirectorClick={(director) => {
          updateFilter("director", director);
          closeMovie();
        }}
        onActorClick={(actor) => {
          updateFilter("actor", actor);
          closeMovie();
        }}
        onLanguageClick={() => {}}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
        imdbRatingFromCard={selectedMovie ? (imdbRatings.get(selectedMovie.id) || null) : null}
      />
    </div>
  );
}