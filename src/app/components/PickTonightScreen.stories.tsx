import type { Meta, StoryObj } from '@storybook/react';
import { PickTonightScreen } from './PickTonightScreen';
import type { Movie } from '../../types/movie';

const movies: Movie[] = [
  {
    id: 550, title: 'Fight Club', overview: '', vote_average: 8.4,
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    keywords: [{ id: 851, name: 'dual identity' }, { id: 1560, name: 'underground' }],
  },
  {
    id: 278, title: 'The Shawshank Redemption', overview: '', vote_average: 9.3,
    poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    keywords: [{ id: 818, name: 'based on novel' }, { id: 4565, name: 'prison' }],
  },
  {
    id: 238, title: 'The Godfather', overview: '', vote_average: 9.2,
    poster_path: '/3bhkrj58Vtu7enYsLegHnDcdh9O.jpg',
    keywords: [{ id: 818, name: 'based on novel' }, { id: 9715, name: 'mafia' }],
  },
  {
    id: 424, title: "Schindler's List", overview: '', vote_average: 9.0,
    poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
    keywords: [{ id: 818, name: 'based on novel' }, { id: 1560, name: 'underground' }],
  },
  {
    id: 389, title: '12 Angry Men', overview: '', vote_average: 9.0,
    poster_path: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg',
    keywords: [{ id: 4565, name: 'prison' }],
  },
  {
    id: 680, title: 'Pulp Fiction', overview: '', vote_average: 8.9,
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    keywords: [{ id: 9715, name: 'mafia' }, { id: 1560, name: 'underground' }],
  },
];

const noop = () => {};

const meta: Meta<typeof PickTonightScreen> = {
  title: 'Components/PickTonightScreen',
  component: PickTonightScreen,
  args: {
    movies,
    watchedIds: new Set(),
    partnerWatchedIds: new Set(),
    onBack: noop,
    onOpenMovie: noop,
  },
};

export default meta;
type Story = StoryObj<typeof PickTonightScreen>;

export const Default: Story = {
  name: 'Full pool — ready to spin',
};

export const SomeWatched: Story = {
  name: 'Partial pool — some already watched',
  args: {
    watchedIds: new Set([550, 278]),
  },
};

export const PartnerWatched: Story = {
  name: 'Partial pool — partner has seen some',
  args: {
    partnerWatchedIds: new Set([238, 424]),
  },
};

export const PoolExhausted: Story = {
  name: 'Pool exhausted — all movies watched',
  args: {
    watchedIds: new Set(movies.map(m => m.id)),
  },
};

export const SingleMovie: Story = {
  name: 'Single movie in pool',
  args: {
    movies: [movies[0]],
  },
};

export const NoMovies: Story = {
  name: 'Empty list (no matches)',
  args: {
    movies: [],
  },
};
