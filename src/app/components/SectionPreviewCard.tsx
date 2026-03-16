import { Ban, Bookmark, Loader2, ChevronRight } from 'lucide-react';
import type { Movie } from '../../types/movie';

interface SectionPreviewCardProps {
  movie: Movie;
  badge: string;
  badgeClassName: string;
  isLiked: boolean;
  isLikeLoading: boolean;
  isNotInterested: boolean;
  onLike: () => void;
  onUnlike: () => void;
  onNotInterested: () => void;
  onClick: () => void;
}

export function SectionPreviewCard({
  movie,
  badge,
  badgeClassName,
  isLiked,
  isLikeLoading,
  isNotInterested,
  onLike,
  onUnlike,
  onNotInterested,
  onClick,
}: SectionPreviewCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w154${movie.poster_path}`
    : '';
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '';
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : '';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 rounded-xl border transition-colors cursor-pointer ${
        isNotInterested
          ? 'opacity-40 border-slate-700/50'
          : 'border-slate-700/50 hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      {/* Poster thumbnail */}
      <div className="w-9 h-[52px] rounded-md overflow-hidden flex-shrink-0 bg-slate-700">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{movie.title}</p>
        <p className="text-slate-400 text-xs mt-0.5">
          {[year, runtime].filter(Boolean).join(' · ')}
        </p>
        {badge && (
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${badgeClassName}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="w-px h-5 bg-slate-700" />
        {/* Not interested — Ban icon, exact same style as MovieCard */}
        <button
          className="size-7 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); onNotInterested(); }}
          aria-label="Not interested"
        >
          <Ban className="size-3.5 text-white" />
        </button>
        {/* Save — Bookmark icon with loading state, exact same style as MovieCard */}
        <button
          className={`size-7 rounded-full flex items-center justify-center transition-colors ${
            isLiked
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-slate-800/90 hover:bg-slate-700'
          } ${isLikeLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={(e) => { e.stopPropagation(); if (!isLikeLoading) { isLiked ? onUnlike() : onLike(); } }}
          disabled={isLikeLoading}
          aria-label={isLiked ? 'Remove from saved' : 'Save movie'}
        >
          {isLikeLoading ? (
            <Loader2 className="size-3.5 animate-spin text-white" />
          ) : (
            <Bookmark
              className={`size-3.5 ${isLiked ? 'fill-white text-white' : 'text-white'}`}
              fill={isLiked ? 'currentColor' : 'none'}
            />
          )}
        </button>
        <ChevronRight className="size-3.5 text-slate-600 ml-1" />
      </div>
    </div>
  );
}
