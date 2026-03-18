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
      likedMoviesError={ctx.likedMoviesError}
      globalImdbCache={ctx.globalImdbCache}
      setGlobalImdbCache={ctx.setGlobalImdbCache}
      savedCache={ctx.savedCache}
      setSavedCache={ctx.setSavedCache}
      cardViewMode={ctx.cardViewMode}
      setCardViewMode={ctx.setCardViewMode}
    />
  );
}