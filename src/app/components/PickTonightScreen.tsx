import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { KeywordCloud } from './KeywordCloud';
import { SlotMachineReel } from './SlotMachineReel';
import { filterMoviesByKeyword } from '../../utils/keywordAggregation';

interface PickTonightScreenProps {
  movies: Movie[];
  onBack: () => void;
  onOpenMovie: (movie: Movie) => void;
}

export function PickTonightScreen({ movies, onBack, onOpenMovie }: PickTonightScreenProps) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

  const filteredMovies = useMemo(() => {
    if (!selectedKeywordId) return movies;
    return filterMoviesByKeyword(movies, selectedKeywordId);
  }, [movies, selectedKeywordId]);

  const handleSpin = useCallback(() => {
    if (spinning || filteredMovies.length === 0) return;
    setSpinning(true);
  }, [spinning, filteredMovies.length]);

  const handleLanded = useCallback((movie: Movie) => {
    setSpinning(false);
    onOpenMovie(movie);
  }, [onOpenMovie]);

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

        {/* Pool count */}
        <p className="text-center text-slate-500 text-sm mb-3 shrink-0">
          {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} in pool
        </p>

        {/* Slot Machine Reel — fills remaining space */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4">
          <SlotMachineReel
            movies={filteredMovies}
            spinning={spinning}
            onLanded={handleLanded}
          />

          {/* Spin button */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || filteredMovies.length === 0}
            className="shrink-0 flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold shadow-lg hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Sparkles className="size-5" />
            {spinning ? 'Spinning…' : 'Spin'}
          </button>
        </div>
      </div>
    </div>
  );
}
