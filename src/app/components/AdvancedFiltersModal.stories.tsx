import type { Meta, StoryObj } from '@storybook/react';
import { TooltipProvider } from './ui/tooltip';
import { AdvancedFiltersModal } from './AdvancedFiltersModal';
import { DEFAULT_FILTERS } from '../../utils/filters';

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
];

const noop = () => {};

const meta: Meta<typeof AdvancedFiltersModal> = {
  title: 'Components/AdvancedFiltersModal',
  component: AdvancedFiltersModal,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  args: {
    isOpen: true,
    onClose: noop,
    onApplyFilters: noop,
    onShowWatchedMoviesChange: noop,
    onHidePartnerWatchedChange: noop,
    currentFilters: DEFAULT_FILTERS,
    genres,
    projectId: 'mock-project',
    publicAnonKey: '',
    showWatchedMovies: false,
    watchedMoviesCount: 0,
    hidePartnerWatched: false,
    partnerWatchedCount: 0,
  },
};

export default meta;
type Story = StoryObj<typeof AdvancedFiltersModal>;

export const Default: Story = {
  name: 'Default — all filters cleared',
};

export const WithFilters: Story = {
  name: 'Active filters — genre + decade + rating',
  args: {
    currentFilters: {
      ...DEFAULT_FILTERS,
      genres: ['18'],
      decade: '1990-1999',
      rating: '8',
    },
  },
};

export const WithDirectorActor: Story = {
  name: 'Active filters — director + actor',
  args: {
    currentFilters: {
      ...DEFAULT_FILTERS,
      director: 'David Fincher',
      actor: 'Brad Pitt',
    },
  },
};

export const WithStreamingServices: Story = {
  name: 'Streaming services selected',
  args: {
    currentFilters: {
      ...DEFAULT_FILTERS,
      streamingServices: ['netflix', 'amazon-prime'],
    },
  },
};

export const WithWatchedToggle: Story = {
  name: 'With watched toggle (42 watched)',
  args: {
    watchedMoviesCount: 42,
    showWatchedMovies: false,
  },
};

export const WithPartnerToggle: Story = {
  name: 'With partner toggle (17 partner watched)',
  args: {
    partnerWatchedCount: 17,
    hidePartnerWatched: false,
  },
};

export const BothToggles: Story = {
  name: 'Both toggles visible',
  args: {
    watchedMoviesCount: 42,
    showWatchedMovies: true,
    partnerWatchedCount: 17,
    hidePartnerWatched: true,
  },
};
