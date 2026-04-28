import type { Meta, StoryObj } from '@storybook/react';
import { ImportDialog } from './ImportDialog';
import type { CSVImportState } from '../hooks/useCSVImport';

const noop = () => {};
const noopAsync = async () => {};

const baseState: CSVImportState = {
  data: '',
  setData: noop,
  importing: false,
  minimized: false,
  setMinimized: noop,
  dialogOpen: true,
  setDialogOpen: noop,
  progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
  handleFileUpload: noop as any,
  handleImport: noopAsync,
  label: 'watchlist',
};

const meta: Meta<typeof ImportDialog> = {
  title: 'Components/ImportDialog',
  component: ImportDialog,
  args: {
    title: 'Import Letterboxd Watchlist',
    description: 'Export your watchlist CSV from Letterboxd and paste it below.',
    buttonLabel: 'Import Watchlist',
    progressBarColor: 'bg-blue-600',
    importState: baseState,
  },
};

export default meta;
type Story = StoryObj<typeof ImportDialog>;

export const Empty: Story = {
  name: 'Empty — ready to paste CSV',
};

export const WithData: Story = {
  name: 'CSV data entered — ready to import',
  args: {
    importState: {
      ...baseState,
      data: 'Date,Name,Year,Letterboxd URI\n9/9/2016,Fight Club,1999,https://boxd.it/abc\n1/1/2020,Parasite,2019,https://boxd.it/def',
    },
  },
};

export const Importing: Story = {
  name: 'Importing — progress bar (batch 1/3)',
  args: {
    importState: {
      ...baseState,
      importing: true,
      progress: { current: 100, total: 500, batch: 1, totalBatches: 3 },
    },
  },
};

export const ImportingNearEnd: Story = {
  name: 'Importing — nearly done (batch 3/3)',
  args: {
    importState: {
      ...baseState,
      importing: true,
      progress: { current: 400, total: 500, batch: 3, totalBatches: 3 },
    },
  },
};

export const WatchedVariant: Story = {
  name: 'Watched variant (green bar)',
  args: {
    title: 'Import Letterboxd Watched Films',
    description: 'Export your watched films CSV from Letterboxd and paste it below.',
    buttonLabel: 'Import Watched Films',
    progressBarColor: 'bg-green-600',
    importState: {
      ...baseState,
      importing: true,
      label: 'watched',
      progress: { current: 200, total: 600, batch: 2, totalBatches: 4 },
    },
  },
};
