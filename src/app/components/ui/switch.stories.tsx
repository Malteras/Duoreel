import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Off: Story = {
  name: 'Off (unchecked)',
  args: {
    checked: false,
  },
};

export const On: Story = {
  name: 'On (checked)',
  args: {
    checked: true,
  },
};

export const DisabledOff: Story = {
  name: 'Disabled — off',
  args: {
    checked: false,
    disabled: true,
  },
};

export const DisabledOn: Story = {
  name: 'Disabled — on',
  args: {
    checked: true,
    disabled: true,
  },
};

export const WithLabel: Story = {
  name: 'With label (project usage)',
  render: () => (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <Switch id="show-watched" defaultChecked />
      <label htmlFor="show-watched" className="cursor-pointer">Show watched movies</label>
    </div>
  ),
};
