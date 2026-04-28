import type { Meta, StoryObj } from '@storybook/react';
import { ViewToggle } from './ViewToggle';

const meta: Meta<typeof ViewToggle> = {
  title: 'Components/ViewToggle',
  component: ViewToggle,
  args: {
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ViewToggle>;

export const GridActive: Story = {
  name: 'Grid view active',
  args: { value: 'grid' },
};

export const CompactActive: Story = {
  name: 'Compact view active',
  args: { value: 'compact' },
};
