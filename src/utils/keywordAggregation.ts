import type { Movie } from '../types/movie';

export interface AggregatedKeyword {
  id: number;
  name: string;
  count: number;
}

/**
 * Aggregates TMDB keywords across an array of movies.
 * Returns keywords appearing on 2+ movies, sorted by frequency (desc), capped at `maxKeywords`.
 */
export function aggregateKeywords(
  movies: Movie[],
  { minCount = 2, maxKeywords = 15 }: { minCount?: number; maxKeywords?: number } = {}
): AggregatedKeyword[] {
  const counts = new Map<number, { name: string; count: number }>();

  for (const movie of movies) {
    if (!Array.isArray(movie.keywords)) continue;
    for (const kw of movie.keywords) {
      const existing = counts.get(kw.id);
      if (existing) {
        existing.count++;
      } else {
        counts.set(kw.id, { name: kw.name, count: 1 });
      }
    }
  }

  const result: AggregatedKeyword[] = [];
  for (const [id, { name, count }] of counts) {
    if (count >= minCount) {
      result.push({ id, name, count });
    }
  }

  result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return result.slice(0, maxKeywords);
}

/**
 * Filters movies to those containing a specific keyword ID.
 */
export function filterMoviesByKeyword(movies: Movie[], keywordId: number): Movie[] {
  return movies.filter(m => Array.isArray(m.keywords) && m.keywords.some(kw => kw.id === keywordId));
}
