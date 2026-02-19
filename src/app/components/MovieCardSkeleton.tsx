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

export function MovieCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  );
}
