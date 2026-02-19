// IMDb Rating Fetching Utilities with Smart Caching

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
      `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1/imdb-ratings/bulk?tmdbIds=${tmdbIds.join(',')}`,
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
      `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1/imdb-ratings/fetch-and-store`,
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
        console.log(`Rate limited or retry later for movie ${movie.id}`);
      }
      return null;
    }

    const data: ImdbRatingCache = await response.json();
    
    // Emit update event
    if (data.rating) {
      emitRatingUpdate(movie.id, data.rating);
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
  
  // Filter movies that need ratings
  const moviesNeedingRatings = movies.filter(m => m.external_ids?.imdb_id);
  
  // Prioritize
  const prioritized = prioritizeMovies(moviesNeedingRatings, visibleMovieIds);
  
  console.log(`Starting background fetch for ${prioritized.length} movies`);
  
  for (let i = 0; i < prioritized.length; i += BATCH_SIZE) {
    const batch = prioritized.slice(i, i + BATCH_SIZE);
    
    // Fetch batch in parallel
    await Promise.all(
      batch.map(movie => fetchAndStoreRating(movie, projectId, publicAnonKey))
    );
    
    console.log(`Fetched batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(prioritized.length / BATCH_SIZE)}`);
    
    // Wait before next batch (unless it's the last batch)
    if (i + BATCH_SIZE < prioritized.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }
  
  console.log('Background IMDb rating fetch complete');
}
