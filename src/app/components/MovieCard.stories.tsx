import type { Meta, StoryObj } from '@storybook/react';
import { TooltipProvider } from './ui/tooltip';
import { MovieCard } from './MovieCard';
import type { Movie } from '../../types/movie';

const baseMovie: Movie = {
  id: 550,
  title: 'Fight Club',
  overview:
    'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg',
  vote_average: 8.4,
  release_date: '1999-10-15',
  runtime: 139,
  director: 'David Fincher',
  actors: ['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter', 'Meat Loaf'],
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  external_ids: { imdb_id: 'tt0137523' },
};

const movieWithProviders: Movie = {
  ...baseMovie,
  'watch/providers': {
    results: {
      US: {
        flatrate: [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
          },
          {
            provider_id: 9,
            provider_name: 'Amazon Prime Video',
            logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
          },
        ],
      },
    },
  },
};

const noPosterMovie: Movie = {
  ...baseMovie,
  poster_path: undefined,
};

const meta: Meta<typeof MovieCard> = {
  title: 'Components/MovieCard',
  component: MovieCard,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-sm mx-auto p-6">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  args: {
    onLike: () => {},
    onUnlike: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof MovieCard>;

// --- Discover tab states ---

export const Default: Story = {
  name: 'Default (unsaved)',
  args: {
    movie: baseMovie,
    isLiked: false,
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

export const Saved: Story = {
  name: 'Saved to watchlist',
  args: {
    movie: baseMovie,
    isLiked: true,
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

export const Watched: Story = {
  name: 'Watched (dimmed)',
  args: {
    movie: baseMovie,
    isLiked: true,
    isWatched: true,
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

// --- Matches tab state ---

export const Match: Story = {
  name: 'Match badge',
  args: {
    movie: baseMovie,
    isLiked: true,
    isMatch: true,
    imdbRating: '8.8',
  },
};

export const MatchAndWatched: Story = {
  name: 'Match + Watched together',
  args: {
    movie: baseMovie,
    isLiked: true,
    isMatch: true,
    isWatched: true,
    imdbRating: '8.8',
  },
};

// --- Partner context ---

export const PartnerHasSeen: Story = {
  name: 'Partner has seen this',
  args: {
    movie: baseMovie,
    isLiked: false,
    partnerName: 'Alex',
    partnerWatchedIds: new Set([550]),
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

// --- Streaming providers ---

export const WithStreamingProviders: Story = {
  name: 'With streaming providers',
  args: {
    movie: movieWithProviders,
    isLiked: false,
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

// --- Loading / empty states ---

export const ImdbLoading: Story = {
  name: 'IMDb rating loading',
  args: {
    movie: baseMovie,
    isLiked: false,
    imdbRating: undefined,
    onNotInterested: () => {},
  },
};

export const NoPoster: Story = {
  name: 'No poster (fallback icon)',
  args: {
    movie: noPosterMovie,
    isLiked: false,
    imdbRating: '8.8',
    onNotInterested: () => {},
  },
};

export const NoActions: Story = {
  name: 'Actions hidden (showActions=false)',
  args: {
    movie: baseMovie,
    isLiked: false,
    showActions: false,
    imdbRating: '8.8',
  },
};
