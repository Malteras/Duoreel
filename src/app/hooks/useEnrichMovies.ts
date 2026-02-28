import { useRef, useState, useEffect } from 'react';
import type { Movie } from '../../types/movie';

interface UseEnrichMoviesOptions {
  movies: Movie[];
  setMovies: (updater: (prev: Movie[]) => Movie[]) => void;
  publicAnonKey: string | null;
  baseUrl: string;
  /** Extra condition to trigger re-enrichment (e.g. movies.length or accessToken) */
  dep?: unknown;
}

export function useEnrichMovies({
  movies,
  setMovies,
  publicAnonKey,
  baseUrl,
  dep,
}: UseEnrichMoviesOptions) {
  const [enrichedIds, setEnrichedIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (movies.length === 0 || !publicAnonKey) return;

    const enrich = async () => {
      const toEnrich = movies.filter(
        (m) =>
          !enrichedIds.has(m.id) &&
          !enrichingRef.current.has(m.id) &&
          (!m.genres || m.genres.length === 0) &&
          !m.director
      );
      if (toEnrich.length === 0) return;

      toEnrich.forEach((m) => enrichingRef.current.add(m.id));

      const BATCH = 3;
      for (let i = 0; i < toEnrich.length; i += BATCH) {
        const batch = toEnrich.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(async (movie) => {
            const res = await fetch(`${baseUrl}/movies/${movie.id}`, {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            });
            if (!res.ok) return null;
            return res.json();
          })
        );

        const updates = new Map<number, Partial<Movie>>();
        batch.forEach((movie, idx) => {
          const result = results[idx];
          if (result.status !== 'fulfilled' || !result.value) return;
          const d = result.value;
          updates.set(movie.id, {
            runtime:            d.runtime            || movie.runtime,
            director:           d.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name || movie.director,
            actors:             d.credits?.cast?.slice(0, 5).map((a: { name: string }) => a.name) || movie.actors,
            genres:             d.genres             || movie.genres,
            external_ids:       d.external_ids       || movie.external_ids,
            homepage:           d.homepage           || movie.homepage,
            'watch/providers':  d['watch/providers'] || movie['watch/providers'],
            keywords:           d.keywords?.keywords || movie.keywords,
          });
        });

        if (updates.size > 0) {
          setMovies((prev) =>
            prev.map((movie) => {
              const enriched = updates.get(movie.id);
              return enriched ? { ...movie, ...enriched } : movie;
            })
          );
        }

        setEnrichedIds((prev) => {
          const s = new Set(prev);
          batch.forEach((m) => s.add(m.id));
          return s;
        });

        if (i + BATCH < toEnrich.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies.length, publicAnonKey, dep]);

  return { enrichedIds, enrichingRef };
}
