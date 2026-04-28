import type { Meta, StoryObj } from '@storybook/react';
import { PartnerConnectCard } from './PartnerConnectCard';

const noop = () => {};

const meta: Meta<typeof PartnerConnectCard> = {
  title: 'Components/PartnerConnectCard',
  component: PartnerConnectCard,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    inviteCode: 'abc123xyz',
    partnerEmail: '',
    outgoingRequests: [],
    regenerating: false,
    sending: false,
    onCopyLink: noop,
    onRegenerate: noop,
    onPartnerEmailChange: noop,
    onSendRequest: noop,
  },
};

export default meta;
type Story = StoryObj<typeof PartnerConnectCard>;

export const Default: Story = {
  name: 'Default — ready to connect',
};

export const EmailTyped: Story = {
  name: 'Email entered — ready to send',
  args: { partnerEmail: 'partner@example.com' },
};

export const PendingRequest: Story = {
  name: 'Pending outgoing request',
  args: {
    outgoingRequests: [{ toUserId: 'user-456', toEmail: 'alex@example.com' }],
  },
};

export const Sending: Story = {
  name: 'Sending request',
  args: {
    partnerEmail: 'partner@example.com',
    sending: true,
  },
};

export const Regenerating: Story = {
  name: 'Regenerating invite code',
  args: { regenerating: true },
};

export const InviteCodeLoading: Story = {
  name: 'Invite code loading',
  args: { inviteCode: '' },
};
