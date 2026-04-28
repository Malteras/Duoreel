import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Empty: Story = {
  name: 'Empty — ready to paste',
  args: {
    placeholder: 'Paste CSV data here…',
  },
};

export const WithCSVData: Story = {
  name: 'CSV data pasted (project usage)',
  args: {
    defaultValue:
      'Date,Name,Year,Letterboxd URI\n9/9/2016,Fight Club,1999,https://boxd.it/abc\n1/1/2020,Parasite,2019,https://boxd.it/def\n3/15/2021,The Lighthouse,2019,https://boxd.it/ghi',
    rows: 6,
  },
};

export const Disabled: Story = {
  name: 'Disabled',
  args: {
    disabled: true,
    defaultValue: 'Import in progress…',
  },
};
