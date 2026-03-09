## Fix: PWA Icons Not Loading (SPA Routing Intercepts PNG Files)

### Problem
The manifest references `/icons/icon-192.png` and `/icons/icon-512.png` but
Figma Make's hosting redirects ALL paths to the React app — so those URLs
return the SPA shell instead of the actual PNG files. Chrome sees broken icons
and won't show the install prompt.

### Solution
Point the PNG icon src values to GitHub's raw CDN where the files ARE accessible,
instead of relative paths that get intercepted.

### Change — `supabase/functions/server/index.tsx`

Find:
```
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
```

Replace with:
```
      {
        src: "https://raw.githubusercontent.com/Malteras/Duoreel/main/public/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "https://raw.githubusercontent.com/Malteras/Duoreel/main/public/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
```

### Only this one file needs changing. No other files touched.

### Testing
After publish, open this URL and confirm you see the icon JSON with the new github URLs:
https://xycuaqjmebzurygsxovt.supabase.co/functions/v1/make-server-5623fde1/manifest.webmanifest

Then open duoreel.com on mobile Chrome — three dot menu should show "Add to Home Screen".