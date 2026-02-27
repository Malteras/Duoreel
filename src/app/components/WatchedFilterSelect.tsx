import { Eye, EyeOff, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export type WatchedFilter = 'all' | 'unwatched' | 'watched';

interface WatchedFilterSelectProps {
  value: WatchedFilter;
  onChange: (value: WatchedFilter) => void;
}

export function WatchedFilterSelect({ value, onChange }: WatchedFilterSelectProps) {
  const Icon =
    value === 'unwatched' ? EyeOff :
    value === 'watched'   ? Eye    :
                            Filter;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as WatchedFilter)}>
      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-9 md:w-[140px] h-8 text-sm">
        {/* Mobile: icon only */}
        <div className="flex md:hidden items-center justify-center w-full">
          <Icon className="size-3.5 text-slate-300 flex-shrink-0" />
        </div>
        {/* Desktop: icon + label */}
        <div className="hidden md:flex items-center gap-2">
          <Icon className="size-3.5 text-slate-400 flex-shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Movies</SelectItem>
        <SelectItem value="unwatched">Unwatched</SelectItem>
        <SelectItem value="watched">Watched</SelectItem>
      </SelectContent>
    </Select>
  );
}
