import { Loader2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { CSVImportState } from '../hooks/useCSVImport';

interface MinimizedImportWidgetProps {
  importState: CSVImportState;
  color: string;
  bottomOffset?: number;
}

export function MinimizedImportWidget({
  importState,
  color,
  bottomOffset = 24,
}: MinimizedImportWidgetProps) {
  const { importing, minimized, setMinimized, setDialogOpen, progress, label } =
    importState;

  if (!importing || !minimized) return null;

  const colorClasses = {
    spinner: color === 'green' ? 'text-green-500' : 'text-blue-500',
    bar: color === 'green' ? 'bg-green-600' : 'bg-blue-600',
  };

  const displayCurrent = Math.min(progress.current + 200, progress.total);
  const percentage =
    progress.total > 0 ? (displayCurrent / progress.total) * 100 : 0;

  return (
    <div
      className="fixed right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 w-80 z-50"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className={`size-4 ${colorClasses.spinner} animate-spin`} />
          <span className="text-white font-semibold text-sm">
            Importing {label === 'watchlist' ? 'Watchlist' : 'Watched'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMinimized(false);
            setDialogOpen(true);
          }}
          className="hover:bg-slate-700 size-8 p-0"
        >
          <Maximize2 className="size-4 text-slate-400" />
        </Button>
      </div>
      {progress.total > 0 && (
        <>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>
              Batch {progress.batch}/{progress.totalBatches}
            </span>
            <span>
              {displayCurrent}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`${colorClasses.bar} h-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
