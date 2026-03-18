import type { Movie } from '../../types/movie';
import { Eye, Film, Loader2, Users } from 'lucide-react';

interface CompactMovieCardProps {
  movie: Movie;
  onClick: () => void;
  isWatched: boolean;
  imdbRating?: string | null;
  globalImdbCache?: Map<string, string>;
  onGenreClick?: (genreId: number) => void;
  topLeftOverlay?: React.ReactNode;
  topRightOverlay?: React.ReactNode;
  partnerWatchedIds?: Set<number>;
  partnerName?: string;
}

export function CompactMovieCard({
  movie,
  onClick,
  isWatched,
  imdbRating,
  globalImdbCache,
  onGenreClick,
  topLeftOverlay,
  topRightOverlay,
  partnerWatchedIds,
  partnerName,
}: CompactMovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '';
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '';
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : '';
  const hasImdbId = (movie as any).external_ids?.imdb_id;
  const cachedRating = hasImdbId ? globalImdbCache?.get(hasImdbId) : undefined;
  const displayImdbRating =
    imdbRating ||
    (movie as any).imdbRating ||
    (cachedRating && cachedRating !== 'N/A' ? cachedRating : null);

  return (
    <div
      className={`group relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600 cursor-pointer ${isWatched ? 'opacity-60 grayscale-[30%]' : ''}`}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {posterUrl
          ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Film className="size-10 text-slate-600" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />

        {topLeftOverlay && (
          <div className="absolute top-2 left-2">{topLeftOverlay}</div>
        )}
        {topRightOverlay && (
          <div className="absolute top-2 right-2">{topRightOverlay}</div>
        )}
        {isWatched && (
          <div className={`absolute right-2 z-10 ${topRightOverlay ? 'top-8' : 'top-2'}`}>
            <div className="bg-slate-700/80 text-slate-300 rounded-full flex items-center gap-1 px-1.5 py-0.5 shadow-lg backdrop-blur-sm font-medium">
              <Eye className="size-2.5" />
              <span className="text-[9px]">Watched</span>
            </div>
          </div>
        )}

        {movie.vote_average > 0 && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
            <div className="bg-blue-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg min-h-[19px]">
              <span className="text-[7px] font-bold text-blue-200 uppercase tracking-wide">TMDB</span>
              <span className="text-[10px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
            </div>
            {hasImdbId ? (
              <a
                href={`https://www.imdb.com/title/${hasImdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg transition-colors min-h-[19px] ${
                  displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND'
                    ? 'bg-[#F5C518] hover:bg-[#F5C518]/80'
                    : 'bg-[#F5C518]/50 hover:bg-[#F5C518]/60'
                }`}
              >
                <span className={`text-[7px] font-bold uppercase tracking-wide ${
                  displayImdbRating && displayImdbRating !== 'N/A' ? 'text-black/70' : 'text-black/40'
                }`}>IMDb</span>
                {displayImdbRating && displayImdbRating !== 'N/A' && displayImdbRating !== 'NOT_FOUND' ? (
                  <span className="text-[10px] font-bold text-black">{displayImdbRating}</span>
                ) : displayImdbRating === 'NOT_FOUND' ? (
                  <span className="text-[10px] font-bold text-black/40">—</span>
                ) : (
                  <Loader2 className="size-3 text-black/50 animate-spin" />
                )}
              </a>
            ) : (
              <div className="bg-[#F5C518]/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                <span className="text-[7px] font-bold text-black/30 uppercase tracking-wide">IMDb</span>
                <span className="text-[10px] font-bold text-black/40">—</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        {/* Partner watched eyebrow — above title, matching large card layout */}
        {partnerWatchedIds?.has(movie.id) && partnerName && (
          <div className="flex items-center gap-1 mb-1">
            <Users className="size-2.5 text-pink-500 shrink-0" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-pink-500">
              {partnerName} seen
            </span>
          </div>
        )}
        <h3 className="text-xs font-bold text-white leading-tight line-clamp-2">{movie.title}</h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-300">
          {year && <span>{year}</span>}
          {year && runtime && <span className="text-slate-500">·</span>}
          {runtime && <span>{runtime}</span>}
        </div>
        {movie.genres && movie.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 2).map((genre) => (
              <span
                key={genre.id}
                className={`bg-purple-600/70 text-white border border-purple-500 text-[9px] px-1.5 py-0.5 rounded-full ${onGenreClick ? 'cursor-pointer hover:bg-purple-700' : ''}`}
                onClick={onGenreClick ? (e) => { e.stopPropagation(); onGenreClick(genre.id); } : undefined}
              >
                {genre.name}
              </span>
            ))}
          </div>
        ) : movie.vote_average > 0 ? (
          <div className="flex flex-wrap gap-1">
            <div className="h-[18px] w-12 rounded-full bg-slate-700/60 animate-pulse" />
            <div className="h-[18px] w-16 rounded-full bg-slate-700/60 animate-pulse" />
          </div>
        ) : null}
        {movie.director ? (
          <div className="text-[10px] text-slate-400">Dir: <span className="text-slate-300">{movie.director}</span></div>
        ) : movie.vote_average > 0 ? (
          <div className="h-[12px] w-24 rounded bg-slate-700/60 animate-pulse mt-0.5" />
        ) : null}
      </div>
    </div>
  );
}
