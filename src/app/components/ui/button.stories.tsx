import type { Meta, StoryObj } from '@storybook/react';
import { Film, Heart, Loader2 } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All sizes',
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Heart /></Button>
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With leading icon',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button><Film /> Watch Tonight</Button>
      <Button variant="outline"><Heart /> Save</Button>
      <Button variant="secondary"><Loader2 className="animate-spin" /> Loading…</Button>
    </div>
  ),
};

export const Disabled: Story = {
  name: 'Disabled state — all variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button disabled>Default</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
};

export const IconOnly: Story = {
  name: 'Icon-only (size="icon")',
  render: () => (
    <div className="flex gap-3">
      <Button size="icon" variant="default"><Heart /></Button>
      <Button size="icon" variant="outline"><Film /></Button>
      <Button size="icon" variant="ghost"><Heart /></Button>
    </div>
  ),
};
