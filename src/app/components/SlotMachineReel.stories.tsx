import type { Meta, StoryObj } from '@storybook/react';
import { SlotMachineReel } from './SlotMachineReel';
import type { Movie } from '../../types/movie';

const movies: Movie[] = [
  { id: 550, title: 'Fight Club', overview: '', vote_average: 8.4, poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
  { id: 278, title: 'The Shawshank Redemption', overview: '', vote_average: 9.3, poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg' },
  { id: 238, title: 'The Godfather', overview: '', vote_average: 9.2, poster_path: '/3bhkrj58Vtu7enYsLegHnDcdh9O.jpg' },
  { id: 424, title: "Schindler's List", overview: '', vote_average: 9.0, poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg' },
  { id: 389, title: '12 Angry Men', overview: '', vote_average: 9.0, poster_path: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg' },
];

const meta: Meta<typeof SlotMachineReel> = {
  title: 'Components/SlotMachineReel',
  component: SlotMachineReel,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    movies,
    spinning: false,
    onLanded: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SlotMachineReel>;

export const Idle: Story = {
  name: 'Idle — showing first 3 posters',
  args: { spinning: false },
};

export const Spinning: Story = {
  name: 'Spinning — 5s animation then lands',
  args: { spinning: true },
};

export const SingleMovie: Story = {
  name: 'Single movie in pool',
  args: {
    movies: [movies[0]],
    spinning: false,
  },
};

export const NoPoster: Story = {
  name: 'Movies without posters (title fallback)',
  args: {
    movies: movies.map(m => ({ ...m, poster_path: undefined })),
    spinning: false,
  },
};
