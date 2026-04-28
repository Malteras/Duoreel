import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router';
import { ProfileDropdown } from './ProfileDropdown';

const meta: Meta<typeof ProfileDropdown> = {
  title: 'Components/ProfileDropdown',
  component: ProfileDropdown,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex justify-end p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    onSignOut: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ProfileDropdown>;

export const EmailOnly: Story = {
  name: 'Email only — no profile fetch',
  args: {
    accessToken: null,
    userEmail: 'alex@example.com',
  },
};

export const WithName: Story = {
  name: 'With display name (mocked profile)',
  args: {
    accessToken: 'mock-token',
    userEmail: 'alex@example.com',
  },
  decorators: [
    (Story) => {
      window.fetch = async () =>
        new Response(
          JSON.stringify({ name: 'Alex Johnson', photoUrl: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }),
          { status: 200 }
        );
      return <Story />;
    },
  ],
};

export const WithPhoto: Story = {
  name: 'With real avatar photo',
  args: {
    accessToken: 'mock-token',
    userEmail: 'alex@example.com',
  },
  decorators: [
    (Story) => {
      window.fetch = async () =>
        new Response(
          JSON.stringify({ name: 'Alex Johnson', photoUrl: 'https://i.pravatar.cc/150?img=12' }),
          { status: 200 }
        );
      return <Story />;
    },
  ],
};

export const LongEmail: Story = {
  name: 'Long email — truncation',
  args: {
    accessToken: null,
    userEmail: 'very.long.email.address.that.overflows@example-domain.com',
  },
};
