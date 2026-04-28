import { useEffect } from 'react';
import '../src/styles/index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [
    (Story) => {
      useEffect(() => {
        document.documentElement.classList.add('dark');
      }, []);
      return (
        <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;