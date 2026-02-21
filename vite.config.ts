import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const SITE_URL = 'https://duoreel.com';
const OG_IMAGE_URL = `${SITE_URL}/og.svg`;

// Injects Open Graph + Twitter Card meta tags into the HTML entry point so
// that bots / link-preview crawlers (WhatsApp, iMessage, Telegram, Slack,
// Discord, etc.) see a rich preview even though they don't execute JS.
const injectOgMetaPlugin: Plugin = {
  name: 'inject-og-meta',
  transformIndexHtml(html) {
    const tags = `
    <!-- Primary meta -->
    <meta name="description" content="Connect with your partner and discover movies you'll both want to watch. Like, match, and never argue about what to watch again." />
    <link rel="canonical" href="${SITE_URL}/" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type"        content="website" />
    <meta property="og:site_name"   content="DuoReel" />
    <meta property="og:url"         content="${SITE_URL}/" />
    <meta property="og:title"       content="DuoReel — Find Movies You Both Love" />
    <meta property="og:description" content="Connect with your partner and discover movies you'll both want to watch. Like, match, and never argue about what to watch again." />
    <meta property="og:image"       content="${OG_IMAGE_URL}" />
    <meta property="og:image:type"  content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt"   content="DuoReel — Find movies you both love" />

    <!-- Twitter / X Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:site"        content="@duoreel" />
    <meta name="twitter:title"       content="DuoReel — Find Movies You Both Love" />
    <meta name="twitter:description" content="Connect with your partner and discover movies you'll both want to watch." />
    <meta name="twitter:image"       content="${OG_IMAGE_URL}" />
    <meta name="twitter:image:alt"   content="DuoReel — Find movies you both love" />
    `;

    // Insert just before </head> so it doesn't conflict with existing charset / viewport tags
    return html.replace('</head>', `${tags}</head>`);
  },
};

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    injectOgMetaPlugin,
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
