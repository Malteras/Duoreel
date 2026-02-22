const CACHE_NAME = 'duoreel-v1';

const SHELL_ASSETS = [
  '/',
  '/discover',
  '/saved',
  '/matches',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('SW install cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API / external calls → always network (never cache)
// - Navigation (HTML) → network first, fall back to cached shell
// - Static assets → cache first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls or external resources
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/functions/') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navigation requests: network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(
          (cached) =>
            cached ||
            new Response(
              `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DuoReel — Offline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      text-align: center;
      padding: 2rem;
    }
    .card {
      max-width: 360px;
      padding: 2.5rem 2rem;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1.5rem;
    }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
    h1 span { color: #ec4899; }
    .icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
    button {
      background: #ec4899;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #db2777; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎬</div>
    <h1><span>Duo</span>Reel</h1>
    <p>You're offline. Check your connection and try again.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`,
              { headers: { 'Content-Type': 'text/html' } }
            )
        )
      )
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
