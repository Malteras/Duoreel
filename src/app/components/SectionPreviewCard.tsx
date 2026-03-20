import { Ban, Bookmark, Loader2 } from "lucide-react";
import type { Movie } from "../../types/movie";

interface SectionPreviewCardProps {
    movie: Movie;
    badge: string;
    badgeClassName: string;
    isLiked: boolean;
    isLikeLoading: boolean;
    isNotInterested: boolean;
    imdbRating?: string | null;
    onLike: () => void;
    onUnlike: () => void;
    onNotInterested: () => void;
    onClick: () => void;
    onGenreClick?: (genreId: number) => void;
}

export function SectionPreviewCard({
    movie,
    badge,
    badgeClassName,
    isLiked,
    isLikeLoading,
    isNotInterested,
    imdbRating,
    onLike,
    onUnlike,
    onNotInterested,
    onClick,
    onGenreClick,
}: SectionPreviewCardProps) {
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w154${movie.poster_path}`
        : "";
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "";

    const displayImdbRating = imdbRating || (movie as any).imdbRating || null;
    const genres = (movie.genres || []).slice(0, 2);
    const imdbId = (movie as any).external_ids?.imdb_id;

    return (
        <div
            className={`flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 rounded-xl border transition-colors cursor-pointer ${
                isNotInterested
                    ? "opacity-40 border-slate-700/50"
                    : "border-slate-700/50 hover:border-slate-600"
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
                {/* Row 1: title + ratings */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white text-sm font-medium truncate max-w-[180px]">
                        {movie.title}
                    </p>
                    {movie.vote_average > 0 && (
                        <div className="bg-blue-600/90 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                            <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wide">
                                TMDB
                            </span>
                            <span className="text-[10px] font-bold text-white">
                                {movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    )}
                    {movie.vote_average > 0 &&
                        displayImdbRating !== "N/A" &&
                        (imdbId ? (
                            <a
                                href={`https://www.imdb.com/title/${imdbId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0 hover:opacity-80 transition-opacity ${
                                    displayImdbRating && displayImdbRating !== "NOT_FOUND"
                                        ? "bg-[#F5C518]"
                                        : "bg-[#F5C518]/50"
                                }`}
                            >
                                <span
                                    className={`text-[8px] font-bold uppercase tracking-wide ${
                                        displayImdbRating &&
                                        displayImdbRating !== "NOT_FOUND"
                                            ? "text-black"
                                            : "text-black/40"
                                    }`}
                                >
                                    IMDb
                                </span>
                                {!displayImdbRating ? (
                                    <Loader2 className="size-2.5 animate-spin text-black/50" />
                                ) : displayImdbRating === "NOT_FOUND" ? (
                                    <span className="text-[10px] font-bold text-black/40">
                                        —
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-black">
                                        {displayImdbRating}
                                    </span>
                                )}
                            </a>
                        ) : (
                            <div className="bg-[#F5C518]/50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                                <span className="text-[8px] font-bold text-black/40 uppercase tracking-wide">
                                    IMDb
                                </span>
                                <Loader2 className="size-2.5 animate-spin text-black/50" />
                            </div>
                        ))}
                </div>

                {/* Row 2: year - */}
                <p className="text-slate-400 text-xs mt-0.5">{year}</p>

                {/* Row 3: section badge | genre tags */}
                {badge && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClassName}`}
                        >
                            {badge}
                        </span>
                        {genres.length > 0 && (
                            <>
                                <span className="w-px h-3 bg-slate-600 flex-shrink-0" />
                                {genres.map((genre) => (
                                    <span
                                        key={genre.id}
                                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded bg-purple-600/70 text-white border border-purple-500 ${onGenreClick ? "cursor-pointer hover:bg-purple-700" : ""}`}
                                        onClick={
                                            onGenreClick
                                                ? (e) => {
                                                      e.stopPropagation();
                                                      onGenreClick(genre.id);
                                                  }
                                                : undefined
                                        }
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div
                className="flex items-center gap-2 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-px h-5 bg-slate-700" />
                <button
                    className="size-7 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNotInterested();
                    }}
                    aria-label="Not interested"
                >
                    <Ban className="size-3.5 text-white" />
                </button>
                <button
                    className={`size-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isLiked
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-slate-800/90 hover:bg-slate-700"
                    } ${isLikeLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isLikeLoading) {
                            isLiked ? onUnlike() : onLike();
                        }
                    }}
                    disabled={isLikeLoading}
                    aria-label={isLiked ? "Remove from saved" : "Save movie"}
                >
                    {isLikeLoading ? (
                        <Loader2 className="size-3.5 animate-spin text-white" />
                    ) : (
                        <Bookmark
                            className={`size-3.5 ${isLiked ? "fill-white text-white" : "text-white"}`}
                            fill={isLiked ? "currentColor" : "none"}
                        />
                    )}
                </button>
            </div>
        </div>
    );
}
