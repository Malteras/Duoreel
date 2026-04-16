import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { KeywordCloud } from './KeywordCloud';
import { filterMoviesByKeyword } from '../../utils/keywordAggregation';

interface PickTonightScreenProps {
  movies: Movie[];
  onBack: () => void;
  onOpenMovie: (movie: Movie) => void;
}

export function PickTonightScreen({ movies, onBack }: PickTonightScreenProps) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);

  const filteredMovies = useMemo(() => {
    if (!selectedKeywordId) return movies;
    return filterMoviesByKeyword(movies, selectedKeywordId);
  }, [movies, selectedKeywordId]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
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

        {/* Keyword Cloud */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 text-center mb-3">Filter by theme</h2>
          <KeywordCloud
            movies={movies}
            selectedKeywordId={selectedKeywordId}
            onKeywordToggle={setSelectedKeywordId}
          />
        </div>

        {/* Pool count */}
        <p className="text-center text-slate-500 text-sm mb-8">
          {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} in pool
        </p>

        {/* Placeholder for Phase 2: Slot Machine Reel */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-48 h-72 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
            <p className="text-slate-600 text-sm text-center px-4">Slot machine reel coming in Phase 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
