import { useMemo } from 'react';
import type { Movie } from '../../types/movie';
import { aggregateKeywords } from '../../utils/keywordAggregation';

interface KeywordCloudProps {
  movies: Movie[];
  selectedKeywordId: number | null;
  onKeywordToggle: (keywordId: number | null) => void;
}

export function KeywordCloud({ movies, selectedKeywordId, onKeywordToggle }: KeywordCloudProps) {
  const keywords = useMemo(() => aggregateKeywords(movies), [movies]);

  if (keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {keywords.map((kw) => {
        const isSelected = selectedKeywordId === kw.id;
        return (
          <button
            key={kw.id}
            type="button"
            onClick={() => onKeywordToggle(isSelected ? null : kw.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer
              ${isSelected
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/70 hover:text-white border border-slate-600/50'
              }
            `}
          >
            {kw.name}
            <span className={`ml-1.5 text-xs ${isSelected ? 'text-pink-200' : 'text-slate-500'}`}>
              {kw.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
