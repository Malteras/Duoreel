// IMDb Rating Fetching Utilities with Smart Caching
import { API_BASE_URL } from './api';

interface ImdbRatingCache {
  imdbId: string;
  tmdbId: number;
  rating: string;
  votes: string;
  fetchedAt: string;
}

interface Movie {
  id: number;
  external_ids?: {
    imdb_id?: string;
  };
  release_date?: string;
  popularity?: number;
}

// Event emitter for rating updates
type RatingUpdateListener = (tmdbId: number, rating: string) => void;
const ratingUpdateListeners = new Set<RatingUpdateListener>();

export function onRatingFetched(callback: RatingUpdateListener) {
  ratingUpdateListeners.add(callback);
  return () => ratingUpdateListeners.delete(callback);
}

function emitRatingUpdate(tmdbId: number, rating: string) {
  ratingUpdateListeners.forEach(listener => listener(tmdbId, rating));
}

// Bulk fetch cached IMDb ratings
export async function bulkFetchCachedRatings(
  tmdbIds: number[],
  projectId: string,
  publicAnonKey: string
): Promise<Map<number, ImdbRatingCache>> {
  if (tmdbIds.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/imdb-ratings/bulk?tmdbIds=${tmdbIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      }
    );

    if (!response.ok) {
      console.error('Bulk fetch failed:', response.status);
      return new Map();
    }

    const ratings: ImdbRatingCache[] = await response.json();
    return new Map(ratings.map(r => [r.tmdbId, r]));
  } catch (error) {
    console.error('Error bulk fetching IMDb ratings:', error);
    return new Map();
  }
}

// Fetch and store a single IMDb rating
export async function fetchAndStoreRating(
  movie: Movie,
  projectId: string,
  publicAnonKey: string
): Promise<ImdbRatingCache | null> {
  const imdbId = movie.external_ids?.imdb_id;
  
  if (!imdbId) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/imdb-ratings/fetch-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          tmdbId: movie.id,
          imdbId,
          releaseDate: movie.release_date
        })
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.error(`Rate limited or retry later for movie ${movie.id}`);
      }
      return null;
    }

    const data: ImdbRatingCache = await response.json();
    
    // Emit update event — includes NOT_FOUND so spinner resolves to dash
    if (data.rating) {
      emitRatingUpdate(movie.id, data.rating);
    }
    
    // If server returned NOT_FOUND, treat as null so callers know to show dash
    if (data.rating === 'NOT_FOUND') {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch IMDb rating for movie ${movie.id}:`, error);
    return null;
  }
}

// Prioritize movies for fetching
export function prioritizeMovies(
  movies: Movie[],
  visibleMovieIds: Set<number>
): Movie[] {
  return movies.sort((a, b) => {
    // 1. Visible movies first
    const aVisible = visibleMovieIds.has(a.id);
    const bVisible = visibleMovieIds.has(b.id);
    if (aVisible !== bVisible) return bVisible ? 1 : -1;
    
    // 2. Popular movies first
    const aPop = a.popularity || 0;
    const bPop = b.popularity || 0;
    if (aPop !== bPop) return bPop - aPop;
    
    // 3. Newer movies first
    const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
    const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
    return bDate - aDate;
  });
}

// Background fetch missing ratings with throttling
export async function fetchMissingRatings(
  movies: Movie[],
  visibleMovieIds: Set<number>,
  projectId: string,
  publicAnonKey: string
) {
  const BATCH_SIZE = 5; // 5 concurrent requests
  const DELAY = 1200; // 1.2s between batches (safe for 100/min limit)
  
  // Emit NOT_FOUND immediately for movies with no imdb_id — stops their spinner
  movies.forEach(m => {
    if (!m.external_ids?.imdb_id) {
      emitRatingUpdate(m.id, 'NOT_FOUND');
    }
  });

  // Only fetch ratings for movies that actually have an IMDb ID
  const moviesNeedingRatings = movies.filter(m => m.external_ids?.imdb_id);
  
  // Prioritize
  const prioritized = prioritizeMovies(moviesNeedingRatings, visibleMovieIds);
  
  for (let i = 0; i < prioritized.length; i += BATCH_SIZE) {
    const batch = prioritized.slice(i, i + BATCH_SIZE);
    
    // Fetch batch in parallel — emit sentinel for failures so MovieCard stops spinning
    await Promise.all(
      batch.map(async movie => {
        const result = await fetchAndStoreRating(movie, projectId, publicAnonKey);
        if (!result || !result.rating) {
          // 404, not in OMDb, or rate limited — emit sentinel so the card shows a
          // static dash instead of spinning forever. Also prevents retry on next fetch.
          emitRatingUpdate(movie.id, 'NOT_FOUND');
        }
      })
    );
    
    // Wait before next batch (unless it's the last batch)
    if (i + BATCH_SIZE < prioritized.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }
}