import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithPhoto: Story = {
  name: 'With real photo',
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="User photo" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  ),
};

export const WithGradient: Story = {
  name: 'With gradient (profile fallback)',
  render: () => (
    <Avatar>
      <AvatarImage
        src=""
        style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
      />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  name: 'Fallback — initials only',
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.jpg" alt="" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  name: 'Size variants',
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="size-6">
        <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="" />
        <AvatarFallback className="text-[10px]">AJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="" />
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="" />
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
    </div>
  ),
};
