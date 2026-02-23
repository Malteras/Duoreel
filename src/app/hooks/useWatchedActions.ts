import { useUserInteractions } from '../components/UserInteractionsContext';
import { toast } from 'sonner';
import type { Movie } from '../../types/movie';

interface UseWatchedActionsOptions {
  accessToken: string | null;
  closeMovie: () => void;
  onWatchedLoading?: (loading: boolean) => void;
}

export function useWatchedActions({
  accessToken,
  closeMovie,
  onWatchedLoading,
}: UseWatchedActionsOptions) {
  const { toggleWatched } = useUserInteractions();

  const handleWatched = async (movie: Movie) => {
    if (!accessToken) {
      toast.error('Please sign in to mark movies as watched');
      return;
    }
    onWatchedLoading?.(true);
    try {
      await toggleWatched(movie.id, true, movie);
      toast.success(`Marked "${movie.title}" as watched`);
      closeMovie();
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      toast.error('Failed to mark as watched');
    } finally {
      onWatchedLoading?.(false);
    }
  };

  const handleUnwatched = async (movieId: number) => {
    if (!accessToken) return;
    try {
      await toggleWatched(movieId, false);
      toast.success('Removed from watched list');
    } catch (error) {
      console.error('Error unmarking movie as watched:', error);
      toast.error('Failed to unmark as watched');
    }
  };

  return { handleWatched, handleUnwatched };
}
