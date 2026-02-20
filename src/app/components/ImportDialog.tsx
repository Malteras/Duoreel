import { Loader2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { CSVImportState, ImportProgress } from '../hooks/useCSVImport';

function ImportProgressBar({
  progress,
  color,
}: {
  progress: ImportProgress;
  color: string;
}) {
  const displayCurrent = Math.min(progress.current + 200, progress.total);
  const percentage =
    progress.total > 0 ? (displayCurrent / progress.total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-slate-300">
        <span>
          Batch {progress.batch} of {progress.totalBatches}
        </span>
        <span>
          {displayCurrent} / {progress.total} movies
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-300 flex items-center justify-center`}
          style={{ width: `${percentage}%` }}
        >
          <Loader2 className="size-3 text-white animate-spin" />
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm">
        Processing batch {progress.batch}... You can minimize this and keep
        browsing.
      </p>
    </div>
  );
}

interface ImportDialogProps {
  importState: CSVImportState;
  title: string;
  description: string;
  buttonLabel: string;
  progressBarColor: string;
  placeholder?: string;
}

export function ImportDialog({
  importState,
  title,
  description,
  buttonLabel,
  progressBarColor,
  placeholder = 'Date,Name,Year,Letterboxd URI\n9/9/2016,Birth of the Dragon,2016,https://boxd.it/a1f8\n...',
}: ImportDialogProps) {
  const {
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
  } = importState;

  return (
    <Dialog
      open={dialogOpen && !minimized}
      onOpenChange={(open) => {
        if (!importing) setDialogOpen(open);
      }}
    >
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {importing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMinimized(true)}
                className="hover:bg-slate-700"
              >
                <Minimize2 className="size-4" />
              </Button>
            )}
          </div>
          <DialogDescription className="text-slate-400">
            {importing
              ? 'Import in progress. You can minimize this and continue browsing — we\'ll notify you when it\'s done.'
              : description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {importing && progress.total > 0 ? (
            <ImportProgressBar
              progress={progress}
              color={progressBarColor}
            />
          ) : (
            <>
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">
                  Choose CSV File
                </Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="bg-slate-900 border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-500">
                    Or paste CSV data
                  </span>
                </div>
              </div>
              <Textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder={placeholder}
                className="h-[200px] max-h-[200px] overflow-y-auto bg-slate-900 border-slate-700 text-white font-mono text-xs resize-none"
              />
              <Button
                onClick={handleImport}
                disabled={importing || !data}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : null}
                {importing ? 'Importing...' : buttonLabel}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
