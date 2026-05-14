import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { API_BASE_URL } from "../../utils/api";
import { type Filters, DEFAULT_FILTERS } from "../../utils/filters";
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
  readLocalImdbCache,
  writeBulkLocalImdbCache,
} from "../../utils/imdbRatings";
import { useMovieModal } from "../hooks/useMovieModal";
import { useWatchedActions } from "../hooks/useWatchedActions";
import { useEnrichMovies } from "../hooks/useEnrichMovies";
// SectionPreviewCard imports removed in QUI-221 — replaced by CompactMovieCard grid
import { CompactMovieCard } from './CompactMovieCard';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ban,
  Bookmark,
  X,
  Film,
  LayoutGrid,
  // List, // kept for list view — see commented-out dead code block below the compact grid
  LayoutList,
  ArrowUpDown,
  Users,
  RefreshCw,
  Shuffle,
} from "lucide-react";

function getGemsGenreId(likedMovies: any[], genres: { id: number; name: string }[]): number | null {
  const genreCounts = new Map<number, number>();
  for (const movie of likedMovies) {
    const ids: number[] = movie.genres?.map((g: any) => g.id) ?? movie.genre_ids ?? [];
    for (const id of ids) {
      genreCounts.set(id, (genreCounts.get(id) ?? 0) + 1);
    }
  }
  if (genreCounts.size > 0) {
    const sorted = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3);
    const [pickedId] = top3[Math.floor(Math.random() * top3.length)];
    return pickedId;
  }
  if (genres.length > 0) {
    return genres[Math.floor(Math.random() * genres.length)].id;
  }
  return null;
}

interface MoviesTabProps {
  accessToken: string | null;
  projectId: string;
  publicAnonKey: string;
  initialGenre?: string | null;
  initialDirector?: string | null;
  initialActor?: string | null;
  initialYear?: number | null;
  initialKeyword?: string | null;
  initialKeywordName?: string | null;
  onFiltersApplied?: () => void;
  globalImdbCache: Map<string, string>;
  setGlobalImdbCache: React.Dispatch<
    React.SetStateAction<Map<string, string>>
  >;
  likedMovies: Movie[];
  setLikedMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  discoverCache: import('../hooks/useTabCache').DiscoverCache | null;
  setDiscoverCache: React.Dispatch<React.SetStateAction<import('../hooks/useTabCache').DiscoverCache | null>>;
  cardViewMode: 'grid' | 'compact' | 'list';
  setCardViewMode: (mode: 'grid' | 'compact' | 'list') => void;
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

export function MoviesTab({
  accessToken,
  projectId,
  publicAnonKey,
  initialGenre,
  initialDirector,
  initialActor,
  initialYear,
  initialKeyword,
  initialKeywordName,
  onFiltersApplied,
  globalImdbCache,
  setGlobalImdbCache,
  likedMovies,
  setLikedMovies,
  discoverCache,
  setDiscoverCache,
  cardViewMode: cardViewModeProp,
  setCardViewMode,
}: MoviesTabProps) {
  // Core state — restored from cache if available
  // When arriving via cross-tab navigation (initial* filter props), don't restore
  // movies or filters from cache — we need a fresh fetch with the new filter.
  const hasCrossTabFilter = !!(initialGenre || initialDirector || initialActor || initialYear || initialKeyword);

  // Build cross-tab filters once at mount — no effect/navigate race condition.
  const crossTabFilters = useMemo(() => {
    if (!hasCrossTabFilter) return null;
    const f = { ...DEFAULT_FILTERS };
    if (initialGenre) f.genres = [initialGenre];
    if (initialDirector) f.director = initialDirector;
    if (initialActor) f.actor = initialActor;
    if (initialYear) f.year = initialYear.toString();
    if (initialKeyword) {
      f.keyword = initialKeyword;
      f.keywordName = initialKeywordName || null;
    }
    return f;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — only compute on first mount

  const [movies, setMovies] = useState<Movie[]>(hasCrossTabFilter ? [] : (discoverCache?.movies ?? []));
  const [loading, setLoading] = useState(hasCrossTabFilter ? true : !discoverCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(discoverCache?.page ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [genres, setGenres] = useState<
    { id: number; name: string }[]
  >([]);

  // Filter state — restored from cache if available.
  // When arriving via cross-tab navigation, use the pre-built crossTabFilters.
  const [filters, setFilters] = useState(() => {
    if (crossTabFilters) return crossTabFilters;
    if (discoverCache?.filters) return discoverCache.filters;
    // Apply preferred streaming services from localStorage on fresh session
    try {
      const preferred = localStorage.getItem('duoreel-preferred-streaming');
      if (preferred) {
        const services = JSON.parse(preferred) as string[];
        if (Array.isArray(services) && services.length > 0) {
          return { ...DEFAULT_FILTERS, streamingServices: services };
        }
      }
    } catch {}
    return DEFAULT_FILTERS;
  });
  const [sortBy, setSortBy] = useState(discoverCache?.sortBy ?? "popularity");
  const [showWatchedMovies, setShowWatchedMovies] =
    useState(discoverCache?.showWatchedMovies ?? false);
  const [hidePartnerWatched, setHidePartnerWatched] =
    useState(discoverCache?.hidePartnerWatched ?? false);
  const [showFiltersModal, setShowFiltersModal] =
    useState(false);

  // View mode — shared across all tabs via AppLayout
  const viewMode = cardViewModeProp;
  const handleViewMode = setCardViewMode;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchQueryRef = useRef("");
  const searchHasMoreRef = useRef(false);
  const searchLoadingMoreRef = useRef(false);
  const isSearchingRef = useRef(false);
  const searchPageRef = useRef(1);

  // Movie detail modal state — synced with ?movie=id URL param
  const {
    selectedMovie,
    setSelectedMovie,
    modalOpen,
    openMovie,
    closeMovie,
  } = useMovieModal(accessToken);

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [likeLoadingIds, setLikeLoadingIds] = useState<Set<number>>(new Set());
  const [isWatchedLoading, setIsWatchedLoading] = useState(false);

  const { handleWatched, handleUnwatched } = useWatchedActions({
    accessToken,
    closeMovie,
    onWatchedLoading: (loading) => setIsWatchedLoading(loading),
  });

  // IMDb ratings local state (keyed by TMDb ID) — restored from cache if available
  const [imdbRatings, setImdbRatings] = useState<Map<number, string>>(() => {
    const local = readLocalImdbCache();
    if (discoverCache?.imdbRatings && discoverCache.imdbRatings.size > 0) {
      // discoverCache wins for entries it has (more recent), localStorage fills the rest
      return new Map([...local, ...discoverCache.imdbRatings]);
    }
    return local;
  });

  // Keep a ref to movies so the onRatingFetched listener can look up IMDb IDs
  // without needing movies in its dep array (which would cause resubscription
  // mid-fetch and lose rating emissions).
  const moviesRef = useRef<typeof movies>(movies);

  // Keep a ref to imdbRatings so bulkFetchCachedRatings effects can filter
  // already-cached IDs without stale closure issues.
  const imdbRatingsRef = useRef<Map<number, string>>(imdbRatings);

  // ── Sectioned feed state ──
  // activeSectionView: which section is slid into view (null = home)
  const [activeSectionView, setActiveSectionView] = useState<'recs' | 'trending' | 'gems' | null>(null);
  // Section preview movies (4 each, shown on home view)
  const [sectionPreviews, setSectionPreviews] = useState<{
    recs: Movie[];
    trending: Movie[];
    gems: Movie[];
  }>(() => discoverCache?.sectionPreviews ?? { recs: [], trending: [], gems: [] });
  // Section full-view movies (for the slide-in view)
  const [sectionMovies, setSectionMovies] = useState<Movie[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionLoadingMore, setSectionLoadingMore] = useState(false);
  const [sectionPage, setSectionPage] = useState(1);
  const [sectionHasMore, setSectionHasMore] = useState(true);
  const sectionSentinelRef = useRef<HTMLDivElement | null>(null);
  // Seed movie for "Because you saved X" — random from top 10 liked movies
  const [recSeedMovie, setRecSeedMovie] = useState<Movie | null>(() => discoverCache?.recSeedMovie ?? null);
  // Track section preview like loading per movie
  const [sectionLikeLoadingIds, setSectionLikeLoadingIds] = useState<Set<number>>(new Set());
  const [sectionPreviewsLoading, setSectionPreviewsLoading] = useState(
    () => !discoverCache?.sectionPreviews  // skip skeleton if restoring from cache
  );
  // Separate loading state for recs-only refresh (doesn't affect trending/gems)
  const [recsRefreshLoading, setRecsRefreshLoading] = useState(false);

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
    imdbRatingsRef.current = imdbRatings;
  }, [movies, imdbRatings]);

  const baseUrl = API_BASE_URL;

  // Movie details enrichment tracking — delegated to shared hook
  const { enrichedIds, setEnrichedIds, enrichingRef, resetEnrichment } = useEnrichMovies({
    movies,
    setMovies,
    publicAnonKey,
    baseUrl,
    batchSize: 5,
    dep: filters,
    onEnriched: (updatedMovies) => {
      setDiscoverCache(c => c ? { ...c, movies: updatedMovies } : null);
    },
  });

  // Enrich section view movies (genre tags, director, cast, IMDb)
  const { resetEnrichment: resetSectionEnrichment } = useEnrichMovies({
    movies: sectionMovies,
    setMovies: setSectionMovies,
    publicAnonKey,
    baseUrl,
    dep: activeSectionView,
    batchSize: 10,
  });

  // Identity keys — change whenever movie IDs change, not just count.
  // Used as deps for the enrichment useEffect so it re-runs after Refresh.
  const recsKey = useMemo(
    () => sectionPreviews.recs.map((m) => m.id).join(','),
    [sectionPreviews.recs],
  );
  const trendingKey = useMemo(
    () => sectionPreviews.trending.map((m) => m.id).join(','),
    [sectionPreviews.trending],
  );
  const gemsKey = useMemo(
    () => sectionPreviews.gems.map((m) => m.id).join(','),
    [sectionPreviews.gems],
  );

  // Enrich all section preview row cards atomically (single setSectionPreviews write per batch)
  // This avoids a race condition where concurrent writes from three separate useEnrichMovies
  // calls overwrite each other's genre/director/cast results.
  const previewEnrichingRef = useRef<Set<number>>(new Set());

  // Reset enriching ref when recs are replaced (e.g. after Refresh) so new movies get enriched
  useEffect(() => {
    previewEnrichingRef.current = new Set();
  }, [recsKey]);
  useEffect(() => {
    if (!publicAnonKey) return;
    const allPreviews = [
      ...sectionPreviews.recs,
      ...sectionPreviews.trending,
      ...sectionPreviews.gems,
    ];
    if (allPreviews.length === 0) return;

    const toEnrich = allPreviews.filter(
      (m) =>
        (!m.genres || m.genres.length === 0) &&
        !previewEnrichingRef.current.has(m.id)
    );
    if (toEnrich.length === 0) return;

    toEnrich.forEach((m) => previewEnrichingRef.current.add(m.id));

    const enrich = async () => {
      const BATCH = 5;
      for (let i = 0; i < toEnrich.length; i += BATCH) {
        const batch = toEnrich.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(async (movie) => {
            try {
              const res = await fetch(`${baseUrl}/movies/${movie.id}`, {
                headers: { Authorization: `Bearer ${publicAnonKey}` },
              });
              if (!res.ok) return null;
              return { id: movie.id, data: await res.json() };
            } catch {
              return null;
            }
          })
        );

        // Build update map for this batch
        const updates = new Map<number, Partial<Movie>>();
        results.forEach((result) => {
          if (result.status !== 'fulfilled' || !result.value) return;
          const { id, data: d } = result.value;
          const director = d.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
          const actors = d.credits?.cast?.slice(0, 5).map((a: any) => a.name);
          updates.set(id, {
            runtime: d.runtime,
            director,
            actors,
            genres: d.genres,
            external_ids: d.external_ids,
            homepage: d.homepage,
            'watch/providers': d['watch/providers'],
          });
        });

        if (updates.size === 0) continue;

        // Single atomic write — all three slices updated together, no race
        setSectionPreviews((prev) => {
          const applyUpdates = (movies: Movie[]) =>
            movies.map((m) => {
              const u = updates.get(m.id);
              return u ? { ...m, ...u } : m;
            });
          return {
            recs: applyUpdates(prev.recs),
            trending: applyUpdates(prev.trending),
            gems: applyUpdates(prev.gems),
          };
        });

        if (i + BATCH < toEnrich.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recsKey, trendingKey, gemsKey, publicAnonKey]);

  // Restore enrichedIds from cache on mount (only once)
  const restoredEnrichRef = useRef(false);
  useEffect(() => {
    if (!restoredEnrichRef.current && discoverCache?.enrichedIds && discoverCache.enrichedIds.size > 0) {
      setEnrichedIds(discoverCache.enrichedIds);
      enrichingRef.current = new Set(discoverCache.enrichedIds);
      restoredEnrichRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverCache?.enrichedIds]);

  // Skip the initial fetch if we restored from cache. Set to true when cache is
  // present; cleared to false on the first user-triggered filter/sort change.
  // If arriving via cross-tab navigation (initial* filter props set), don't skip
  // the initial fetch — we need fresh results for the new filter, not cached ones.
  const skipNextFetchRef = useRef(!!discoverCache && !initialGenre && !initialDirector && !initialActor && !initialYear && !initialKeyword);

  // Skip the IMDb ratings fetch if we restored ratings from cache. Ratings are
  // already in imdbRatings state — no need to re-fetch from the DB.
  const skipRatingsFetchRef = useRef(!!discoverCache);
  // Prevents re-entrant calls to bulkFetchCachedRatings when enrichedIds.size
  // changes mid-fetch (enrichment fires setEnrichedIds once per batch of 5).
  const fetchingRatingsRef = useRef(false);

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
    partnerWatchedIds,
    partnerName,
  } = useUserInteractions();

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
    if (filters.genres.length > 0) count++;
    if (filters.decade !== "all") count++;
    if (filters.rating !== "all") count++;
    if (filters.year !== "all") count++;
    if (filters.director) count++;
    if (filters.actor) count++;
    if (filters.language) count++;
    if (filters.duration !== "all") count++;
    if (filters.streamingServices.length > 0) count++;
    if (filters.keyword) count++;
    return count;
  }, [filters]);

  // True whenever any filter or search mode is active
  const filtersActive = useMemo(
    () =>
      isSearchMode ||
      !!filters.director ||
      !!filters.actor ||
      !!filters.keyword ||
      filters.genres.length > 0 ||
      filters.streamingServices.length > 0 ||
      (filters.decade !== undefined && filters.decade !== null && filters.decade !== 'all'),
    [isSearchMode, filters.director, filters.actor, filters.keyword, filters.genres, filters.streamingServices, filters.decade],
  );

  // Sections are visible when no filters active; collapsed (but expandable) when filters are active
  const showSections = !filtersActive;

  // sections expanded when no filters, collapsed when any filter is active
  const [sectionsExpandedByUser, setSectionsExpandedByUser] = useState(!filtersActive);

  useEffect(() => {
    setSectionsExpandedByUser(!filtersActive);
  }, [filtersActive]);

  // Final gate: show sections content when no filters OR user explicitly expanded
  const showSectionsContent = showSections || sectionsExpandedByUser;

  // ──────────────── Fetch section previews ────────────────
  // likedMovies is read via a ref so fetchSectionPreviews stays stable
  // and does NOT re-run every time a movie is saved.
  const likedMoviesRef = useRef(likedMovies);
  useEffect(() => { likedMoviesRef.current = likedMovies; }, [likedMovies]);
  // Prevents re-running fetchSectionPreviews on every save action.
  // Set to true after the first successful fetch.
  const sectionFetchedRef = useRef(false);
  const gemsGenreIdRef = useRef<number | null>(null);
  const gemsPageRef = useRef<number>(1);

  const fetchSectionPreviews = useCallback(async () => {
    if (!accessToken) return;
    setSectionPreviewsLoading(true);

    const currentLiked = likedMoviesRef.current;
    const top10 = currentLiked.slice(0, 10);
    const seed = top10.length > 0 ? top10[Math.floor(Math.random() * top10.length)] : null;
    setRecSeedMovie(seed);

    try {
      const [trendingRes, gemsRes, recsRes] = await Promise.all([
        fetch(`${baseUrl}/movies/trending?page=1`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        (() => {
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          const maxReleaseDate = twoYearsAgo.toISOString().split('T')[0];
          const gemsGenreId = getGemsGenreId(likedMoviesRef.current, genres);
          const gemsPage = Math.floor(Math.random() * 5) + 1;
          gemsGenreIdRef.current = gemsGenreId;
          gemsPageRef.current = gemsPage;
          const gemsGenreParam = gemsGenreId ? `&genre=${gemsGenreId}` : '';
          return fetch(`${baseUrl}/movies/discover?sortBy=vote_average.desc&minRating=6&minVoteCount=500&maxVoteCount=5000&maxReleaseDate=${maxReleaseDate}&page=${gemsPage}${gemsGenreParam}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        })(),
        seed
          ? fetch(`${baseUrl}/movies/recommendations/${seed.id}?page=1`, { headers: { Authorization: `Bearer ${accessToken}` } })
          : Promise.resolve(null),
      ]);

      const [trendingData, gemsData, recsData] = await Promise.all([
        trendingRes.json(),
        gemsRes.json(),
        recsRes ? recsRes.json() : { results: [] },
      ]);

      const likedIds = new Set(currentLiked.map((m) => m.id));
      const trendingPreview = (trendingData.results || [])
        .filter((m: Movie) => !notInterestedMovieIds?.has(m.id) && !watchedMovieIds.has(m.id))
        .slice(0, 5);
      const gemsPreview = (gemsData.results || [])
        .filter((m: Movie) => !notInterestedMovieIds?.has(m.id) && !watchedMovieIds.has(m.id))
        .slice(0, 5);
      const recsPreview = (recsData.results || [])
        .filter((m: Movie) => !likedIds.has(m.id) && !notInterestedMovieIds?.has(m.id) && !watchedMovieIds.has(m.id))
        .slice(0, 5);

      setSectionPreviews((prev) => {
        const mergeSlice = (newMovies: Movie[], prevMovies: Movie[]) => {
          const prevById = new Map(prevMovies.map((m) => [m.id, m]));
          return newMovies.map((m) => {
            const existing = prevById.get(m.id);
            return existing && existing.genres && existing.genres.length > 0 ? existing : m;
          });
        };
        return {
          trending: mergeSlice(trendingPreview, prev.trending),
          gems: mergeSlice(gemsPreview, prev.gems),
          recs: mergeSlice(recsPreview, prev.recs),
        };
      });
      setSectionPreviewsLoading(false);
      setDiscoverCache(c => c ? {
        ...c,
        sectionPreviews: { trending: trendingPreview, gems: gemsPreview, recs: recsPreview },
        recSeedMovie: seed,
      } : null);
    } catch (err) {
      console.error('Error fetching section previews:', err);
      setSectionPreviewsLoading(false);
    }
  }, [accessToken, baseUrl, notInterestedMovieIds, watchedMovieIds]);

  // Refresh ONLY the "Because you saved X" recs — does not touch trending or hidden gems
  const refreshRecs = useCallback(async () => {
    if (!accessToken) return;
    const currentLiked = likedMoviesRef.current;
    const top10 = currentLiked.slice(0, 10);
    if (top10.length === 0) return;

    // Pick a different seed from current if possible
    const otherSeeds = top10.filter((m) => m.id !== recSeedMovie?.id);
    const pool = otherSeeds.length > 0 ? otherSeeds : top10;
    const newSeed = pool[Math.floor(Math.random() * pool.length)];
    setRecSeedMovie(newSeed);
    setRecsRefreshLoading(true);

    try {
      const res = await fetch(
        `${baseUrl}/movies/recommendations/${newSeed.id}?page=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = await res.json();
      const currentLikedIds = new Set(likedMoviesRef.current.map((m) => m.id));
      const recsPreview = (data.results || [])
        .filter(
          (m: Movie) =>
            !currentLikedIds.has(m.id) &&
            !notInterestedMovieIds?.has(m.id) &&
            !watchedMovieIds.has(m.id),
        )
        .slice(0, 5);

      setSectionPreviews((prev) => ({ ...prev, recs: recsPreview }));
      setDiscoverCache((c) =>
        c
          ? {
              ...c,
              sectionPreviews: { ...c.sectionPreviews, recs: recsPreview },
              recSeedMovie: newSeed,
            }
          : null,
      );
    } catch (err) {
      console.error('Error refreshing recs:', err);
    } finally {
      setRecsRefreshLoading(false);
    }
  }, [accessToken, baseUrl, recSeedMovie, notInterestedMovieIds, watchedMovieIds]);

  // Fires on mount (for new users: loads trending + gems immediately).
  // sectionFetchedRef prevents re-running on every subsequent save action.
  useEffect(() => {
    if (!accessToken) return;
    if (discoverCache?.sectionPreviews) return; // already restored from cache
    if (sectionFetchedRef.current) return;
    // likedMovies.length guard removed — trending and gems have no dependency on
    // liked movies. fetchSectionPreviews handles seed=null gracefully.
    // contextLoading guard removed — watchedMovieIds/notInterestedMovieIds are already
    // available from the interactions localStorage cache seeded on mount.
    // Worst case: a watched movie briefly shows in a section preview until the
    // full interactions/all fetch completes and updates the sets. Acceptable.
    sectionFetchedRef.current = true;
    fetchSectionPreviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, likedMovies.length]);

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

  // ──────────────── Fetch full section view movies ────────────────
  const fetchSectionMovies = useCallback(async (section: 'recs' | 'trending' | 'gems', pageNum: number, append = false) => {
    if (!accessToken) return;
    if (pageNum === 1) setSectionLoading(true);
    else setSectionLoadingMore(true);

    try {
      let url = '';
      if (section === 'trending') {
        url = `${baseUrl}/movies/trending?page=${pageNum}`;
      } else if (section === 'gems') {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const maxReleaseDate = twoYearsAgo.toISOString().split('T')[0];
        const gemsGenreParam = gemsGenreIdRef.current ? `&genre=${gemsGenreIdRef.current}` : '';
        url = `${baseUrl}/movies/discover?sortBy=vote_average.desc&minRating=6&minVoteCount=500&maxVoteCount=5000&maxReleaseDate=${maxReleaseDate}&page=${pageNum}${gemsGenreParam}`;
      } else if (section === 'recs' && recSeedMovie) {
        url = `${baseUrl}/movies/recommendations/${recSeedMovie.id}?page=${pageNum}`;
      } else {
        setSectionLoading(false);
        return;
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const results: Movie[] = data.results || [];

      if (append) {
        setSectionMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return [...prev, ...results.filter((m) => !existingIds.has(m.id))];
        });
      } else {
        setSectionMovies(results);
      }
      setSectionHasMore(results.length >= 10);
    } catch (err) {
      console.error('Error fetching section movies:', err);
    } finally {
      setSectionLoading(false);
      setSectionLoadingMore(false);
    }
  }, [accessToken, baseUrl, recSeedMovie]);

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

        if (filters.genres.length > 0)
          params.append("genre", filters.genres.join(","));
        if (filters.rating !== "all")
          params.append("minRating", filters.rating);
        if (filters.director)
          params.append("director", filters.director);
        if (filters.actor)
          params.append("actor", filters.actor);
        if (filters.language)
          params.append("language", filters.language);
        if (filters.keyword)
          params.append("keyword", filters.keyword);
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
          // Show all movies in Discover including already-saved ones (green bookmark shown on saved cards).
          // Only exclude movies pending removal (not interested, undo window).
          const newMovies = (data.results as Movie[]).filter(
            (m) => !pendingRemovalsRef.current.has(m.id),
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
                hidePartnerWatched,
                imdbRatings,
                enrichedIds: c?.enrichedIds ?? new Set(),
              }));
              return next;
            });
          } else {
            setMovies(newMovies);
            // Write cache with the fresh list.
            // Clear enrichedIds — preserving old IDs here causes the cache restore
            // on next mount to re-poison enrichingRef with stale IDs, blocking enrichment.
            setDiscoverCache(c => ({
              movies: newMovies,
              page: pageNum,
              filters,
              sortBy,
              showWatchedMovies,
              hidePartnerWatched,
              imdbRatings,
              enrichedIds: new Set(),
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

  // ──────────────── Cross-tab navigation: bust cache ────────────────
  // Filters are already baked into initial state via crossTabFilters (no setFilters needed).
  // Clear discover cache so stale results aren't restored on next visit.
  // We intentionally do NOT call onFiltersApplied() (which navigates with state:null) because
  // the navigation can cause DiscoverPage to re-render with null props, potentially losing state.
  // Leftover route state is harmless — it only affects the first mount via hasCrossTabFilter.
  useEffect(() => {
    if (crossTabFilters) {
      setDiscoverCache(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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
    resetEnrichment();
    // Preserve IMDb ratings for section preview cards — they don't change with filter.
    // Only discard ratings for the main Discover movies.
    setImdbRatings((prev) => {
      const allPreviewIds = new Set([
        ...sectionPreviews.recs.map((m) => m.id),
        ...sectionPreviews.trending.map((m) => m.id),
        ...sectionPreviews.gems.map((m) => m.id),
      ]);
      const preserved = new Map<number, string>();
      prev.forEach((rating, tmdbId) => {
        if (allPreviewIds.has(tmdbId)) preserved.set(tmdbId, rating);
      });
      return preserved;
    });
    // Reset the in-flight guard so the ratings effect isn't skipped if a
    // previous OMDb fetch was still running when the new filter fired.
    fetchingRatingsRef.current = false;
    // Reset the cache-skip flag in case it was never consumed (edge case where
    // the ratings effect hasn't fired yet at the time the user changes filters).
    skipRatingsFetchRef.current = false;
    fetchMovies(1, false);
    // fetchMovies is included so this effect always runs with the freshest
    // callback (no stale likedMovieIds / pendingRemovals closures).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, showWatchedMovies, contextLoading, fetchMovies]);

  // ─────────────── Fetch IMDb ratings ────────────────
  useEffect(() => {
    if (movies.length === 0) return;

    // Seed imdbRatings from localStorage for any movies not already in state.
    // This runs on every effect trigger so it catches ratings for newly loaded movies.
    const localCache = readLocalImdbCache();
    const missingFromState = movies.filter(m => !imdbRatings.has(m.id) && localCache.has(m.id));
    if (missingFromState.length > 0) {
      setImdbRatings(prev => {
        const updated = new Map(prev);
        missingFromState.forEach(m => {
          const rating = localCache.get(m.id);
          if (rating) updated.set(m.id, rating);
        });
        return updated;
      });
    }

    // Skip if we restored ratings from cache — they're already in imdbRatings state.
    if (skipRatingsFetchRef.current) {
      skipRatingsFetchRef.current = false;
      return;
    }

    // Skip if a fetch is already in flight — enrichment fires setEnrichedIds once
    // per batch of 5, which would re-trigger this effect 4 extra times otherwise.
    if (fetchingRatingsRef.current) return;

    const fetchRatings = async () => {
      fetchingRatingsRef.current = true;
      try {
        // Get TMDb IDs for bulk fetch — skip IDs already in state (seeded from localStorage)
        const tmdbIds = movies.map((m) => m.id).filter((id) => !imdbRatingsRef.current.has(id));
        if (tmdbIds.length === 0) {
          fetchingRatingsRef.current = false;
          return;
        }

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
            // Write directly to discoverCache here too — don't rely solely on the
            // [imdbRatings] sync effect, which won't fire if component unmounts mid-fetch.
            setDiscoverCache(c => c ? { ...c, imdbRatings: updated } : null);
            return updated;
          });

          // Write bulk results to localStorage so returning sessions skip this fetch
          writeBulkLocalImdbCache(
            [...cached.entries()]
              .filter(([, v]) => v.rating && v.rating !== 'NOT_FOUND')
              .map(([tmdbId, v]) => ({
                tmdbId,
                rating: v.rating,
                releaseDate: movies.find(m => m.id === tmdbId)?.release_date,
              }))
          );

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
      } catch (error) {
        console.error("Error fetching IMDb ratings:", error);
      } finally {
        fetchingRatingsRef.current = false;
      }
    };

    fetchRatings();
  }, [movies]);

  // Count of enriched preview movies — used as dep to fire IMDb fetch after enrichment completes
  const enrichedPreviewCount = useMemo(() => {
    const allPreviews = [
      ...sectionPreviews.recs,
      ...sectionPreviews.trending,
      ...sectionPreviews.gems,
    ];
    return allPreviews.filter((m) => (m as any).external_ids?.imdb_id).length;
  }, [sectionPreviews]);

  // ─────────────── Fetch IMDb ratings for section movies ────────────────
  useEffect(() => {
    if (sectionMovies.length === 0) return;

    const enrichedWithImdb = sectionMovies.filter(
      (m) => m.external_ids?.imdb_id && !imdbRatingsRef.current.has(m.id),
    );
    if (enrichedWithImdb.length === 0) return;

    const fetchSectionRatings = async () => {
      try {
        const tmdbIds = enrichedWithImdb.map((m) => m.id).filter((id) => !imdbRatingsRef.current.has(id));
        if (tmdbIds.length === 0) return;
        const cached = await bulkFetchCachedRatings(tmdbIds, projectId, publicAnonKey);

        if (cached.size > 0) {
          setImdbRatings((prev) => {
            const updated = new Map(prev);
            cached.forEach((value, tmdbId) => {
              if (value.rating) updated.set(tmdbId, value.rating);
            });
            return updated;
          });
          writeBulkLocalImdbCache(
            [...cached.entries()]
              .filter(([, v]) => v.rating && v.rating !== 'NOT_FOUND')
              .map(([tmdbId, v]) => ({
                tmdbId,
                rating: v.rating,
                releaseDate: enrichedWithImdb.find(m => m.id === tmdbId)?.release_date,
              }))
          );
          setGlobalImdbCache((prev) => {
            const updated = new Map(prev);
            cached.forEach((value, tmdbId) => {
              const imdbId = enrichedWithImdb.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
              if (imdbId && value.rating) updated.set(imdbId, value.rating);
            });
            return updated;
          });
        }

        const moviesWithImdbIds = enrichedWithImdb.filter(
          (m) => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id),
        );
        if (moviesWithImdbIds.length > 0) {
          const visibleIds = new Set(sectionMovies.slice(0, 8).map((m) => m.id));
          fetchMissingRatings(moviesWithImdbIds, visibleIds, projectId, publicAnonKey);
        }
      } catch (error) {
        console.error('Error fetching section IMDb ratings:', error);
      }
    };

    fetchSectionRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionMovies]);

  // ─────────────── Fetch IMDb ratings for section preview row cards ────────────────
  useEffect(() => {
    const allPreviews = [
      ...sectionPreviews.recs,
      ...sectionPreviews.trending,
      ...sectionPreviews.gems,
    ];
    if (allPreviews.length === 0) return;

    const enrichedWithImdb = allPreviews.filter(
      (m) => m.external_ids?.imdb_id && !imdbRatingsRef.current.has(m.id),
    );
    if (enrichedWithImdb.length === 0) return;

    const fetchPreviewRatings = async () => {
      try {
        const tmdbIds = enrichedWithImdb.map((m) => m.id).filter((id) => !imdbRatingsRef.current.has(id));
        if (tmdbIds.length === 0) return;
        const cached = await bulkFetchCachedRatings(tmdbIds, projectId, publicAnonKey);

        if (cached.size > 0) {
          setImdbRatings((prev) => {
            const updated = new Map(prev);
            cached.forEach((value, tmdbId) => {
              if (value.rating) updated.set(tmdbId, value.rating);
            });
            return updated;
          });
          writeBulkLocalImdbCache(
            [...cached.entries()]
              .filter(([, v]) => v.rating && v.rating !== 'NOT_FOUND')
              .map(([tmdbId, v]) => ({
                tmdbId,
                rating: v.rating,
                releaseDate: enrichedWithImdb.find(m => m.id === tmdbId)?.release_date,
              }))
          );
          setGlobalImdbCache((prev) => {
            const updated = new Map(prev);
            cached.forEach((value, tmdbId) => {
              const imdbId = enrichedWithImdb.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
              if (imdbId && value.rating) updated.set(imdbId, value.rating);
            });
            return updated;
          });
        }

        const moviesWithImdbIds = enrichedWithImdb.filter(
          (m) => m.external_ids?.imdb_id && !cached.has(m.id) && !imdbRatings.has(m.id),
        );
        if (moviesWithImdbIds.length > 0) {
          const visibleIds = new Set(allPreviews.slice(0, 12).map((m) => m.id));
          fetchMissingRatings(moviesWithImdbIds, visibleIds, projectId, publicAnonKey);
        }
      } catch (error) {
        console.error('Error fetching preview IMDb ratings:', error);
      }
    };

    fetchPreviewRatings();
    // enrichedPreviewCount as dep ensures this re-runs after enrichment adds external_ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedPreviewCount]);

  // Listen for individual rating updates from background fetch.
  // Uses moviesRef (not movies state) so this effect never re-runs mid-fetch —
  // re-subscribing during fetchMissingRatings would drop emissions in the gap.
  useEffect(() => {
    const unsubscribe = onRatingFetched((tmdbId, rating) => {
      setImdbRatings((prev) => {
        const updated = new Map(prev).set(tmdbId, rating);
        // Write directly to cache — don't rely on sync effect which won't fire post-unmount.
        setDiscoverCache(c => c ? { ...c, imdbRatings: updated } : null);
        return updated;
      });
      // Also write into globalImdbCache so other tabs get the rating immediately
      const imdbId = moviesRef.current.find(m => m.id === tmdbId)?.external_ids?.imdb_id;
      if (imdbId) setGlobalImdbCache((prev) => new Map(prev).set(imdbId, rating));
    });
    return unsubscribe;
  }, []); // Empty deps — subscribe once, use moviesRef for current data

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
    async (query: string, pageNum = 1, append = false) => {
      if (!query.trim()) {
        setIsSearchMode(false);
        searchQueryRef.current = "";
        setPage(1);
        fetchMovies(1, false);
        return;
      }

      if (pageNum === 1) {
        setIsSearching(true);
      } else {
        setSearchLoadingMore(true);
      }
      setIsSearchMode(true);
      searchQueryRef.current = query;

      try {
        const response = await fetch(
          `${baseUrl}/movies/search?q=${encodeURIComponent(query)}&page=${pageNum}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const data = await response.json();

        if (data.results) {
          if (append) {
            setMovies((prev) => {
              const existingIds = new Set(prev.map((m: Movie) => m.id));
              const deduped = (data.results as Movie[]).filter((m: Movie) => !existingIds.has(m.id));
              return [...prev, ...deduped];
            });
          } else {
            setMovies(data.results);
            resetEnrichment();
          }
          setSearchPage(pageNum);
          setSearchTotalResults(data.total_results ?? 0);
          setSearchHasMore(pageNum < (data.total_pages ?? 1));
        }
      } catch (error) {
        console.error("Error searching movies:", error);
        toast.error("Search failed");
      } finally {
        setIsSearching(false);
        setSearchLoadingMore(false);
      }
    },
    [baseUrl, publicAnonKey, fetchMovies],
  );

  const handleSearchRef = useRef(handleSearch);
  useEffect(() => { handleSearchRef.current = handleSearch; }, [handleSearch]);
  useEffect(() => { searchHasMoreRef.current = searchHasMore; }, [searchHasMore]);
  useEffect(() => { searchLoadingMoreRef.current = searchLoadingMore; }, [searchLoadingMore]);
  useEffect(() => { isSearchingRef.current = isSearching; }, [isSearching]);
  useEffect(() => { searchPageRef.current = searchPage; }, [searchPage]);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setIsSearchMode(false);
      searchQueryRef.current = "";
      setSearchPage(1);
      setSearchHasMore(false);
      setSearchTotalResults(0);
      setPage(1);
      fetchMovies(1, false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value, 1, false);
    }, 500);
  };

  // ──────────────── Like / Unlike ────────────────
  const handleLike = async (movie: Movie, skipClose = false) => {
    if (!accessToken) return;

    setIsLikeLoading(true);
    setLikeLoadingIds((prev) => new Set(prev).add(movie.id));

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
      timestamp: Date.now(),
    };

    // Optimistic update — add to Saved immediately so navigating to Saved
    // tab shows the movie without waiting for the server round-trip (QUI-155).
    setLikedMovies((prev) => [...prev, movieData]);
    if (!skipClose) closeMovie();

    try {
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
        if (data.isMatch) {
          toast.success(
            `It's a match! You both like "${movie.title}"`,
            { duration: 5000, icon: "💕" },
          );
        } else {
          toast.success(`Saved "${movie.title}"`);
        }
      } else {
        // Server rejected — revert optimistic update
        setLikedMovies((prev) => prev.filter((m) => m.id !== movie.id));
        toast.error("Failed to save movie");
      }
    } catch (error) {
      // Network error — revert optimistic update
      console.error("Error liking movie:", error);
      setLikedMovies((prev) => prev.filter((m) => m.id !== movie.id));
      toast.error("Failed to save movie");
    } finally {
      setIsLikeLoading(false);
      setLikeLoadingIds((prev) => { const s = new Set(prev); s.delete(movie.id); return s; });
    }
  };

  const handleUnlike = async (movieId: number) => {
    if (!accessToken) return;

    setIsLikeLoading(true);
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
    } finally {
      setIsLikeLoading(false);
    }
  };

  // ──────────────── Not Interested (pending removal + undo toast) ────────────────
  const handleNotInterested = (movieId: number) => {
    const movie =
      movies.find((m) => m.id === movieId) ||
      sectionPreviews.recs.find((m) => m.id === movieId) ||
      sectionPreviews.trending.find((m) => m.id === movieId) ||
      sectionPreviews.gems.find((m) => m.id === movieId) ||
      sectionMovies.find((m) => m.id === movieId);
    if (!movie) return;

    // Immediately hide from feed (optimistic)
    setPendingRemovals((prev) => new Set(prev).add(movieId));

    // Set a timer to actually persist the removal
    const timer = setTimeout(async () => {
      try {
        await toggleNotInterested(movieId, true);
        // Remove movie from list permanently
        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        // Also remove from section previews if present
        setSectionPreviews((prev) => ({
          recs: prev.recs.filter((m) => m.id !== movieId),
          trending: prev.trending.filter((m) => m.id !== movieId),
          gems: prev.gems.filter((m) => m.id !== movieId),
        }));
        // Also remove from section view movies if present
        setSectionMovies((prev) => prev.filter((m) => m.id !== movieId));
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
        if (!entries[0].isIntersecting) return;
        if (isSearchMode ? isSearching : loading) return;

        if (isSearchMode && searchQueryRef.current.trim()) {
          if (searchHasMoreRef.current && !searchLoadingMoreRef.current && !isSearchingRef.current) {
            handleSearchRef.current(searchQueryRef.current, searchPageRef.current + 1, true);
          }
        } else if (
          hasMore &&
          !loadingMore &&
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
    isSearching,
    page,
    fetchMovies,
    pendingRemovals,
  ]);

  // ──────────────── Section view infinite scroll ────────────────
  useEffect(() => {
    const sentinel = sectionSentinelRef.current;
    if (!sentinel || !activeSectionView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && sectionHasMore && !sectionLoadingMore && !sectionLoading) {
          const nextPage = sectionPage + 1;
          setSectionPage(nextPage);
          fetchSectionMovies(activeSectionView, nextPage, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeSectionView, sectionHasMore, sectionLoadingMore, sectionLoading, sectionPage, fetchSectionMovies]);

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

  const enterSection = (section: 'recs' | 'trending' | 'gems') => {
    resetSectionEnrichment(); // clear stale enriched IDs so new section movies enrich immediately
    setActiveSectionView(section);
    setSectionPage(1);
    setSectionMovies([]);
    setSectionHasMore(true);
    fetchSectionMovies(section, 1, false);
  };

  const exitSection = () => {
    setActiveSectionView(null);
    setSectionMovies([]);
    setSectionPage(1);
  };

  const handleSectionLike = async (movie: Movie) => {
    if (!accessToken) return;
    setSectionLikeLoadingIds((prev) => new Set(prev).add(movie.id));
    try {
      const res = await fetch(`${baseUrl}/movies/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ movie }),
      });
      if (res.ok) {
        setLikedMovies((prev) => [...prev, movie]);
      }
    } catch (err) {
      console.error('Error liking from section:', err);
    } finally {
      setSectionLikeLoadingIds((prev) => { const s = new Set(prev); s.delete(movie.id); return s; });
    }
  };

  const handleSectionUnlike = async (movieId: number) => {
    if (!accessToken) return;
    setSectionLikeLoadingIds((prev) => new Set(prev).add(movieId));
    try {
      const res = await fetch(`${baseUrl}/movies/like/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setLikedMovies((prev) => prev.filter((m) => m.id !== movieId));
      }
    } catch (err) {
      console.error('Error unliking from section:', err);
    } finally {
      setSectionLikeLoadingIds((prev) => { const s = new Set(prev); s.delete(movieId); return s; });
    }
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
        if (hidePartnerWatched && partnerWatchedIds?.has(m.id))
          return false;
        return true;
      }),
    [
      movies,
      pendingRemovals,
      showWatchedMovies,
      watchedMovieIds,
      hidePartnerWatched,
      partnerWatchedIds,
    ],
  );

  // ─────────────── Genre name helper ────────────────
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
                value=""
                onValueChange={(value) => {
                  if (value && !filters.genres.includes(value)) {
                    updateFilter("genres", [...filters.genres, value]);
                  }
                }}
              >
                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white h-11 w-[150px]">
                  <span className="text-white">
                    {filters.genres.length > 0 ? `${filters.genres.length} genre${filters.genres.length > 1 ? 's' : ''}` : "All Genres"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {genres
                    .filter((g) => !filters.genres.includes(g.id.toString()))
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
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

            {/* View mode toggle — Large (default) vs Compact grid */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-md p-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    aria-label="Large card view"
                  >
                    <LayoutList className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Large cards</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleViewMode('compact')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    aria-label="Compact grid view"
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700"><p>Compact grid</p></TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Row 2: Sort + remaining active filter badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white w-fit min-w-[160px] h-9">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-slate-400 flex-shrink-0" />
                  <SelectValue />
                </div>
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

            {/* Genre chips — multi-select active genres */}
            {filters.genres.map((gId) => (
              <Badge
                key={gId}
                variant="secondary"
                className="bg-purple-600/80 text-white border-purple-400 cursor-pointer hover:bg-purple-700"
                onClick={() => updateFilter("genres", filters.genres.filter((id) => id !== gId))}
              >
                {getGenreName(gId)}
                <X className="size-3 ml-1" />
              </Badge>
            ))}

            {/* Active filter badges — Director/Actor/Year/etc */}
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
            {filters.keyword && (
              <Badge
                variant="secondary"
                className="bg-slate-600/70 text-white border-slate-500 cursor-pointer hover:bg-slate-700"
                onClick={() =>
                  setFilters({ ...filters, keyword: null, keywordName: null })
                }
              >
                Keyword: {filters.keywordName || filters.keyword}{" "}
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
                {searchTotalResults > 0
                  ? `${searchTotalResults} movie${searchTotalResults !== 1 ? "s" : ""} found`
                  : `${visibleMovies.length} movie${visibleMovies.length !== 1 ? "s" : ""} found`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 h-6"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchMode(false);
                  searchQueryRef.current = "";
                  setSearchPage(1);
                  setSearchHasMore(false);
                  setSearchTotalResults(0);
                  fetchMovies(1, false);
                }}
              >
                Back to discover
              </Button>
            </div>
          )}
        </div>

        {/* ── Section slide container ── */}
        <div className="relative overflow-hidden">
          {/* Section view (slides in from right) */}
          <div
            className="transition-transform duration-300 ease-in-out"
            style={{ transform: activeSectionView ? 'translateX(0)' : 'translateX(100%)', position: activeSectionView ? 'relative' : 'absolute', top: 0, left: 0, right: 0, display: activeSectionView ? 'block' : 'none' }}
          >
            {activeSectionView && (
              <>
                {/* Section header with back arrow */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={exitSection}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    <ChevronLeft className="size-4" />
                    Discover
                  </button>
                  <div className="w-px h-4 bg-slate-700" />
                  <span className="text-white font-medium text-sm">
                    {activeSectionView === 'recs' && recSeedMovie && `Because you saved ${recSeedMovie.title}`}
                    {activeSectionView === 'trending' && '🔥 Trending this week'}
                    {activeSectionView === 'gems' && '💎 Hidden gems'}
                  </span>
                </div>

                {/* Section movie grid — exact same as main Discover */}
                {sectionLoading ? (
                  <MovieCardSkeletonGrid count={8} viewMode={viewMode === 'compact' ? 'compact' : 'grid'} />
                ) : sectionMovies.length === 0 ? (
                  <div className="text-center py-20">
                    <Film className="size-20 mx-auto mb-6 text-slate-700" />
                    <p className="text-slate-400 text-lg">No movies found</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sectionMovies.filter((m) => !pendingRemovals.has(m.id)).map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie}
                            isLiked={likedMovieIds.has(movie.id)}
                            isWatched={isWatched(movie.id)}
                            onLike={() => handleLike(movie)}
                            onUnlike={() => handleUnlike(movie.id)}
                            onNotInterested={() => handleNotInterested(movie.id)}
                            isNotInterestedLoading={notInterestedLoadingIds.has(movie.id)}
                            onClick={() => openMovie(movie)}
                            onDirectorClick={(director) => { exitSection(); updateFilter('director', director); }}
                            onGenreClick={(genreId) => { exitSection(); updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()]); }}
                            onYearClick={(year) => { exitSection(); updateFilter('year', year.toString()); }}
                            onActorClick={(actor) => { exitSection(); updateFilter('actor', actor); }}
                            imdbRating={imdbRatings.get(movie.id)}
                            projectId={projectId}
                            publicAnonKey={publicAnonKey}
                            globalImdbCache={globalImdbCache}
                            partnerWatchedIds={partnerWatchedIds}
                            partnerName={partnerName}
                          />
                        ))}
                      </div>
                    )}
                    {viewMode === 'compact' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sectionMovies.filter((m) => !pendingRemovals.has(m.id)).map((movie) => {
                          const isLiked = likedMovieIds.has(movie.id);
                          const isLikeLoading = sectionLikeLoadingIds.has(movie.id);
                          return (
                            <CompactMovieCard
                              key={movie.id}
                              movie={movie}
                              onClick={() => openMovie(movie)}
                              isWatched={isWatched(movie.id)}
                              activeGenreIds={filters.genres.length > 0 ? filters.genres.map(Number) : null}
                              imdbRating={imdbRatings.get(movie.id)}
                              globalImdbCache={globalImdbCache}
                              partnerWatchedIds={partnerWatchedIds}
                              partnerName={partnerName}
                              onGenreClick={(genreId) => { exitSection(); updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()]); }}
                              onDirectorClick={(director) => { exitSection(); updateFilter('director', director); }}
                              topLeftOverlay={
                                <button
                                  className={`size-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'} ${isLikeLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); if (!isLikeLoading) { isLiked ? handleSectionUnlike(movie.id) : handleSectionLike(movie); } }}
                                  disabled={isLikeLoading}
                                  aria-label={isLiked ? 'Remove from watchlist' : 'Save to watchlist'}
                                >
                                  {isLikeLoading
                                    ? <Loader2 className={`size-3.5 animate-spin ${isLiked ? 'text-white' : 'text-slate-900'}`} />
                                    : <Bookmark className={`size-3.5 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} />
                                  }
                                </button>
                              }
                              topRightOverlay={
                                <button
                                  className="size-7 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}
                                  disabled={notInterestedLoadingIds.has(movie.id)}
                                  aria-label="Not interested"
                                >
                                  {notInterestedLoadingIds.has(movie.id)
                                    ? <Loader2 className="size-3.5 animate-spin text-white" />
                                    : <Ban className="size-3.5 text-white" />
                                  }
                                </button>
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                    <div ref={sectionSentinelRef} className="flex justify-center mt-8 h-12 items-center">
                      {sectionLoadingMore && <Film className="size-8 animate-spin text-slate-400" />}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Home view (sections + flat scroll) */}
          <div style={{ display: activeSectionView ? 'none' : 'block' }}>

            {/* ── Curated sections (collapsed when filters active) ── */}
            {(showSections || filtersActive) && !contextLoading && (
              <div className="mb-8 space-y-7">

                {/* Collapsed header — shown only when filters are active */}
                {filtersActive && (
                  <button
                    onClick={() => setSectionsExpandedByUser(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    <span className="text-xs text-slate-400 font-medium">Curated sections</span>
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <span>{sectionsExpandedByUser ? 'Hide' : 'Show'}</span>
                      <ChevronDown className={`size-3.5 transition-transform duration-200 ${sectionsExpandedByUser ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                )}

                {showSectionsContent && (
                  <>
                {/* Because you saved X — only rendered when user has liked movies */}
                {likedMovies.length > 0 && <div className="animate-fade-in-up" style={{ animationDelay: '0s' }}>
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-4 pb-5">
                  <div className="mb-7">
                    {/* Row 1: label + shuffle + see all — all on one responsive line */}
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-indigo-300 flex items-center gap-2.5 min-w-0 flex-1">
                        {(sectionPreviewsLoading || recsRefreshLoading) || !recSeedMovie ? (
                          <span className="flex items-center gap-1.5"><span className="hidden md:inline">Because you saved</span><span className="md:hidden">Your pick:</span> <span className="inline-block h-3 w-24 rounded bg-slate-700/60 animate-pulse align-middle" /></span>
                        ) : (
                          <>
                            <span className="shrink-0 hidden md:inline">Because you saved</span>
                            <span className="shrink-0 md:hidden">Your pick:</span>
                            <span
                              className="text-white cursor-pointer hover:text-slate-300 transition-colors truncate"
                              onClick={(e) => { e.stopPropagation(); openMovie(recSeedMovie); }}
                            >
                              {recSeedMovie.title}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => refreshRecs()}
                                  disabled={recsRefreshLoading}
                                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0"
                                  aria-label="Pick a different movie"
                                >
                                  <Shuffle className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-slate-800 text-white border-slate-700 text-xs">
                                Pick a different movie
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </p>
                      <button
                        onClick={() => !(sectionPreviewsLoading || recsRefreshLoading) && enterSection('recs')}
                        className={`text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 shrink-0 ml-8 ${(sectionPreviewsLoading || recsRefreshLoading) ? 'opacity-0 pointer-events-none' : 'cursor-pointer'}`}
                      >
                        See all <ChevronRight className="size-3" />
                      </button>
                    </div>
                  </div>
                  {(sectionPreviewsLoading || recsRefreshLoading) || sectionPreviews.recs.length === 0
                    ? <MovieCardSkeletonGrid count={5} viewMode="compact" />
                    : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                        {[...(recSeedMovie ? [recSeedMovie] : []), ...sectionPreviews.recs.filter((m) => m.id !== recSeedMovie?.id)].filter((m) => !pendingRemovals.has(m.id)).slice(0, 5).map((movie, idx) => {
                          const isLiked = likedMovieIds.has(movie.id);
                          const isLikeLoading = sectionLikeLoadingIds.has(movie.id);
                          const isSeed = movie.id === recSeedMovie?.id;
                          return (
                            <div key={movie.id} className={`h-full flex flex-col ${isSeed ? 'relative rounded-2xl border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : ''}${idx >= 4 ? ' hidden md:block' : ''}`}>
                              {isSeed && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded whitespace-nowrap">
                                  Your pick
                                </span>
                              )}
                              <CompactMovieCard
                                className="h-full"
                                movie={movie}
                                onClick={() => openMovie(movie)}
                                isWatched={watchedMovieIds.has(movie.id)}
                                imdbRating={imdbRatings.get(movie.id)}
                                onGenreClick={(genreId) => updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()])}
                                onDirectorClick={(director) => updateFilter('director', director)}
                                partnerWatchedIds={partnerWatchedIds}
                                topLeftOverlay={
                                  <button
                                    className={`size-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'} ${isLikeLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={(e) => { e.stopPropagation(); if (!isLikeLoading) { isLiked ? handleSectionUnlike(movie.id) : handleSectionLike(movie); } }}
                                    disabled={isLikeLoading}
                                  >
                                    {isLikeLoading ? <Loader2 className={`size-4 animate-spin ${isLiked ? 'text-white' : 'text-slate-900'}`} /> : <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
                                  </button>
                                }
                                topRightOverlay={
                                  !notInterestedMovieIds?.has(movie.id) ? (
                                    <button className="size-8 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}>
                                      <Ban className="size-4 text-slate-300" />
                                    </button>
                                  ) : undefined
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                  </div>
                </div>}

                {/* Trending this week — always rendered in position */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-4 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-amber-300">🔥 Trending this week</p>
                    <button
                      onClick={() => !sectionPreviewsLoading && enterSection('trending')}
                      className={`text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 ${sectionPreviewsLoading ? 'opacity-0 pointer-events-none' : 'cursor-pointer'}`}
                    >
                      See all <ChevronRight className="size-3" />
                    </button>
                  </div>
                  {sectionPreviewsLoading || sectionPreviews.trending.length === 0
                    ? <MovieCardSkeletonGrid count={5} viewMode="compact" />
                    : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                        {sectionPreviews.trending.filter((m) => !pendingRemovals.has(m.id)).map((movie, idx) => {
                          const isLiked = likedMovieIds.has(movie.id);
                          const isLikeLoading = sectionLikeLoadingIds.has(movie.id);
                          return (
                            <div key={movie.id} className={`h-full flex flex-col ${idx >= 4 ? 'hidden md:block' : ''}`}>
                              <CompactMovieCard
                                className="h-full"
                                movie={movie}
                                onClick={() => openMovie(movie)}
                                isWatched={watchedMovieIds.has(movie.id)}
                                imdbRating={imdbRatings.get(movie.id)}
                                onGenreClick={(genreId) => updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()])}
                                onDirectorClick={(director) => updateFilter('director', director)}
                                partnerWatchedIds={partnerWatchedIds}
                                topLeftOverlay={
                                  <button
                                    className={`size-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'} ${isLikeLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={(e) => { e.stopPropagation(); if (!isLikeLoading) { isLiked ? handleSectionUnlike(movie.id) : handleSectionLike(movie); } }}
                                    disabled={isLikeLoading}
                                  >
                                    {isLikeLoading ? <Loader2 className={`size-4 animate-spin ${isLiked ? 'text-white' : 'text-slate-900'}`} /> : <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
                                  </button>
                                }
                                topRightOverlay={
                                  !notInterestedMovieIds?.has(movie.id) ? (
                                    <button className="size-8 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}>
                                      <Ban className="size-4 text-slate-300" />
                                    </button>
                                  ) : undefined
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                  </div>
                </div>

                {/* Hidden gems — always rendered in position */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-4 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-emerald-300">💎 Hidden gems</p>
                      {(() => {
                        if (!gemsGenreIdRef.current) return null;
                        const genre = genres.find(g => g.id === gemsGenreIdRef.current);
                        if (!genre) return null;
                        return (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            {genre.name}
                          </span>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => !sectionPreviewsLoading && enterSection('gems')}
                      className={`text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 ${sectionPreviewsLoading ? 'opacity-0 pointer-events-none' : 'cursor-pointer'}`}
                    >
                      See all <ChevronRight className="size-3" />
                    </button>
                  </div>
                  {sectionPreviewsLoading || sectionPreviews.gems.length === 0
                    ? <MovieCardSkeletonGrid count={5} viewMode="compact" />
                    : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                        {sectionPreviews.gems.filter((m) => !pendingRemovals.has(m.id)).map((movie, idx) => {
                          const isLiked = likedMovieIds.has(movie.id);
                          const isLikeLoading = sectionLikeLoadingIds.has(movie.id);
                          return (
                            <div key={movie.id} className={`h-full flex flex-col ${idx >= 4 ? 'hidden md:block' : ''}`}>
                              <CompactMovieCard
                                className="h-full"
                                movie={movie}
                                onClick={() => openMovie(movie)}
                                isWatched={watchedMovieIds.has(movie.id)}
                                imdbRating={imdbRatings.get(movie.id)}
                                onGenreClick={(genreId) => updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()])}
                                onDirectorClick={(director) => updateFilter('director', director)}
                                partnerWatchedIds={partnerWatchedIds}
                                topLeftOverlay={
                                  <button
                                    className={`size-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'} ${isLikeLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={(e) => { e.stopPropagation(); if (!isLikeLoading) { isLiked ? handleSectionUnlike(movie.id) : handleSectionLike(movie); } }}
                                    disabled={isLikeLoading}
                                  >
                                    {isLikeLoading ? <Loader2 className={`size-4 animate-spin ${isLiked ? 'text-white' : 'text-slate-900'}`} /> : <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
                                  </button>
                                }
                                topRightOverlay={
                                  !notInterestedMovieIds?.has(movie.id) ? (
                                    <button className="size-8 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}>
                                      <Ban className="size-4 text-slate-300" />
                                    </button>
                                  ) : undefined
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                  </div>
                </div>

                {/* Browse all divider */}
                <div className="relative flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-xs text-slate-600 font-medium">Browse all</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                  </>
                )}
              </div>
            )}

            {/* Movie Grid */}
            {(isSearchMode ? isSearching : (loading || contextLoading)) ? (
          <MovieCardSkeletonGrid count={8} viewMode={viewMode === 'compact' ? 'compact' : 'grid'} />
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
            {/* ── Full grid (default) ── */}
            {viewMode === 'grid' && (
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
                    onGenreClick={(genreId) => updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()])}
                    onKeywordClick={(keywordId, keywordName) => {
                      setFilters(prev => ({ ...prev, keyword: keywordId.toString(), keywordName }));
                      setPage(1);
                      setIsSearchMode(false);
                      setSearchQuery("");
                    }}
                    onYearClick={(year) => updateFilter("year", year.toString())}
                    onActorClick={(actor) => updateFilter("actor", actor)}
                    imdbRating={imdbRatings.get(movie.id)}
                    projectId={projectId}
                    publicAnonKey={publicAnonKey}
                    globalImdbCache={globalImdbCache}
                    partnerWatchedIds={partnerWatchedIds}
                    partnerName={partnerName}
                  />
                ))}
              </div>
            )}

            {/* ── Compact grid ── */}
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleMovies.map((movie) => {
                  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
                  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                  const imdbRating = imdbRatings.get(movie.id);
                  const hasImdbId = (movie as any).external_ids?.imdb_id;
                  const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
                  const displayImdbRating = imdbRatings.get(movie.id) || (movie as any).imdbRating || (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);
                  const isLiked = likedMovieIds.has(movie.id);
                  const isWatchedMovie = isWatched(movie.id);
                  return (
                    <div
                      key={movie.id}
                      data-movie-id={movie.id}
                      className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                      onClick={() => openMovie(movie)}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        {posterUrl
                          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-10 text-slate-600" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                        <div className="absolute top-2 left-2">
                          <button
                            className={`size-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-white/90 hover:bg-white'} ${likeLoadingIds.has(movie.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={(e) => { e.stopPropagation(); if (!likeLoadingIds.has(movie.id)) { isLiked ? handleUnlike(movie.id) : handleLike(movie); } }}
                            disabled={likeLoadingIds.has(movie.id)}
                            aria-label={isLiked ? 'Remove from watchlist' : 'Save to watchlist'}
                          >
                            {likeLoadingIds.has(movie.id)
                              ? <Loader2 className={`size-4 animate-spin ${isLiked ? 'text-white' : 'text-slate-900'}`} />
                              : <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-slate-900'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            }
                          </button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <button
                            className="size-8 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleNotInterested(movie.id); }}
                            aria-label="Not interested"
                          >
                            <Ban className="size-4 text-white" />
                          </button>
                        </div>
                        {movie.vote_average > 0 && (
                          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                            {/* TMDB badge */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                  <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                                  <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                <p>TMDB community rating</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* IMDb badge — mirrors MovieCard.tsx logic exactly */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {hasImdbId ? (
                                  <a
                                    href={`https://www.imdb.com/title/${hasImdbId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors ${
                                      displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                                        ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                                        : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                                    }`}
                                  >
                                    <span className={`text-[7px] font-bold uppercase tracking-wide ${
                                      displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
                                    }`}>IMDb</span>
                                    {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
                                      <span className="text-[10px] font-bold text-black leading-3.5">{displayImdbRating}</span>
                                    ) : displayImdbRating === 'NOT_FOUND' ? (
                                      <span className="text-[10px] font-bold text-black/40 leading-3.5">—</span>
                                    ) : (
                                      <span className="inline-flex items-center h-3.5"><Loader2 className="size-2.5 text-black/50 animate-spin" /></span>
                                    )}
                                  </a>
                                ) : (
                                  <div className="bg-[#F5C518]/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                    <span className="text-[7px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                                    <span className="text-[10px] font-bold text-black/40">—</span>
                                  </div>
                                )}
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                <p>{hasImdbId
                                  ? (displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                                    ? 'View on IMDb'
                                    : displayImdbRating === 'NOT_FOUND'
                                    ? 'Rating unavailable — click to view on IMDb'
                                    : 'Rating loading — click to view on IMDb')
                                  : 'No IMDb data available'
                                }</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1.5">
                        {/* Partner watched eyebrow — above title, matching large card layout */}
                        {partnerWatchedIds?.has(movie.id) && partnerName && (
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="size-2.5 text-pink-500 shrink-0" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-pink-500">
                              {partnerName} seen
                            </span>
                          </div>
                        )}
                        <h3 className="text-xs font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-slate-300">
                          {year && <span>{year}</span>}
                          {year && runtime && <span className="text-slate-500">·</span>}
                          {runtime && <span>{runtime}</span>}
                        </div>
                        {movie.genres && movie.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(filters.genres.length > 0
                              ? [
                                  ...movie.genres.filter(g => filters.genres.includes(g.id.toString())),
                                  ...movie.genres.filter(g => !filters.genres.includes(g.id.toString())),
                                ]
                              : movie.genres
                            ).slice(0, 2).map((genre) => (
                              <span key={genre.id} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-purple-500/30" onClick={(e) => { e.stopPropagation(); updateFilter("genres", filters.genres.includes(genre.id.toString()) ? filters.genres.filter(id => id !== genre.id.toString()) : [...filters.genres, genre.id.toString()]); }}>{genre.name}</span>
                            ))}
                          </div>
                        )}
                        {movie.overview && <p className="text-slate-300 text-[10px] leading-relaxed line-clamp-2">{movie.overview}</p>}
                        {movie.director && <div className="text-[10px] text-slate-400">Dir: <span className="text-sky-300/80 cursor-pointer hover:text-sky-300 hover:underline" onClick={(e) => { e.stopPropagation(); updateFilter('director', movie.director!); }}>{movie.director}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── List view ── KEPT AS DEAD CODE: list layout is implemented and working
                but currently not exposed in the UI toggle. Remove the comment wrapper here
                and add a third button to the toggle (using the List icon from lucide-react)
                if you want to re-enable it. ──
            {viewMode === 'list' && (
              <div className="space-y-2">
                {visibleMovies.map((movie) => {
                  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '';
                  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
                  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
                  const imdbRating = imdbRatings.get(movie.id);
                  const isLiked = likedMovieIds.has(movie.id);
                  const isWatchedMovie = isWatched(movie.id);
                  return (
                    <div
                      key={movie.id}
                      data-movie-id={movie.id}
                      className={`group flex gap-3 bg-gradient-to-r from-slate-800/50 to-slate-900/80 border border-slate-700/50 hover:border-slate-600 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isWatchedMovie ? 'opacity-60 grayscale-[30%]' : ''}`}
                      onClick={() => openMovie(movie)}
                    >
                      <div className="relative w-14 flex-shrink-0">
                        {posterUrl
                          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-6 text-slate-600" /></div>
                        }
                      </div>
                      <div className="flex-1 py-2.5 min-w-0">
                        <p className="font-semibold text-white text-sm leading-tight truncate">{movie.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {[year, runtime, movie.genres?.[0]?.name].filter(Boolean).join(' · ')}
                        </p>
                        {movie.director && <p className="text-slate-500 text-xs mt-0.5">Dir: {movie.director}</p>}
                      </div>
                      <div className="flex items-center gap-2 pr-3 flex-shrink-0">
                        {movie.vote_average > 0 && (
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="bg-blue-600/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
                              <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                            </div>
                            {imdbRating && imdbRating !== 'N/A' && (
                              <div className="bg-[#F5C518] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="text-[9px] font-bold text-black/70 uppercase tracking-wide">IMDb</span>
                                <span className="text-xs font-bold text-black">{imdbRating}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          className={`size-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isLiked ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'}`}
                          onClick={(e) => { e.stopPropagation(); isLiked ? handleUnlike(movie.id) : handleLike(movie); }}
                          aria-label={isLiked ? 'Remove from watchlist' : 'Save to watchlist'}
                        >
                          <svg className={`size-4 ${isLiked ? 'fill-white text-white' : 'text-white'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            ── end of list view dead code ── */}

            {/* Infinite scroll sentinel + loading indicator */}
            <div
              ref={sentinelRef}
              className="flex justify-center mt-8 h-12 items-center"
            >
              {(loadingMore || searchLoadingMore) && (
                <Film className="size-8 animate-spin text-slate-400" />
              )}
            </div>
          </>
        )}
          </div>{/* end home view */}
        </div>{/* end section slide container */}
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
        hidePartnerWatched={hidePartnerWatched}
        onHidePartnerWatchedChange={setHidePartnerWatched}
        partnerWatchedCount={partnerWatchedIds?.size ?? 0}
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
          selectedMovie && handleLike(selectedMovie, true)
        }
        onUnlike={() =>
          selectedMovie && handleUnlike(selectedMovie.id)
        }
        onDislike={() => {}}
        onNotInterested={() => {
          if (selectedMovie) {
            handleNotInterested(selectedMovie.id);
            closeMovie();
          }
        }}
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
        isDislikeLoading={selectedMovie ? pendingRemovals.has(selectedMovie.id) : false}
        showNotInterested={true}
        isWatchedLoading={
          isWatchedLoading ||
          (selectedMovie
            ? watchedLoadingIds.has(selectedMovie.id)
            : false)
        }
        onGenreClick={(genreId) => {
          exitSection();
          updateFilter("genres", filters.genres.includes(genreId.toString()) ? filters.genres.filter(id => id !== genreId.toString()) : [...filters.genres, genreId.toString()]);
          closeMovie();
        }}
        onKeywordClick={(keywordId, keywordName) => {
          exitSection();
          setFilters(prev => ({ ...prev, keyword: keywordId.toString(), keywordName }));
          setPage(1);
          setIsSearchMode(false);
          setSearchQuery("");
          closeMovie();
        }}
        onDirectorClick={(director) => {
          exitSection();
          updateFilter("director", director);
          closeMovie();
        }}
        onActorClick={(actor) => {
          exitSection();
          updateFilter("actor", actor);
          closeMovie();
        }}
        onLanguageClick={() => {}}
        onFindSimilar={() => {
          if (selectedMovie) {
            setRecSeedMovie(selectedMovie);
            closeMovie();
            enterSection('recs');
          }
        }}
        projectId={projectId}
        publicAnonKey={publicAnonKey}
        globalImdbCache={globalImdbCache}
        setGlobalImdbCache={setGlobalImdbCache}
        imdbRatingFromCard={selectedMovie ? (
          imdbRatings.get(selectedMovie.id) ||
          globalImdbCache?.get((selectedMovie as any).external_ids?.imdb_id) ||
          null
        ) : null}
        partnerWatchedIds={partnerWatchedIds}
        partnerName={partnerName}
      />
    </div>
  );
}