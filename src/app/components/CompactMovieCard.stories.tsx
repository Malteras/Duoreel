import type { Meta, StoryObj } from '@storybook/react';
import { Bookmark, Ban, Heart, Loader2 } from 'lucide-react';
import { CompactMovieCard } from './CompactMovieCard';
import type { Movie } from '../../types/movie';

const baseMovie: Movie = {
  id: 550,
  title: 'Fight Club',
  overview:
    'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  vote_average: 8.4,
  release_date: '1999-10-15',
  runtime: 139,
  director: 'David Fincher',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  external_ids: { imdb_id: 'tt0137523' },
};

// Overlays as rendered by each tab

const DiscoverOverlayUnsaved = (
  <button
    className="size-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer"
    aria-label="Save to watchlist"
  >
    <Bookmark className="size-3.5 text-slate-900" />
  </button>
);

const DiscoverOverlaySaved = (
  <button
    className="size-7 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center cursor-pointer"
    aria-label="Remove from watchlist"
  >
    <Bookmark className="size-3.5 fill-white text-white" />
  </button>
);

const DiscoverBanOverlay = (
  <button
    className="size-7 rounded-full bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
    aria-label="Not interested"
  >
    <Ban className="size-3.5 text-white" />
  </button>
);

const SavedOverlay = (
  <button
    className="size-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center cursor-pointer"
    aria-label="Remove from watchlist"
  >
    <svg className="size-4 fill-white text-white" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  </button>
);

const MatchBadgeOverlay = (
  <span className="bg-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
    <Heart className="size-2.5 fill-white" />Match
  </span>
);

const LoadingOverlay = (
  <button
    className="size-7 rounded-full bg-green-500 opacity-70 flex items-center justify-center cursor-not-allowed"
    disabled
  >
    <Loader2 className="size-3.5 animate-spin text-white" />
  </button>
);

const meta: Meta<typeof CompactMovieCard> = {
  title: 'Components/CompactMovieCard',
  component: CompactMovieCard,
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    movie: baseMovie,
    isWatched: false,
    onClick: () => {},
    imdbRating: '8.8',
  },
};

export default meta;
type Story = StoryObj<typeof CompactMovieCard>;

// --- Discover tab ---

export const DiscoverUnsaved: Story = {
  name: 'Discover — unsaved',
  args: {
    topLeftOverlay: DiscoverOverlayUnsaved,
    topRightOverlay: DiscoverBanOverlay,
  },
};

export const DiscoverSaved: Story = {
  name: 'Discover — saved',
  args: {
    topLeftOverlay: DiscoverOverlaySaved,
    topRightOverlay: DiscoverBanOverlay,
  },
};

export const DiscoverWatched: Story = {
  name: 'Discover — watched (dimmed)',
  args: {
    isWatched: true,
    topLeftOverlay: DiscoverOverlaySaved,
    topRightOverlay: DiscoverBanOverlay,
  },
};

// --- Saved tab ---

export const SavedTab: Story = {
  name: 'Saved — my list',
  args: {
    topLeftOverlay: SavedOverlay,
  },
};

export const SavedTabWatched: Story = {
  name: 'Saved — watched (dimmed)',
  args: {
    isWatched: true,
    topLeftOverlay: SavedOverlay,
  },
};

// --- Matches tab ---

export const MatchesTab: Story = {
  name: 'Matches — match badge',
  args: {
    topLeftOverlay: SavedOverlay,
    topRightOverlay: MatchBadgeOverlay,
  },
};

export const MatchesTabWatched: Story = {
  name: 'Matches — match + watched',
  args: {
    isWatched: true,
    topLeftOverlay: SavedOverlay,
    topRightOverlay: MatchBadgeOverlay,
  },
};

// --- Partner context ---

export const PartnerHasSeen: Story = {
  name: 'Partner has seen this',
  args: {
    partnerName: 'Alex',
    partnerWatchedIds: new Set([550]),
    topLeftOverlay: DiscoverOverlayUnsaved,
    topRightOverlay: DiscoverBanOverlay,
  },
};

// --- Genre filter active ---

export const ActiveGenreHighlight: Story = {
  name: 'Active genre filter highlighted',
  args: {
    activeGenreIds: [18],
    topLeftOverlay: DiscoverOverlaySaved,
  },
};

// --- Loading / empty states ---

export const ActionLoading: Story = {
  name: 'Save action loading',
  args: {
    topLeftOverlay: LoadingOverlay,
    topRightOverlay: DiscoverBanOverlay,
  },
};

export const ImdbLoading: Story = {
  name: 'IMDb rating loading',
  args: {
    imdbRating: undefined,
    topLeftOverlay: DiscoverOverlayUnsaved,
  },
};

export const NoPoster: Story = {
  name: 'No poster (fallback icon)',
  args: {
    movie: { ...baseMovie, poster_path: undefined },
    topLeftOverlay: DiscoverOverlayUnsaved,
  },
};

export const NoOverlays: Story = {
  name: 'No overlays (bare card)',
  args: {},
};
