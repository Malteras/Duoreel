import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ErrorFallback } from './ErrorFallback';

const meta: Meta<typeof ErrorFallback> = {
  title: 'App/ErrorFallback',
  component: ErrorFallback,
  args: {
    onReload: fn(),
    onGoHome: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorFallback>;

export const Default: Story = {
  name: 'Default fallback — recovery actions',
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // The fallback announces itself as an alert.
    await expect(canvas.getByRole('alert')).toBeInTheDocument();

    // It offers both recovery actions.
    const tryAgain = canvas.getByRole('button', { name: /try again/i });
    const backToSafety = canvas.getByRole('button', { name: /back to safety/i });

    // "Try again" triggers the reload handler.
    await userEvent.click(tryAgain);
    await expect(args.onReload).toHaveBeenCalledTimes(1);

    // "Back to safety" triggers the go-home handler.
    await userEvent.click(backToSafety);
    await expect(args.onGoHome).toHaveBeenCalledTimes(1);
  },
};

export const WithErrorDetails: Story = {
  name: 'With error details (dev only)',
  args: {
    error: new Error("Cannot access 'Yt' before initialization"),
  },
};
