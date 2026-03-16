export function SectionPreviewCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
      {/* Poster thumbnail placeholder */}
      <div className="w-9 h-[52px] rounded-md bg-slate-700/60 animate-pulse flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title bar */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-32 rounded bg-slate-700/60 animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-slate-700/60 animate-pulse" />
        </div>
        {/* Year bar */}
        <div className="h-3 w-10 rounded bg-slate-700/60 animate-pulse" />
        {/* Badge row */}
        <div className="h-4 w-20 rounded-full bg-slate-700/60 animate-pulse" />
      </div>

      {/* Action buttons placeholder */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-px h-5 bg-slate-700" />
        <div className="size-7 rounded-full bg-slate-700/60 animate-pulse" />
        <div className="size-7 rounded-full bg-slate-700/60 animate-pulse" />
      </div>
    </div>
  );
}
