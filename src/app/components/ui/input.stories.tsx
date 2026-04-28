import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Empty: Story = {
  name: 'Empty',
  args: {
    placeholder: 'Search…',
  },
};

export const WithValue: Story = {
  name: 'With value',
  args: {
    defaultValue: 'David Fincher',
  },
};

export const Password: Story = {
  name: 'Password field',
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Disabled: Story = {
  name: 'Disabled',
  args: {
    disabled: true,
    defaultValue: 'Cannot edit',
  },
};

export const Invalid: Story = {
  name: 'Invalid (aria-invalid)',
  args: {
    'aria-invalid': true,
    defaultValue: 'bad@',
    placeholder: 'Email',
  },
};
