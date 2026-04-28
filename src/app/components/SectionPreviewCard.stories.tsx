/**
 * NOTE: SectionPreviewCard is marked for deletion (QUI-221).
 * Replaced by CompactMovieCard grid. Stories kept for reference only.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { SectionPreviewCard } from './SectionPreviewCard';
import { SectionPreviewCardSkeleton } from './SectionPreviewCardSkeleton';
import type { Movie } from '../../types/movie';

const movie: Movie = {
  id: 550,
  title: 'Fight Club',
  overview: '',
  vote_average: 8.4,
  release_date: '1999-10-15',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
  external_ids: { imdb_id: 'tt0137523' },
  imdbRating: '8.8',
};

const noop = () => {};

const meta: Meta<typeof SectionPreviewCard> = {
  title: 'Components/SectionPreviewCard (deprecated)',
  component: SectionPreviewCard,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    movie,
    badge: 'Top Rated',
    badgeClassName: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    isLiked: false,
    isLikeLoading: false,
    isNotInterested: false,
    imdbRating: '8.8',
    onLike: noop,
    onUnlike: noop,
    onNotInterested: noop,
    onClick: noop,
  },
};

export default meta;
type Story = StoryObj<typeof SectionPreviewCard>;

export const Default: Story = {
  name: 'Default — unsaved',
};

export const Saved: Story = {
  name: 'Saved',
  args: { isLiked: true },
};

export const NotInterested: Story = {
  name: 'Not interested (dimmed)',
  args: { isNotInterested: true },
};

export const LikeLoading: Story = {
  name: 'Save action loading',
  args: { isLikeLoading: true },
};

export const NoImdb: Story = {
  name: 'IMDb rating loading',
  args: { imdbRating: undefined },
};

export const NoPoster: Story = {
  name: 'No poster',
  args: { movie: { ...movie, poster_path: undefined } },
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => <SectionPreviewCardSkeleton />,
};
