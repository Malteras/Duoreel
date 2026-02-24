import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { publicAnonKey } from '/utils/supabase/info';
import { API_BASE_URL } from '../../utils/api';

export function useMovieModal(accessToken?: string | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingDeepLink, setIsLoadingDeepLink] = useState(false);

  // True during a card click — prevents both effects from interfering
  const openedViaClickRef = useRef(false);

  const movieIdParam = searchParams.get('movie');

  // Close modal when ?movie= is removed from URL (e.g. back button)
  // Guarded: does not fire during an openMovie() call
  useEffect(() => {
    if (openedViaClickRef.current) return;
    if (!movieIdParam && modalOpen) {
      setModalOpen(false);
      setSelectedMovie(null);
    }
  }, [movieIdParam, modalOpen]);

  // Deep-link: fetch movie when arriving via ?movie=id URL directly
  // Skipped when modal was opened via openMovie() — data already in state
  useEffect(() => {
    if (!movieIdParam || isLoadingDeepLink) return;

    if (openedViaClickRef.current) {
      openedViaClickRef.current = false;
      return;
    }

    if (selectedMovie) return;

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
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete('movie');
          return next;
        }, { replace: true });
      })
      .finally(() => setIsLoadingDeepLink(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieIdParam]);

  const openMovie = (movie: any) => {
    openedViaClickRef.current = true;
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
