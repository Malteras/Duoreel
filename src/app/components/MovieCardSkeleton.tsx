export function MovieCardSkeleton() {
  return (
    <div className="relative group cursor-pointer animate-pulse">
      {/* Card Container */}
      <div className="relative rounded-xl overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
        {/* Poster Skeleton */}
        <div className="aspect-[2/3] bg-gradient-to-br from-slate-700 to-slate-800"></div>

        {/* Bottom Info Section */}
        <div className="p-4 space-y-3">
          {/* Title Skeleton */}
          <div className="h-6 bg-slate-700 rounded w-3/4"></div>

          {/* Rating Badges Skeleton */}
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-slate-700 rounded"></div>
            <div className="h-6 w-16 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompactMovieCardSkeleton() {
  return (
    <div className="relative animate-pulse">
      <div className="relative rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
        {/* Poster Skeleton */}
        <div className="aspect-[2/3] bg-gradient-to-br from-slate-700 to-slate-800">
          {/* Gradient overlay like the real card */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
          {/* Rating badges at bottom-right */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <div className="h-4 w-12 bg-slate-600/60 rounded-full"></div>
            <div className="h-4 w-12 bg-slate-600/60 rounded-full"></div>
          </div>
        </div>
        {/* Title + meta below poster */}
        <div className="p-2 space-y-1.5">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700/60 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function MovieCardSkeletonGrid({ count = 8, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'compact' }) {
  if (viewMode === 'compact') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <CompactMovieCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  );
}
