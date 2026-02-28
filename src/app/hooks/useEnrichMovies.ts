import { useRef, useState, useEffect, useCallback } from 'react';
import type { Movie } from '../../types/movie';

interface UseEnrichMoviesOptions {
  movies: Movie[];
  setMovies: (updater: (prev: Movie[]) => Movie[]) => void;
  publicAnonKey: string | null;
  baseUrl: string;
  /** Batch size for parallel fetches (default: 5) */
  batchSize?: number;
  /** Called after each batch is merged — use to sync external caches */
  onEnriched?: (updatedMovies: Movie[]) => void;
  /** Extra dependency to trigger re-enrichment (e.g. accessToken) */
  dep?: unknown;
}

/**
 * Shared hook that enriches movies with detail data from /movies/{id}.
 * Extracts: director, actors, genres, runtime, external_ids, homepage,
 * watch/providers, keywords, tagline, budget, revenue, original_language,
 * status, vote_count.
 *
 * Used by all tabs (Discover, Saved, Matches) — single source of truth
 * for the field extraction logic.
 */
export function useEnrichMovies({
  movies,
  setMovies,
  publicAnonKey,
  baseUrl,
  batchSize = 5,
  onEnriched,
  dep,
}: UseEnrichMoviesOptions) {
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  /** Reset enrichment tracking — call on filter change, search, or refresh */
  const resetEnrichment = useCallback(() => {
    setEnrichedIds(new Set());
    enrichingRef.current = new Set();
  }, []);

  useEffect(() => {
    if (movies.length === 0 || !publicAnonKey) return;

    const enrich = async () => {
      const toEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id)
      );
      if (toEnrich.length === 0) return;

      toEnrich.forEach((m) => enrichingRef.current.add(m.id));

      for (let i = 0; i < toEnrich.length; i += batchSize) {
        const batch = toEnrich.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (movie) => {
            try {
              const res = await fetch(`${baseUrl}/movies/${movie.id}`, {
                headers: { Authorization: `Bearer ${publicAnonKey}` },
              });
              if (!res.ok) return null;
              return res.json();
            } catch {
              return null;
            }
          })
        );

        let updatedMovies: Movie[] = [];

        setMovies((prev) => {
          updatedMovies = prev.map((movie) => {
            const idx = batch.findIndex((b) => b.id === movie.id);
            if (idx === -1) return movie;
            const result = results[idx];
            if (result.status !== 'fulfilled' || !result.value) return movie;
            const d = result.value;

            const director =
              d.credits?.crew?.find(
                (c: { job: string; name: string }) => c.job === 'Director'
              )?.name || movie.director;
            const actors =
              d.credits?.cast?.slice(0, 5).map((a: { name: string }) => a.name) ||
              movie.actors;

            return {
              ...movie,
              runtime: d.runtime || movie.runtime,
              director,
              actors,
              genres: d.genres || movie.genres,
              external_ids: d.external_ids || movie.external_ids,
              homepage: d.homepage || movie.homepage,
              'watch/providers': d['watch/providers'] || movie['watch/providers'],
              keywords: d.keywords?.keywords || movie.keywords,
              tagline: d.tagline ?? movie.tagline,
              budget: d.budget ?? movie.budget,
              revenue: d.revenue ?? movie.revenue,
              original_language: d.original_language || movie.original_language,
              status: d.status ?? movie.status,
              vote_count: d.vote_count || movie.vote_count,
            };
          });
          return updatedMovies;
        });

        // Notify caller so they can sync external caches
        if (onEnriched && updatedMovies.length > 0) {
          onEnriched(updatedMovies);
        }

        setEnrichedIds((prev) => {
          const s = new Set(prev);
          batch.forEach((m) => s.add(m.id));
          return s;
        });

        if (i + batchSize < toEnrich.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies.length, publicAnonKey, dep]);

  return { enrichedIds, setEnrichedIds, enrichingRef, resetEnrichment };
}
