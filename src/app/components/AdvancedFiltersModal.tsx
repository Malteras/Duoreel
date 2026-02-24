import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { type Filters, DEFAULT_FILTERS } from '../../utils/filters';
import { STREAMING_SERVICES } from '../../constants/streaming';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Search, Loader2, Eye, EyeOff, Clock } from 'lucide-react';

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: Filters;
  onApplyFilters: (filters: Filters) => void;
  genres: any[];
  projectId: string;
  publicAnonKey: string;
  showWatchedMovies: boolean;
  onShowWatchedMoviesChange: (value: boolean) => void;
  watchedMoviesCount: number;
}

const DECADE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: '2020s', value: '2020-2029' },
  { label: '2010s', value: '2010-2019' },
  { label: '2000s', value: '2000-2009' },
  { label: '1990s', value: '1990-1999' },
  { label: '1980s', value: '1980-1989' },
  { label: '1970s', value: '1970-1979' },
];

const RATING_OPTIONS = [
  { label: 'All Ratings', value: 'all' },
  { label: '8.0+', value: '8' },
  { label: '7.0+', value: '7' },
  { label: '6.0+', value: '6' },
  { label: '5.0+', value: '5' },
];

const LANGUAGE_OPTIONS = [
  { label: 'All Languages', value: 'all' },
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Portuguese', value: 'pt' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { label: 'Any Year', value: 'all' },
  ...Array.from({ length: currentYear - 1899 }, (_, i) => {
    const year = currentYear - i;
    return { label: year.toString(), value: year.toString() };
  }),
];

export function AdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApplyFilters, 
  genres,
  projectId,
  publicAnonKey,
  showWatchedMovies,
  onShowWatchedMoviesChange,
  watchedMoviesCount
}: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState(currentFilters);
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [directorResults, setDirectorResults] = useState<any[]>([]);
  const [actorResults, setActorResults] = useState<any[]>([]);
  const [searchingDirector, setSearchingDirector] = useState(false);
  const [searchingActor, setSearchingActor] = useState(false);
  const [localShowWatched, setLocalShowWatched] = useState(showWatchedMovies);

  const baseUrl = API_BASE_URL;

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
      setLocalShowWatched(showWatchedMovies);
      setDirectorSearch('');
      setActorSearch('');
      setDirectorResults([]);
      setActorResults([]);
    }
  }, [isOpen, currentFilters, showWatchedMovies]);

  const searchDirectors = async (query: string) => {
    if (!query.trim()) {
      setDirectorResults([]);
      return;
    }

    setSearchingDirector(true);
    try {
      const response = await fetch(`${baseUrl}/search/people?query=${encodeURIComponent(query)}&type=director`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setDirectorResults(data.results || []);
    } catch (error) {
      console.error('Error searching directors:', error);
    } finally {
      setSearchingDirector(false);
    }
  };

  const searchActors = async (query: string) => {
    if (!query.trim()) {
      setActorResults([]);
      return;
    }

    setSearchingActor(true);
    try {
      const response = await fetch(`${baseUrl}/search/people?query=${encodeURIComponent(query)}&type=actor`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setActorResults(data.results || []);
    } catch (error) {
      console.error('Error searching actors:', error);
    } finally {
      setSearchingActor(false);
    }
  };

  const handleSearch = () => {
    onApplyFilters(filters);
    onShowWatchedMoviesChange(localShowWatched);
    onClose();
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setLocalShowWatched(false);
    onApplyFilters(DEFAULT_FILTERS);
    onShowWatchedMoviesChange(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Advanced Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Genre */}
          <div>
            <Label className="text-slate-300 mb-2 block">Genre</Label>
            <Select value={filters.genre} onValueChange={(value) => setFilters({ ...filters, genre: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Decade */}
          <div>
            <Label className="text-slate-300 mb-2 block">Decade</Label>
            <Select value={filters.decade} onValueChange={(value) => setFilters({ ...filters, decade: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                {DECADE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div>
            <Label className="text-slate-300 mb-2 block">Specific Year</Label>
            <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Any Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {YEAR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div>
            <Label className="text-slate-300 mb-2 block">Minimum Rating</Label>
            <Select value={filters.rating} onValueChange={(value) => setFilters({ ...filters, rating: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div>
            <Label className="text-slate-300 mb-2 block">Language</Label>
            <Select value={filters.language || 'all'} onValueChange={(value) => setFilters({ ...filters, language: value === 'all' ? null : value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-slate-300 mb-2 block">Duration</Label>
            <Select value={filters.duration} onValueChange={(value) => setFilters({ ...filters, duration: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Durations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="short">Short (0-40 mins)</SelectItem>
                <SelectItem value="medium">Mid-Length (41-79 mins)</SelectItem>
                <SelectItem value="feature">Feature (80-120 mins)</SelectItem>
                <SelectItem value="epic">Epic (120+ mins)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Director Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Director</Label>
            {filters.director ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white">
                  {filters.director}
                </div>
                <Button
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => {
                    setFilters({ ...filters, director: null });
                    setDirectorSearch('');
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    value={directorSearch}
                    onChange={(e) => {
                      setDirectorSearch(e.target.value);
                      searchDirectors(e.target.value);
                    }}
                    placeholder="Search for a director..."
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  {searchingDirector && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />
                  )}
                </div>
                {directorResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-md max-h-[200px] overflow-y-auto">
                    {directorResults.slice(0, 10).map((person) => (
                      <div
                        key={person.id}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={() => {
                          setFilters({ ...filters, director: person.name });
                          setDirectorSearch('');
                          setDirectorResults([]);
                        }}
                      >
                        <div className="text-white font-medium">{person.name}</div>
                        {person.known_for_department && (
                          <div className="text-xs text-slate-400">{person.known_for_department}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actor Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Actor</Label>
            {filters.actor ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white">
                  {filters.actor}
                </div>
                <Button
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => {
                    setFilters({ ...filters, actor: null });
                    setActorSearch('');
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    value={actorSearch}
                    onChange={(e) => {
                      setActorSearch(e.target.value);
                      searchActors(e.target.value);
                    }}
                    placeholder="Search for an actor..."
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  {searchingActor && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />
                  )}
                </div>
                {actorResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-md max-h-[200px] overflow-y-auto">
                    {actorResults.slice(0, 10).map((person) => (
                      <div
                        key={person.id}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                        onClick={() => {
                          setFilters({ ...filters, actor: person.name });
                          setActorSearch('');
                          setActorResults([]);
                        }}
                      >
                        <div className="text-white font-medium">{person.name}</div>
                        {person.known_for_department && (
                          <div className="text-xs text-slate-400">{person.known_for_department}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Streaming Services */}
          <div>
            <Label className="text-slate-300 mb-2 block">Streaming Services</Label>
            <div className="grid grid-cols-2 gap-3">
              {STREAMING_SERVICES.map((service) => {
                const isSelected = filters.streamingServices.includes(service.value);
                return (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        streamingServices: isSelected
                          ? filters.streamingServices.filter(s => s !== service.value)
                          : [...filters.streamingServices, service.value]
                      });
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <img 
                      src={service.logo} 
                      alt={service.label} 
                      className="w-8 h-8 rounded object-cover flex-shrink-0" 
                    />
                    <span className="text-sm font-medium">{service.label}</span>
                  </button>
                );
              })}
            </div>
            {filters.streamingServices.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                {filters.streamingServices.length} service{filters.streamingServices.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Watched Movies Toggle */}
          {watchedMoviesCount > 0 && (
            <div className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center gap-2">
                {localShowWatched ? <Eye className="size-4 text-green-500" /> : <EyeOff className="size-4 text-slate-400" />}
                <div>
                  <Label htmlFor="show-watched-advanced" className="text-sm font-medium text-white cursor-pointer">
                    Show watched movies
                  </Label>
                  <p className="text-xs text-slate-400">
                    {watchedMoviesCount} movie{watchedMoviesCount !== 1 ? 's' : ''} marked as watched
                  </p>
                </div>
              </div>
              <Switch
                id="show-watched-advanced"
                checked={localShowWatched}
                onCheckedChange={setLocalShowWatched}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="secondary"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
            onClick={handleClear}
          >
            Clear All
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSearch}
          >
            <Search className="size-4 mr-2" />
            Search Movies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}