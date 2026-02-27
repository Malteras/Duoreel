import { Eye, EyeOff, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export type WatchedFilter = 'all' | 'unwatched' | 'watched';

interface WatchedFilterSelectProps {
  value: WatchedFilter;
  onChange: (value: WatchedFilter) => void;
}

export function WatchedFilterSelect({ value, onChange }: WatchedFilterSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as WatchedFilter)}>
      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white w-full md:w-[140px] h-8 text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          {value === 'unwatched' ? (
            <EyeOff className="size-3.5 flex-shrink-0 text-slate-400" />
          ) : value === 'watched' ? (
            <Eye className="size-3.5 flex-shrink-0 text-slate-400" />
          ) : (
            <Filter className="size-3.5 flex-shrink-0 text-slate-400" />
          )}
          <span className="truncate"><SelectValue /></span>
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