import type { Meta, StoryObj } from '@storybook/react';
import { MinimizedImportWidget } from './MinimizedImportWidget';
import type { CSVImportState } from '../hooks/useCSVImport';

const noop = () => {};
const noopAsync = async () => {};

const baseState: CSVImportState = {
  data: '',
  setData: noop,
  importing: true,
  minimized: true,
  setMinimized: noop,
  dialogOpen: false,
  setDialogOpen: noop,
  progress: { current: 200, total: 500, batch: 2, totalBatches: 3 },
  handleFileUpload: noop as any,
  handleImport: noopAsync,
  label: 'watchlist',
};

const meta: Meta<typeof MinimizedImportWidget> = {
  title: 'Components/MinimizedImportWidget',
  component: MinimizedImportWidget,
  decorators: [
    (Story) => (
      <div style={{ height: '120px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    importState: baseState,
    color: 'blue',
    bottomOffset: 24,
  },
};

export default meta;
type Story = StoryObj<typeof MinimizedImportWidget>;

export const BlueMidProgress: Story = {
  name: 'Watchlist import — 40% (blue)',
  args: { color: 'blue' },
};

export const GreenMidProgress: Story = {
  name: 'Watched import — 40% (green)',
  args: {
    color: 'green',
    importState: { ...baseState, label: 'watched' },
  },
};

export const EarlyStage: Story = {
  name: 'Early — batch 1/5',
  args: {
    importState: {
      ...baseState,
      progress: { current: 0, total: 1000, batch: 1, totalBatches: 5 },
    },
  },
};

export const NearComplete: Story = {
  name: 'Nearly done — batch 4/5',
  args: {
    importState: {
      ...baseState,
      progress: { current: 800, total: 1000, batch: 4, totalBatches: 5 },
    },
  },
};
