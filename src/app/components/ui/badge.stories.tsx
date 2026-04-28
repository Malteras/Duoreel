import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  args: {
    children: 'Badge',
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

export const AsGenreTags: Story = {
  name: 'Genre tags (project usage)',
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Thriller'].map((g) => (
        <Badge key={g} variant="secondary">{g}</Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With icon',
  render: () => (
    <div className="flex gap-3">
      <Badge><Star /> Featured</Badge>
      <Badge variant="outline"><Star /> IMDb 8.5</Badge>
    </div>
  ),
};
