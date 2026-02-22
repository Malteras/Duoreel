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
    // Manifest inlined as data URI — Figma Make hosting redirects all paths
    // to the SPA shell, so /manifest.json cannot be served as a static file.
    const manifest = {
      name: 'DuoReel',
      short_name: 'DuoReel',
      description: 'Find movies you both love',
      start_url: '/discover',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#0f172a',
      orientation: 'portrait',
      icons: [
        {
          src: '/icons/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon-maskable.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable'
        }
      ],
      categories: ['entertainment', 'lifestyle']
    };
    const manifestDataUri = `data:application/manifest+json;base64,${Buffer.from(JSON.stringify(manifest)).toString('base64')}`;

    const tags = `
    <!-- Primary meta -->
    <meta name="description" content="Connect with your partner and discover movies you'll both want to watch. Like, match, and never argue about what to watch again." />
    <link rel="canonical" href="${SITE_URL}/" />

    <!-- PWA — manifest inlined as data URI (Figma Make hosting workaround) -->
    <link rel="manifest" href="${manifestDataUri}" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="mobile-web-app-capable" content="yes" />

    <!-- iOS PWA support -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="DuoReel" />
    <link rel="apple-touch-icon" href="/icons/icon.svg" />

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

    // Insert PWA meta + OG tags just before </head>
    const result = html.replace('</head>', `${tags}</head>`);

    return result;
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