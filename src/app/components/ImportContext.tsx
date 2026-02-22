import { createContext, useContext, ReactNode } from 'react';
import { useCSVImport, CSVImportState } from '../hooks/useCSVImport';
import { API_BASE_URL } from '../../utils/api';

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
  const watchlist = useCSVImport({
    endpoint: `${API_BASE_URL}/movies/import`,
    accessToken,
    label: 'watchlist',
    onSuccess: onWatchlistImported,
  });

  const watched = useCSVImport({
    endpoint: `${API_BASE_URL}/movies/import-watched`,
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
