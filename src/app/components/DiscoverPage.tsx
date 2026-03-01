import { useLocation, useNavigate } from 'react-router';
import { MoviesTab } from './MoviesTab';
import { useAppLayoutContext } from './AppLayout';

/** Bridges the AppLayout outlet context → MoviesTab props. */
export function DiscoverPage() {
  const ctx = useAppLayoutContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Cross-tab navigation state (e.g. clicking a director badge in Saved/Matches)
  const state = location.state as {
    filterType?: 'genre' | 'director' | 'actor' | 'year' | 'keyword';
    filterValue?: string | number;
    filterExtra?: string;
  } | null;

  const initialGenre     = state?.filterType === 'genre'    ? String(state.filterValue) : null;
  const initialDirector  = state?.filterType === 'director' ? String(state.filterValue) : null;
  const initialActor     = state?.filterType === 'actor'    ? String(state.filterValue) : null;
  const initialYear      = state?.filterType === 'year'     ? Number(state.filterValue) : null;
  const initialKeyword   = state?.filterType === 'keyword'  ? String(state.filterValue) : null;
  const initialKeywordName = state?.filterType === 'keyword' ? (state.filterExtra || null) : null;

  // Once MoviesTab has applied the filter, clear the location state so a
  // back-navigation doesn't re-apply it.
  const onFiltersApplied = () =>
    navigate('/discover', { replace: true, state: null });

  return (
    <MoviesTab
      accessToken={ctx.accessToken}
      projectId={ctx.projectId}
      publicAnonKey={ctx.publicAnonKey}
      initialGenre={initialGenre}
      initialDirector={initialDirector}
      initialActor={initialActor}
      initialYear={initialYear}
      initialKeyword={initialKeyword}
      initialKeywordName={initialKeywordName}
      onFiltersApplied={onFiltersApplied}
      globalImdbCache={ctx.globalImdbCache}
      setGlobalImdbCache={ctx.setGlobalImdbCache}
      likedMovies={ctx.likedMovies}
      setLikedMovies={ctx.setLikedMovies}
      discoverCache={ctx.discoverCache}
      setDiscoverCache={ctx.setDiscoverCache}
    />
  );
}