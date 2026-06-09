import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

export interface ErrorFallbackProps {
  /** The thrown error (Error, Response, or anything). Details are shown in dev only. */
  error?: unknown;
  /** Override the "Try again" action. Defaults to a full page reload. */
  onReload?: () => void;
  /** Override the "Back to safety" action. Defaults to navigating to "/". */
  onGoHome?: () => void;
}

/** Best-effort readable detail string from an unknown thrown value. */
function getErrorDetail(error: unknown): string {
  if (error == null) return '';
  if (error instanceof Error) return error.stack ?? error.message;
  if (
    typeof error === 'object' &&
    'statusText' in error &&
    (error as { statusText?: unknown }).statusText
  ) {
    return String((error as { statusText: unknown }).statusText);
  }
  return String(error);
}

/**
 * Branded full-screen fallback shown when the app crashes. Rendered by both the
 * router-level error boundary and the top-level class boundary, so it must not
 * depend on router context — recovery actions use plain `window.location`.
 */
export function ErrorFallback({ error, onReload, onGoHome }: ErrorFallbackProps) {
  const handleReload = onReload ?? (() => window.location.reload());
  const handleGoHome = onGoHome ?? (() => window.location.assign('/'));
  const detail = import.meta.env.DEV ? getErrorDetail(error) : '';

  return (
    <div
      role="alert"
      className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/80 p-8 shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-600/15 ring-1 ring-pink-600/30">
          <AlertTriangle className="h-7 w-7 text-pink-500" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-white">Well, this is a plot twist.</h1>
        <p className="mt-2 text-sm text-slate-300">
          Something broke while loading this scene — it&apos;s our code, not you.
        </p>
        <p className="mt-1 text-xs italic text-slate-400">
          &ldquo;You got a bug problem?&rdquo; Yeah&hellip; and we&apos;re on it.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={handleReload} className="bg-pink-600 hover:bg-pink-700">
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
          <Button variant="outline" onClick={handleGoHome}>
            <Home aria-hidden="true" /> Back to safety
          </Button>
        </div>

        {detail ? (
          <pre className="mt-6 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700/50 bg-slate-950/60 p-3 text-left text-xs text-slate-400">
            {detail}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
