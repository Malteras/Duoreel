import { MatchesTab } from './MatchesTab';
import { useAppLayoutContext } from './AppLayout';

export function MatchesPage() {
  const ctx = useAppLayoutContext();

  return (
    <MatchesTab
      accessToken={ctx.accessToken}
      projectId={ctx.projectId}
      publicAnonKey={ctx.publicAnonKey}
      navigateToDiscoverWithFilter={ctx.navigateToDiscoverWithFilter}
      globalImdbCache={ctx.globalImdbCache}
      setGlobalImdbCache={ctx.setGlobalImdbCache}
    />
  );
}