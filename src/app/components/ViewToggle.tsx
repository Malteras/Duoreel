import { LayoutGrid, LayoutList } from 'lucide-react';

interface ViewToggleProps {
  value: 'grid' | 'compact';
  onChange: (value: 'grid' | 'compact') => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-md p-0.5 flex-shrink-0">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded transition-colors ${value === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Large card view"
        title="Large cards"
      >
        <LayoutList className="size-3.5" />
      </button>
      <button
        onClick={() => onChange('compact')}
        className={`p-1.5 rounded transition-colors ${value === 'compact' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        aria-label="Compact grid view"
        title="Compact grid"
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </div>
  );
}
