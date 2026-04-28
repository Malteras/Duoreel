import type { Meta, StoryObj } from '@storybook/react';
import { WatchedFilterSelect } from './WatchedFilterSelect';

const meta: Meta<typeof WatchedFilterSelect> = {
  title: 'Components/WatchedFilterSelect',
  component: WatchedFilterSelect,
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WatchedFilterSelect>;

export const All: Story = {
  name: 'All Movies',
  args: { value: 'all' },
};

export const Unwatched: Story = {
  name: 'Unwatched only',
  args: { value: 'unwatched' },
};

export const Watched: Story = {
  name: 'Watched only',
  args: { value: 'watched' },
};
