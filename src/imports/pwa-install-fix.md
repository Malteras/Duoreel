## Fix: PWA Install Prompt Not Working

### Problem
DuoReel has `public/manifest.json` and `public/sw.js` but neither is wired up.
The manifest is never linked in the HTML, and the service worker is never registered.
Browsers silently ignore both — so the "Add to Home Screen" / install prompt never appears.

### Changes Required

---

**1. Update `index.html`**

Find:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Movie Discovery App</title>
```

Replace with:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0f172a" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="DuoReel" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon.svg" />
<title>DuoReel</title>
```

---

**2. Register the service worker in `src/main.tsx`**

At the END of `src/main.tsx` (after the ReactDOM.createRoot render call), add:
```typescript
// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
```

---

**3. Update `public/manifest.json` — add PNG icon entries**

Replace the entire `icons` array with:
```json
"icons": [
  {
    "src": "/icons/icon.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any"
  },
  {
    "src": "/icons/icon-maskable.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "maskable"
  },
  {
    "src": "/icons/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

---

**4. Generate PNG icons from the SVG**

Add a new file `scripts/generate-icons.mjs`:
```javascript
// Run once: node scripts/generate-icons.mjs
// Requires: npm install sharp
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/icons/icon.svg');

await sharp(svg).resize(192, 192).png().toFile('./public/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('./public/icons/icon-512.png');

console.log('Icons generated: icon-192.png, icon-512.png');
```

Also add to `package.json` scripts:
```json
"generate-icons": "node scripts/generate-icons.mjs"
```

---

### Impact
- No functional changes to app logic
- `index.html` and `src/main.tsx` touched only

### Testing Checklist
- [ ] Open DevTools → Application tab → Manifest — should show DuoReel manifest with icons
- [ ] Application → Service Workers — should show sw.js as "Activated and running"
- [ ] On mobile Chrome: three-dot menu → "Add to Home Screen" should appear
- [ ] On desktop Chrome: install icon (⊕) should appear in address bar
- [ ] Installed app opens without browser chrome (no address bar)