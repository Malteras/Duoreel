import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { publicAnonKey } from '/utils/supabase/info';
import { API_BASE_URL } from '../../utils/api';

/**
 * Manages movie modal state and syncs with the `?movie=<tmdbId>` URL param.
 * - Opening a movie card sets ?movie=id in the URL (shareable/bookmarkable).
 * - Navigating directly to a URL with ?movie=id fetches and opens the modal.
 * - Closing the modal removes the param.
 * - Browser back/forward closes the modal when ?movie= is removed.
 */
export function useMovieModal(accessToken?: string | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingDeepLink, setIsLoadingDeepLink] = useState(false);

  const movieIdParam = searchParams.get('movie');

  // Sync modal state with URL: close modal when ?movie= param is removed (e.g., back button)
  useEffect(() => {
    if (!movieIdParam && modalOpen) {
      setModalOpen(false);
      setSelectedMovie(null);
    }
  }, [movieIdParam, modalOpen]);

  // Deep-link: if ?movie=id is present but we have no loaded movie, fetch it
  useEffect(() => {
    if (!movieIdParam || selectedMovie || isLoadingDeepLink) return;

    setIsLoadingDeepLink(true);
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`;

    fetch(`${API_BASE_URL}/movies/${movieIdParam}`, {
      headers: { Authorization: authHeader },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!data.id) return;
        const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
        const actors = data.credits?.cast?.slice(0, 5).map((a: any) => a.name);
        setSelectedMovie({ ...data, director, actors });
        setModalOpen(true);
      })
      .catch(err => {
        console.error('Failed to load movie from URL param:', err);
        // Remove the bad param so the page isn't stuck
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('movie');
          return next;
        }, { replace: true });
      })
      .finally(() => setIsLoadingDeepLink(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieIdParam]);

  /** Open a movie card — sets the movie and updates the URL. */
  const openMovie = (movie: any) => {
    setSelectedMovie(movie);
    setModalOpen(true);
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set('movie', String(movie.id));
        return next;
      },
      { replace: false }
    );
  };

  /** Close the modal and remove ?movie= from the URL. */
  const closeMovie = () => {
    setModalOpen(false);
    setSelectedMovie(null);
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('movie');
        return next;
      },
      { replace: true }
    );
  };

  return {
    selectedMovie,
    setSelectedMovie,
    modalOpen,
    setModalOpen,
    openMovie,
    closeMovie,
    isLoadingDeepLink,
  };
}