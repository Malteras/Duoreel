import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, RotateCcw } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { KeywordCloud } from './KeywordCloud';
import { SlotMachineReel } from './SlotMachineReel';
import { Switch } from './ui/switch';
import { filterMoviesByKeyword } from '../../utils/keywordAggregation';

interface PickTonightScreenProps {
  movies: Movie[];
  watchedIds: Set<number>;
  partnerWatchedIds: Set<number>;
  onBack: () => void;
  onOpenMovie: (movie: Movie) => void;
}

export function PickTonightScreen({ movies, watchedIds, partnerWatchedIds, onBack, onOpenMovie }: PickTonightScreenProps) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [includeWatched, setIncludeWatched] = useState(false);
  const prevKeywordRef = useRef<number | null>(null);

  // Reset exclusions when keyword filter changes
  useEffect(() => {
    if (prevKeywordRef.current !== selectedKeywordId) {
      prevKeywordRef.current = selectedKeywordId;
      setExcludedIds(new Set());
    }
  }, [selectedKeywordId]);

  const filteredMovies = useMemo(() => {
    let pool = selectedKeywordId ? filterMoviesByKeyword(movies, selectedKeywordId) : movies;
    if (!includeWatched) {
      pool = pool.filter(m => !watchedIds.has(m.id) && !partnerWatchedIds.has(m.id));
    }
    return pool;
  }, [movies, selectedKeywordId, includeWatched, watchedIds, partnerWatchedIds]);

  const availableMovies = useMemo(() => {
    return filteredMovies.filter(m => !excludedIds.has(m.id));
  }, [filteredMovies, excludedIds]);

  const handleSpin = useCallback(() => {
    if (spinning || availableMovies.length === 0) return;
    setSpinning(true);
  }, [spinning, availableMovies.length]);

  const handleLanded = useCallback((movie: Movie) => {
    setSpinning(false);
    setExcludedIds(prev => new Set(prev).add(movie.id));
    onOpenMovie(movie);
  }, [onOpenMovie]);

  const handleReset = useCallback(() => {
    setExcludedIds(new Set());
  }, []);

  return (
    <div className="fixed inset-0 bottom-16 md:bottom-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="size-10 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Pick Tonight</h1>
            <p className="text-slate-400 text-sm">Narrow by mood, then spin to decide</p>
          </div>
        </div>

        {/* Keyword Cloud — hidden while spinning to free space */}
        {!spinning && (
          <div className="mb-3 shrink-0">
            <h2 className="text-sm font-medium text-slate-400 text-center mb-2">Filter by theme</h2>
            <KeywordCloud
              movies={movies}
              selectedKeywordId={selectedKeywordId}
              onKeywordToggle={setSelectedKeywordId}
            />
          </div>
        )}

        {/* Include watched toggle */}
        {!spinning && (
          <div className="flex items-center justify-center gap-2 mb-3 shrink-0">
            <Switch
              id="include-watched"
              checked={includeWatched}
              onCheckedChange={setIncludeWatched}
              className="data-[state=checked]:bg-pink-600"
            />
            <label htmlFor="include-watched" className="text-sm text-slate-400 cursor-pointer select-none">
              Include watched
            </label>
          </div>
        )}

        {/* Pool count */}
        <p className="text-center text-slate-500 text-sm mb-3 shrink-0">
          {availableMovies.length} movie{availableMovies.length !== 1 ? 's' : ''} remaining
          {excludedIds.size > 0 && ` (${excludedIds.size} picked)`}
        </p>

        {/* Slot Machine Reel — fills remaining space */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4">
          {availableMovies.length > 0 ? (
            <>
              <SlotMachineReel
                movies={availableMovies}
                spinning={spinning}
                onLanded={handleLanded}
              />

              {/* Spin button */}
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || availableMovies.length === 0}
                className="shrink-0 flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold shadow-lg hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Sparkles className="size-5" />
                {spinning ? 'Spinning…' : excludedIds.size > 0 ? 'Spin again' : 'Spin'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-slate-300 text-lg font-medium">
                You've spun through all {filteredMovies.length > 0 ? 'filtered ' : ''}matches!
              </p>
              <p className="text-slate-400 text-sm">
                {selectedKeywordId
                  ? 'Try a different keyword or reset to spin again.'
                  : 'Reset to spin through them again.'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-4" />
                Reset picks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
