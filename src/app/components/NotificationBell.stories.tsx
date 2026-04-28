/**
 * NotificationBell fetches all state internally (unread count, notification list).
 * These stories only show the bell trigger. Full notification list stories
 * would require MSW to mock the API endpoints.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router';
import { NotificationBell } from './NotificationBell';

const meta: Meta<typeof NotificationBell> = {
  title: 'Components/NotificationBell',
  component: NotificationBell,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex justify-end p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

export const Idle: Story = {
  name: 'Idle — no badge (no token)',
  args: { accessToken: '' },
};

export const WithBadge: Story = {
  name: 'With unread badge (5)',
  args: { accessToken: 'mock-token' },
  decorators: [
    (Story) => {
      window.fetch = async (url) => {
        const u = String(url);
        if (u.includes('unread-count')) {
          return new Response(JSON.stringify({ count: 5 }), { status: 200 });
        }
        return new Response(JSON.stringify({ notifications: [], hasMore: false }), { status: 200 });
      };
      return <Story />;
    },
  ],
};

export const WithHighCount: Story = {
  name: 'With unread badge (9+)',
  args: { accessToken: 'mock-token' },
  decorators: [
    (Story) => {
      window.fetch = async (url) => {
        const u = String(url);
        if (u.includes('unread-count')) {
          return new Response(JSON.stringify({ count: 12 }), { status: 200 });
        }
        return new Response(JSON.stringify({ notifications: [], hasMore: false }), { status: 200 });
      };
      return <Story />;
    },
  ],
};
