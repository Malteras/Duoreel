import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { type Filters, DEFAULT_FILTERS } from '../../utils/filters';
import { STREAMING_SERVICES } from '../../constants/streaming';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Search, Loader2, Eye, EyeOff, Clock, X } from 'lucide-react';

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
  hidePartnerWatched: boolean;
  onHidePartnerWatchedChange: (value: boolean) => void;
  partnerWatchedCount: number;
}

const DECADE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: '2020s', value: '2020-2029' },
  { label: '2010s', value: '2010-2019' },
  { label: '2000s', value: '2000-2009' },
  { label: '1990s', value: '1990-1999' },
  { label: '1980s', value: '1980-1989' },
  { label: '1970s', value: '1970-1979' },
  { label: '1960s', value: '1960-1969' },
  { label: '1950s', value: '1950-1959' },
  { label: '1940s', value: '1940-1949' },
  { label: '1930s', value: '1930-1939' },
  { label: '1920s', value: '1920-1929' },
  { label: '1910s', value: '1910-1919' },
  { label: '1900s', value: '1900-1909' },
  { label: '1890s', value: '1890-1899' },
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

/**
 * URL-bar style search input for single-select filter fields.
 * When a value is selected, it shows as normal text in the input.
 * Focusing selects all text; typing replaces the selection and starts a new search.
 * An ✕ button on the right clears the value.
 */
function SearchFilterInput({
  selectedValue,
  displayLabel,
  searchValue,
  onSearchChange,
  onSelect,
  onClear,
  placeholder,
  isSearching,
  results,
  renderResult,
}: {
  selectedValue: string | null;
  displayLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: () => void;
  onClear: () => void;
  placeholder: string;
  isSearching: boolean;
  results: any[];
  renderResult: (item: any) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether the user is actively searching (vs showing selected value)
  const isSearching_ = !selectedValue || searchValue !== '';

  // The displayed input value: show the search query when typing, otherwise show the selected label
  const inputValue = isSearching_ ? searchValue : displayLabel;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onFocus={() => {
            // Select all text on focus so typing replaces the current value
            if (selectedValue && searchValue === '') {
              setTimeout(() => inputRef.current?.select(), 0);
            }
          }}
          onChange={(e) => {
            // If user starts typing while a value is selected, clear the selection
            if (selectedValue && searchValue === '') {
              onClear();
            }
            onSearchChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-colors pr-10 placeholder:text-slate-500"
        />

        {/* Right side: spinner or ✕ clear button */}
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />
        ) : (selectedValue || searchValue) ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              onSearchChange('');
              // Focus the input after clearing so user can immediately type
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
            aria-label="Clear"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown results — only when actively searching */}
      {results.length > 0 && searchValue && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md max-h-[200px] overflow-y-auto shadow-lg">
          {results.map(renderResult)}
        </div>
      )}
    </div>
  );
}

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
  watchedMoviesCount,
  hidePartnerWatched,
  onHidePartnerWatchedChange,
  partnerWatchedCount
}: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState(currentFilters);
  const [directorSearch, setDirectorSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [directorResults, setDirectorResults] = useState<any[]>([]);
  const [actorResults, setActorResults] = useState<any[]>([]);
  const [searchingDirector, setSearchingDirector] = useState(false);
  const [searchingActor, setSearchingActor] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [keywordResults, setKeywordResults] = useState<any[]>([]);
  const [searchingKeyword, setSearchingKeyword] = useState(false);
  const [localShowWatched, setLocalShowWatched] = useState(showWatchedMovies);
  const [localHidePartnerWatched, setLocalHidePartnerWatched] = useState(hidePartnerWatched);

  const baseUrl = API_BASE_URL;

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
      setLocalShowWatched(showWatchedMovies);
      setLocalHidePartnerWatched(hidePartnerWatched);
      setDirectorSearch('');
      setActorSearch('');
      setKeywordSearch('');
      setDirectorResults([]);
      setActorResults([]);
      setKeywordResults([]);
    }
  }, [isOpen, currentFilters, showWatchedMovies, hidePartnerWatched]);

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

  const searchKeywords = async (query: string) => {
    if (!query.trim()) {
      setKeywordResults([]);
      return;
    }

    setSearchingKeyword(true);
    try {
      const response = await fetch(`${baseUrl}/search/keywords?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      setKeywordResults(data.results || []);
    } catch (error) {
      console.error('Error searching keywords:', error);
    } finally {
      setSearchingKeyword(false);
    }
  };

  const handleSearch = () => {
    onApplyFilters(filters);
    onShowWatchedMoviesChange(localShowWatched);
    onHidePartnerWatchedChange(localHidePartnerWatched);
    onClose();
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setLocalShowWatched(false);
    setLocalHidePartnerWatched(false);
    onApplyFilters(DEFAULT_FILTERS);
    onShowWatchedMoviesChange(false);
    onHidePartnerWatchedChange(false);
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
            <Select value={filters.genres.length > 0 ? filters.genres[0] : "all"} onValueChange={(value) => setFilters({ ...filters, genres: value === "all" ? [] : [value] })}>
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
            <Select
              value={filters.decade}
              onValueChange={(value) => {
                if (value === 'all') {
                  setFilters({ ...filters, decade: 'all' });
                  return;
                }
                const [start, end] = value.split('-').map(Number);
                const yearInRange = filters.year !== 'all' && Number(filters.year) >= start && Number(filters.year) <= end;
                setFilters({ ...filters, decade: value, year: yearInRange ? filters.year : 'all' });
              }}
            >
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
                {(() => {
                  if (filters.decade === 'all') return YEAR_OPTIONS;
                  const [start, end] = filters.decade.split('-').map(Number);
                  return YEAR_OPTIONS.filter((o) => o.value === 'all' || (Number(o.value) >= start && Number(o.value) <= end));
                })().map((option) => (
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

          {/* Keyword Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Keyword</Label>
            <SearchFilterInput
              selectedValue={filters.keyword}
              displayLabel={filters.keywordName || `Keyword #${filters.keyword}`}
              searchValue={keywordSearch}
              onSearchChange={(value) => {
                setKeywordSearch(value);
                searchKeywords(value);
              }}
              onSelect={() => {}}
              onClear={() => {
                setFilters({ ...filters, keyword: null, keywordName: null });
                setKeywordSearch('');
                setKeywordResults([]);
              }}
              placeholder="Search for a keyword..."
              isSearching={searchingKeyword}
              results={keywordResults}
              renderResult={(kw) => (
                <div
                  key={kw.id}
                  className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setFilters({ ...filters, keyword: kw.id.toString(), keywordName: kw.name });
                    setKeywordSearch('');
                    setKeywordResults([]);
                  }}
                >
                  <div className="text-white font-medium text-sm">{kw.name}</div>
                </div>
              )}
            />
          </div>

          {/* Director Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Director</Label>
            <SearchFilterInput
              selectedValue={filters.director}
              displayLabel={filters.director || ''}
              searchValue={directorSearch}
              onSearchChange={(value) => {
                setDirectorSearch(value);
                searchDirectors(value);
              }}
              onSelect={() => {}}
              onClear={() => {
                setFilters({ ...filters, director: null });
                setDirectorSearch('');
                setDirectorResults([]);
              }}
              placeholder="Search for a director..."
              isSearching={searchingDirector}
              results={directorResults}
              renderResult={(person) => (
                <div
                  key={person.id}
                  className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setFilters({ ...filters, director: person.name });
                    setDirectorSearch('');
                    setDirectorResults([]);
                  }}
                >
                  <div className="text-white font-medium text-sm">{person.name}</div>
                  {person.known_for_department && (
                    <div className="text-xs text-slate-400">{person.known_for_department}</div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Actor Search */}
          <div>
            <Label className="text-slate-300 mb-2 block">Actor</Label>
            <SearchFilterInput
              selectedValue={filters.actor}
              displayLabel={filters.actor || ''}
              searchValue={actorSearch}
              onSearchChange={(value) => {
                setActorSearch(value);
                searchActors(value);
              }}
              onSelect={() => {}}
              onClear={() => {
                setFilters({ ...filters, actor: null });
                setActorSearch('');
                setActorResults([]);
              }}
              placeholder="Search for an actor..."
              isSearching={searchingActor}
              results={actorResults}
              renderResult={(person) => (
                <div
                  key={person.id}
                  className="px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => {
                    setFilters({ ...filters, actor: person.name });
                    setActorSearch('');
                    setActorResults([]);
                  }}
                >
                  <div className="text-white font-medium text-sm">{person.name}</div>
                  {person.known_for_department && (
                    <div className="text-xs text-slate-400">{person.known_for_department}</div>
                  )}
                </div>
              )}
            />
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${
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

          {/* Hide Partner's Watched Toggle */}
          {partnerWatchedCount > 0 && (
            <div className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center gap-2">
                {localHidePartnerWatched ? <EyeOff className="size-4 text-pink-400" /> : <Eye className="size-4 text-slate-400" />}
                <div>
                  <Label htmlFor="hide-partner-watched-advanced" className="text-sm font-medium text-white cursor-pointer">
                    Hide partner's watched movies
                  </Label>
                  <p className="text-xs text-slate-400">
                    {partnerWatchedCount} movie{partnerWatchedCount !== 1 ? 's' : ''} watched by partner
                  </p>
                </div>
              </div>
              <Switch
                id="hide-partner-watched-advanced"
                checked={localHidePartnerWatched}
                onCheckedChange={setLocalHidePartnerWatched}
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