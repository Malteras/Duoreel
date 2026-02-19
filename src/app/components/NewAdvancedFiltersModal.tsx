import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';

interface NewAdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: NewAdvancedFilters) => void;
  currentFilters: NewAdvancedFilters;
}

export interface NewAdvancedFilters {
  directors: string[];
  actors: string[];
  minRuntime: number;
  maxRuntime: number;
  languages: string[];
  minVoteCount: number;
  certifications: string[];
  excludeShortFilms: boolean;
}

// Famous directors to preload
const FAMOUS_DIRECTORS = [
  "Christopher Nolan",
  "Quentin Tarantino",
  "Martin Scorsese",
  "Steven Spielberg",
  "Ridley Scott",
  "James Cameron",
  "Denis Villeneuve",
  "Greta Gerwig",
  "Jordan Peele",
  "Wes Anderson",
  "David Fincher",
  "Alfred Hitchcock",
  "Stanley Kubrick",
  "Francis Ford Coppola",
  "The Coen Brothers",
  "Guillermo del Toro",
  "Bong Joon-ho",
  "Paul Thomas Anderson",
  "Damien Chazelle",
  "Ava DuVernay"
].sort();

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' },
];

const CERTIFICATIONS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

export function NewAdvancedFiltersModal({ isOpen, onClose, onApply, currentFilters }: NewAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<NewAdvancedFilters>(currentFilters);
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  const filteredDirectors = FAMOUS_DIRECTORS.filter(director =>
    director.toLowerCase().includes(directorSearch.toLowerCase())
  );

  const handleAddDirector = (director: string) => {
    if (!filters.directors.includes(director)) {
      setFilters({ ...filters, directors: [...filters.directors, director] });
    }
    setDirectorSearch('');
  };

  const handleRemoveDirector = (director: string) => {
    setFilters({ 
      ...filters, 
      directors: filters.directors.filter(d => d !== director) 
    });
  };

  const handleAddActor = () => {
    if (actorSearch.trim() && !filters.actors.includes(actorSearch.trim())) {
      setFilters({ ...filters, actors: [...filters.actors, actorSearch.trim()] });
      setActorSearch('');
    }
  };

  const handleRemoveActor = (actor: string) => {
    setFilters({ 
      ...filters, 
      actors: filters.actors.filter(a => a !== actor) 
    });
  };

  const handleAddLanguage = (langCode: string) => {
    if (!filters.languages.includes(langCode)) {
      setFilters({ ...filters, languages: [...filters.languages, langCode] });
    }
  };

  const handleRemoveLanguage = (langCode: string) => {
    setFilters({ 
      ...filters, 
      languages: filters.languages.filter(l => l !== langCode) 
    });
  };

  const handleAddCertification = (cert: string) => {
    if (!filters.certifications.includes(cert)) {
      setFilters({ ...filters, certifications: [...filters.certifications, cert] });
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFilters({ 
      ...filters, 
      certifications: filters.certifications.filter(c => c !== cert) 
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClearAll = () => {
    const emptyFilters: NewAdvancedFilters = {
      directors: [],
      actors: [],
      minRuntime: 0,
      maxRuntime: 300,
      languages: [],
      minVoteCount: 0,
      certifications: [],
      excludeShortFilms: false
    };
    setFilters(emptyFilters);
  };

  const hasActiveFilters = 
    filters.directors.length > 0 || 
    filters.actors.length > 0 || 
    filters.languages.length > 0 ||
    filters.certifications.length > 0 ||
    filters.minRuntime > 0 ||
    filters.maxRuntime < 300 ||
    filters.minVoteCount > 0 ||
    filters.excludeShortFilms;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-slate-900 border-slate-700 text-white" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Advanced Filters</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-140px)] pr-4">
          <div className="space-y-6">
            {/* Director Filter */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Filter by Director</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search directors..."
                  value={directorSearch}
                  onChange={(e) => setDirectorSearch(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
              
              {/* Selected Directors */}
              {filters.directors.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  {filters.directors.map((director) => (
                    <Badge key={director} className="bg-blue-600 text-white hover:bg-blue-700 pr-1">
                      {director}
                      <button
                        onClick={() => handleRemoveDirector(director)}
                        className="ml-1 hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Director List */}
              {directorSearch && (
                <div className="border border-slate-700 rounded-lg bg-slate-800 max-h-48 overflow-y-auto">
                  {filteredDirectors.length > 0 ? (
                    filteredDirectors.map((director) => (
                      <button
                        key={director}
                        onClick={() => handleAddDirector(director)}
                        disabled={filters.directors.includes(director)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                      >
                        {director}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-400 text-sm">No directors found</div>
                  )}
                </div>
              )}
            </div>

            {/* Actor Filter */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Filter by Actor</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter actor name..."
                  value={actorSearch}
                  onChange={(e) => setActorSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddActor()}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
                <Button onClick={handleAddActor} className="bg-blue-600 hover:bg-blue-700">
                  Add
                </Button>
              </div>
              
              {filters.actors.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  {filters.actors.map((actor) => (
                    <Badge key={actor} className="bg-purple-600 text-white hover:bg-purple-700 pr-1">
                      {actor}
                      <button
                        onClick={() => handleRemoveActor(actor)}
                        className="ml-1 hover:bg-purple-800 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Runtime Filters */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Runtime (minutes)</Label>
              
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="excludeShort"
                  checked={filters.excludeShortFilms}
                  onCheckedChange={(checked) => setFilters({ 
                    ...filters, 
                    excludeShortFilms: checked as boolean,
                    minRuntime: checked ? 75 : 0
                  })}
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="excludeShort" className="text-white cursor-pointer">
                  Exclude short films (under 75 minutes)
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Minimum</Label>
                  <Input
                    type="number"
                    value={filters.minRuntime}
                    onChange={(e) => setFilters({ ...filters, minRuntime: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={300}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Maximum</Label>
                  <Input
                    type="number"
                    value={filters.maxRuntime}
                    onChange={(e) => setFilters({ ...filters, maxRuntime: parseInt(e.target.value) || 300 })}
                    min={0}
                    max={300}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Language Filter */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={filters.languages.includes(lang.code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => 
                      filters.languages.includes(lang.code) 
                        ? handleRemoveLanguage(lang.code)
                        : handleAddLanguage(lang.code)
                    }
                    className={filters.languages.includes(lang.code) 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                    }
                  >
                    {lang.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Certification Filter */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Age Rating (US)</Label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <Button
                    key={cert}
                    variant={filters.certifications.includes(cert) ? "default" : "outline"}
                    size="sm"
                    onClick={() => 
                      filters.certifications.includes(cert) 
                        ? handleRemoveCertification(cert)
                        : handleAddCertification(cert)
                    }
                    className={filters.certifications.includes(cert) 
                      ? "bg-orange-600 hover:bg-orange-700" 
                      : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                    }
                  >
                    {cert}
                  </Button>
                ))}
              </div>
            </div>

            {/* Minimum Vote Count */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Minimum Vote Count</Label>
              <p className="text-sm text-slate-400">Filter out movies with too few ratings</p>
              <Select 
                value={filters.minVoteCount.toString()} 
                onValueChange={(value) => setFilters({ ...filters, minVoteCount: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="0">No minimum</SelectItem>
                  <SelectItem value="100">At least 100 votes</SelectItem>
                  <SelectItem value="500">At least 500 votes</SelectItem>
                  <SelectItem value="1000">At least 1,000 votes</SelectItem>
                  <SelectItem value="5000">At least 5,000 votes</SelectItem>
                  <SelectItem value="10000">At least 10,000 votes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Clear All
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}