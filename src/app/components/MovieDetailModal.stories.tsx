import type { Meta, StoryObj } from '@storybook/react';
import { TooltipProvider } from './ui/tooltip';
import { MovieDetailModal } from './MovieDetailModal';
import type { Movie } from '../../types/movie';

const baseMovie: Movie = {
  id: 550,
  title: 'Fight Club',
  tagline: "Mischief. Mayhem. Soap.",
  overview:
    'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg',
  vote_average: 8.4,
  vote_count: 26280,
  release_date: '1999-10-15',
  runtime: 139,
  director: 'David Fincher',
  actors: ['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter', 'Meat Loaf', 'Jared Leto'],
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  keywords: [
    { id: 825, name: 'support group' },
    { id: 851, name: 'dual identity' },
    { id: 1560, name: 'underground' },
    { id: 2038, name: 'nihilism' },
  ],
  original_language: 'en',
  budget: 63000000,
  revenue: 101200000,
  status: 'Released',
  external_ids: { imdb_id: 'tt0137523' },
  imdbRating: '8.8',
  'watch/providers': {
    results: {
      US: {
        link: 'https://www.themoviedb.org/movie/550/watch?locale=US',
        flatrate: [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
          },
        ],
      },
    },
  },
  videos: {
    results: [
      {
        key: 'SUXWAEX2jlg',
        name: 'Fight Club | #TBT Trailer',
        site: 'YouTube',
        type: 'Trailer',
        official: true,
      },
    ],
  },
};

const noop = () => {};

const meta: Meta<typeof MovieDetailModal> = {
  title: 'Components/MovieDetailModal',
  component: MovieDetailModal,
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
    onLike: noop,
    onUnlike: noop,
    onDislike: noop,
    onWatched: noop,
    onUnwatched: noop,
    onGenreClick: noop,
    onKeywordClick: noop,
    onDirectorClick: noop,
    onActorClick: noop,
    onLanguageClick: noop,
    movie: baseMovie,
    isLiked: false,
    isWatched: false,
  },
};

export default meta;
type Story = StoryObj<typeof MovieDetailModal>;

// --- Discover tab ---

export const DiscoverUnsaved: Story = {
  name: 'Discover — unsaved',
  args: {
    isLiked: false,
    showNotInterested: true,
    onNotInterested: noop,
    onFindSimilar: noop,
  },
};

export const DiscoverSaved: Story = {
  name: 'Discover — saved',
  args: {
    isLiked: true,
    showNotInterested: true,
    onNotInterested: noop,
    onFindSimilar: noop,
  },
};

export const DiscoverWatched: Story = {
  name: 'Discover — watched',
  args: {
    isLiked: true,
    isWatched: true,
    showNotInterested: true,
    onNotInterested: noop,
    onFindSimilar: noop,
  },
};

// --- Saved tab ---

export const SavedTab: Story = {
  name: 'Saved — my list',
  args: {
    isLiked: true,
    showNotInterested: false,
  },
};

export const SavedTabWatched: Story = {
  name: 'Saved — watched',
  args: {
    isLiked: true,
    isWatched: true,
    showNotInterested: false,
  },
};

// --- Matches tab ---

export const MatchesTab: Story = {
  name: 'Matches — match',
  args: {
    isLiked: true,
    showNotInterested: false,
  },
};

export const MatchesTabWatched: Story = {
  name: 'Matches — watched together',
  args: {
    isLiked: true,
    isWatched: true,
    showNotInterested: false,
  },
};

// --- Partner context ---

export const PartnerHasSeen: Story = {
  name: 'Partner has seen this',
  args: {
    isLiked: false,
    showNotInterested: true,
    onNotInterested: noop,
    partnerName: 'Alex',
    partnerWatchedIds: new Set([550]),
  },
};

// --- Loading states ---

export const LikeLoading: Story = {
  name: 'Loading — save action',
  args: {
    isLiked: false,
    isLikeLoading: true,
    showNotInterested: true,
  },
};

export const WatchedLoading: Story = {
  name: 'Loading — watched action',
  args: {
    isLiked: true,
    isWatchedLoading: true,
    showNotInterested: true,
  },
};

export const DislikeLoading: Story = {
  name: 'Loading — not interested action',
  args: {
    isLiked: false,
    isDislikeLoading: true,
    showNotInterested: true,
    onNotInterested: noop,
  },
};

// --- Edge cases ---

export const NoProviders: Story = {
  name: 'No streaming providers',
  args: {
    isLiked: false,
    showNotInterested: true,
    movie: { ...baseMovie, 'watch/providers': undefined },
  },
};

export const NoTrailer: Story = {
  name: 'No trailer (backdrop only)',
  args: {
    isLiked: false,
    showNotInterested: true,
    movie: { ...baseMovie, videos: undefined },
  },
};

export const MinimalData: Story = {
  name: 'Minimal data (no enrichment yet)',
  args: {
    isLiked: false,
    showNotInterested: true,
    movie: {
      id: 999,
      title: 'Unknown Film',
      overview: 'Overview not yet available.',
      vote_average: 0,
    },
  },
};
