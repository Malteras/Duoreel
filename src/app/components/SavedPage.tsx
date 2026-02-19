import { SavedMoviesTab } from './SavedMoviesTab';
import { useAppLayoutContext } from './AppLayout';

export function SavedPage() {
  const ctx = useAppLayoutContext();

  return (
    <SavedMoviesTab
      accessToken={ctx.accessToken}
      projectId={ctx.projectId}
      publicAnonKey={ctx.publicAnonKey}
      navigateToDiscoverWithFilter={ctx.navigateToDiscoverWithFilter}
      likedMovies={ctx.likedMovies}
      setLikedMovies={ctx.setLikedMovies}
      globalImdbCache={ctx.globalImdbCache}
      setGlobalImdbCache={ctx.setGlobalImdbCache}
    />
  );
}
