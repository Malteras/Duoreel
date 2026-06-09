import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { AppErrorBoundary } from './AppErrorBoundary';

/** A child that throws during render, simulating a crash like the reported TDZ error. */
function Boom(): never {
  throw new Error("Cannot access 'Yt' before initialization");
}

const meta: Meta<typeof AppErrorBoundary> = {
  title: 'App/AppErrorBoundary',
  component: AppErrorBoundary,
};

export default meta;
type Story = StoryObj<typeof AppErrorBoundary>;

export const CatchesRenderError: Story = {
  name: 'Catches a child render error',
  render: () => (
    <AppErrorBoundary>
      <Boom />
    </AppErrorBoundary>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Instead of crashing the tree, it renders the branded fallback.
    await expect(canvas.getByRole('alert')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  },
};

export const RendersChildrenWhenHealthy: Story = {
  name: 'Renders children when no error',
  render: () => (
    <AppErrorBoundary>
      <p>All good — enjoy the show.</p>
    </AppErrorBoundary>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/enjoy the show/i)).toBeInTheDocument();
  },
};
