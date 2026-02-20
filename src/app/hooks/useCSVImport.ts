import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────

export interface ImportProgress {
  current: number;
  total: number;
  batch: number;
  totalBatches: number;
}

interface CSVMovieEntry {
  title: string;
  name: string;
  year: string;
}

interface UseCSVImportOptions {
  endpoint: string;
  accessToken: string | null;
  label: string;
  onSuccess?: (imported: number, failed: number, total: number) => void;
}

export interface CSVImportState {
  data: string;
  setData: (data: string) => void;
  importing: boolean;
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  progress: ImportProgress;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImport: () => Promise<void>;
  label: string;
}

// ── CSV Parser ────────────────────────────────────────────────────

function parseRow(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t');

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(rawData: string): CSVMovieEntry[] {
  const lines = rawData.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const isTSV = lines[0].includes('\t');
  const delimiter = isTSV ? '\t' : ',';

  const headers = parseRow(lines[0].toLowerCase(), delimiter);
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'title');
  const yearIdx = headers.findIndex(h => h === 'year');
  const hasHeaders = nameIdx >= 0 || yearIdx >= 0;

  const dataLines = hasHeaders ? lines.slice(1) : lines;
  const titleCol = nameIdx >= 0 ? nameIdx : 1;
  const yearCol = yearIdx >= 0 ? yearIdx : 2;

  return dataLines
    .map(line => {
      const parts = parseRow(line, delimiter);
      const title = parts[titleCol]?.trim().replace(/^"|"$/g, '');
      const year = parts[yearCol]?.trim();
      if (!title || !year) return null;
      return { title, name: title, year };
    })
    .filter((entry): entry is CSVMovieEntry => entry !== null);
}

// ── Hook ──────────────────────────────────────────────────────────

const BATCH_SIZE = 200;
const EMPTY_PROGRESS: ImportProgress = {
  current: 0, total: 0, batch: 0, totalBatches: 0
};

export function useCSVImport({
  endpoint,
  accessToken,
  label,
  onSuccess,
}: UseCSVImportOptions): CSVImportState {
  const [data, setData] = useState('');
  const [importing, setImporting] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>(EMPTY_PROGRESS);
  const importingRef = useRef(false);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        setData(event.target?.result as string);
        toast.success('CSV file loaded successfully');
      };
      reader.onerror = () => toast.error('Failed to read file');
      reader.readAsText(file);
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!accessToken || !data || importingRef.current) return;

    setImporting(true);
    importingRef.current = true;
    setProgress(EMPTY_PROGRESS);

    try {
      const movies = parseCSV(data);

      if (movies.length === 0) {
        toast.error('No valid movies found in the data');
        setImporting(false);
        importingRef.current = false;
        return;
      }

      const batches: CSVMovieEntry[][] = [];
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
      }

      setProgress({
        current: 0,
        total: movies.length,
        batch: 0,
        totalBatches: batches.length,
      });

      // ── REASSURANCE TOAST ──
      toast.success(
        `📥 Importing ${movies.length} movies — feel free to keep browsing, we'll notify you when it's done.`,
        { duration: 5000 }
      );

      let totalImported = 0;
      let totalFailed = 0;
      let failedMovies: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        setProgress({
          current: i * BATCH_SIZE,
          total: movies.length,
          batch: i + 1,
          totalBatches: batches.length,
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ movies: batches[i] }),
        });

        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || `Failed to import ${label}`);

        totalImported += result.results.imported || 0;

        if (Array.isArray(result.results.failed)) {
          totalFailed += result.results.failed.length;
          failedMovies = failedMovies.concat(result.results.failed);
        } else if (typeof result.results.failed === 'number') {
          totalFailed += result.results.failed;
        }
      }

      // Final progress
      setProgress({
        current: movies.length,
        total: movies.length,
        batch: batches.length,
        totalBatches: batches.length,
      });

      // Clean up dialog state
      setDialogOpen(false);
      setMinimized(false);
      setData('');

      // ── COMPLETION TOASTS ──
      if (totalImported > 0) {
        toast.success(
          `🎉 Successfully imported ${totalImported} of ${movies.length} movies!`
        );
      }
      if (totalFailed > 0) {
        toast.error(`Could not find ${totalFailed} movies on TMDb`);
        if (failedMovies.length > 0) {
          console.log('Failed movies:', failedMovies);
        }
      }

      // ── CALLBACK (triggers bell notification) ──
      onSuccess?.(totalImported, totalFailed, movies.length);
    } catch (error) {
      console.error(`Error importing ${label}:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to import ${label}`
      );
    } finally {
      setImporting(false);
      importingRef.current = false;
      setProgress(EMPTY_PROGRESS);
    }
  }, [data, accessToken, endpoint, label, onSuccess]);

  return {
    data,
    setData,
    importing,
    minimized,
    setMinimized,
    dialogOpen,
    setDialogOpen,
    progress,
    handleFileUpload,
    handleImport,
    label,
  };
}
