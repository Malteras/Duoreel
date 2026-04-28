import type { Meta, StoryObj } from '@storybook/react';
import {
  MovieCardSkeleton,
  CompactMovieCardSkeleton,
  MovieCardSkeletonGrid,
} from './MovieCardSkeleton';

// --- MovieCardSkeleton (large) ---

const largeMeta: Meta<typeof MovieCardSkeleton> = {
  title: 'Components/MovieCardSkeleton',
  component: MovieCardSkeleton,
};

export default largeMeta;
type LargeStory = StoryObj<typeof MovieCardSkeleton>;

export const LargeSingle: LargeStory = {
  name: 'Large card — single',
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

// --- CompactMovieCardSkeleton ---

export const CompactSingle: StoryObj<typeof CompactMovieCardSkeleton> = {
  name: 'Compact card — single',
  render: () => <CompactMovieCardSkeleton />,
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
};

// --- MovieCardSkeletonGrid ---

export const GridMode: StoryObj<typeof MovieCardSkeletonGrid> = {
  name: 'Grid — large cards (8)',
  render: () => <MovieCardSkeletonGrid count={8} viewMode="grid" />,
};

export const CompactMode: StoryObj<typeof MovieCardSkeletonGrid> = {
  name: 'Grid — compact cards (10)',
  render: () => <MovieCardSkeletonGrid count={10} viewMode="compact" />,
};
