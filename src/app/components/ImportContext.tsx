import { createContext, useContext, ReactNode } from 'react';
import { useCSVImport, CSVImportState } from '../hooks/useCSVImport';
import { projectId } from '/utils/supabase/info';

interface ImportContextType {
  watchlist: CSVImportState;
  watched: CSVImportState;
}

const ImportContext = createContext<ImportContextType | null>(null);

interface ImportProviderProps {
  children: ReactNode;
  accessToken: string | null;
  onWatchlistImported?: (imported: number, failed: number, total: number) => void;
  onWatchedImported?: (imported: number, failed: number, total: number) => void;
}

export function ImportProvider({
  children,
  accessToken,
  onWatchlistImported,
  onWatchedImported,
}: ImportProviderProps) {
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  const watchlist = useCSVImport({
    endpoint: `${baseUrl}/movies/import`,
    accessToken,
    label: 'watchlist',
    onSuccess: onWatchlistImported,
  });

  const watched = useCSVImport({
    endpoint: `${baseUrl}/movies/import-watched`,
    accessToken,
    label: 'watched movies',
    onSuccess: onWatchedImported,
  });

  return (
    <ImportContext.Provider value={{ watchlist, watched }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImportContext() {
  const ctx = useContext(ImportContext);
  if (!ctx)
    throw new Error('useImportContext must be used inside ImportProvider');
  return ctx;
}
