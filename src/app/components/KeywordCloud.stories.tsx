import type { Meta, StoryObj } from '@storybook/react';
import { KeywordCloud } from './KeywordCloud';
import type { Movie } from '../../types/movie';

const movies: Movie[] = [
  {
    id: 550,
    title: 'Fight Club',
    overview: '',
    vote_average: 8.4,
    keywords: [
      { id: 825, name: 'support group' },
      { id: 851, name: 'dual identity' },
      { id: 1560, name: 'underground' },
      { id: 2038, name: 'nihilism' },
    ],
  },
  {
    id: 278,
    title: 'The Shawshank Redemption',
    overview: '',
    vote_average: 9.3,
    keywords: [
      { id: 851, name: 'dual identity' },
      { id: 818, name: 'based on novel' },
      { id: 4565, name: 'prison' },
    ],
  },
  {
    id: 238,
    title: 'The Godfather',
    overview: '',
    vote_average: 9.2,
    keywords: [
      { id: 818, name: 'based on novel' },
      { id: 1560, name: 'underground' },
      { id: 9715, name: 'mafia' },
    ],
  },
];

const meta: Meta<typeof KeywordCloud> = {
  title: 'Components/KeywordCloud',
  component: KeywordCloud,
  args: {
    movies,
    selectedKeywordId: null,
    onKeywordToggle: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof KeywordCloud>;

export const Default: Story = {
  name: 'No selection',
};

export const Selected: Story = {
  name: 'Keyword selected',
  args: { selectedKeywordId: 818 },
};

export const Empty: Story = {
  name: 'No keywords (renders nothing)',
  args: { movies: [{ id: 1, title: 'No Keywords', overview: '', vote_average: 0 }] },
};
