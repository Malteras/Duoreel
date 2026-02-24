/**
 * Shared filter type and defaults for the Discover tab.
 * Import these wherever the filter shape is needed — MoviesTab, AdvancedFiltersModal, etc.
 */
export interface Filters {
  genre: string;
  decade: string;
  rating: string;
  year: string;
  director: string | null;
  actor: string | null;
  language: string | null;
  duration: string;
  streamingServices: string[];
}

export const DEFAULT_FILTERS: Filters = {
  genre: "all",
  decade: "all",
  rating: "all",
  year: "all",
  director: null,
  actor: null,
  language: null,
  duration: "all",
  streamingServices: [],
};
