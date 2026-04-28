import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    value: 40,
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Empty: Story = {
  name: '0% — not started',
  args: { value: 0 },
};

export const OneThird: Story = {
  name: '33% — early',
  args: { value: 33 },
};

export const TwoThirds: Story = {
  name: '66% — mid',
  args: { value: 66 },
};

export const Complete: Story = {
  name: '100% — done',
  args: { value: 100 },
};

export const BlueImport: Story = {
  name: 'Blue bar — watchlist import',
  render: () => (
    <div style={{ width: '320px' }}>
      <Progress value={40} className="[&>[data-slot=progress-indicator]]:bg-blue-600" />
    </div>
  ),
};

export const GreenImport: Story = {
  name: 'Green bar — watched import',
  render: () => (
    <div style={{ width: '320px' }}>
      <Progress value={40} className="[&>[data-slot=progress-indicator]]:bg-green-600" />
    </div>
  ),
};
