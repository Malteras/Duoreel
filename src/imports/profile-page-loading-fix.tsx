# Fix: Profile page slow loading — full spinner blocks all content

## Root cause

`ProfilePage` has one `loading` state that gates the **entire page** behind a
spinner. It only resolves after ALL of these complete:

1. Parallel: `profile` + `partner` + `invite-code` (~200ms)
2. Then parallel: `movies/liked` + `movies/matches` + `movies/watched`
   (full movie arrays — with 1000+ saved movies this is slow)
3. Then sequential (if partner): `movies/partner-liked` (another full array)

The user sees a spinner for 2–5+ seconds before anything renders.

## Fix — one file: `src/app/components/ProfilePage.tsx`

### Change 1 — add a separate `statsLoading` state

Find:
```tsx
  const [loading, setLoading] = useState(true);
```

Replace with:
```tsx
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
```

### Change 2 — split fetchData into two phases

Find the entire `fetchData` async function and its closing `fetchData()` call:

```tsx
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, partnerRes, inviteCodeRes] = await Promise.all([
          fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner/invite-code`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const profileData = await profileRes.json();
        setProfile(profileData);
        setName(profileData.name || '');
        setPhotoUrl(profileData.photoUrl || '');
        setOriginalName(profileData.name || '');
        setOriginalPhotoUrl(profileData.photoUrl || '');
        if (profileData.letterboxdUsername) {
          setLetterboxdUsername(profileData.letterboxdUsername);
        }

        const partnerData = await partnerRes.json();
        if (partnerData.partner) {
          setPartner(partnerData.partner);
        }

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) {
          setInviteCode(inviteData.code);
        }

        // Fetch stats (non-blocking — page works without them)
        try {
          const [likedRes, matchesRes, watchedRes] = await Promise.all([
            fetch(`${baseUrl}/movies/liked`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            fetch(`${baseUrl}/movies/matches`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            fetch(`${baseUrl}/movies/watched`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
          ]);

          const likedData = await likedRes.json();
          const matchesData = await matchesRes.json();
          const watchedData = await watchedRes.json();

          setStats({
            saved: likedData.movies?.length || 0,
            matches: matchesData.movies?.length || 0,
            watched: watchedData.movies?.length || 0,
          });

          // If partner connected, get partner's saved count
          if (partnerData.partner) {
            try {
              const partnerLikedRes = await fetch(`${baseUrl}/movies/partner-liked`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const partnerLikedData = await partnerLikedRes.json();
              setPartnerStats({
                savedCount: partnerLikedData.movies?.length || 0,
              });
            } catch {
              // Non-critical
            }
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
```

Replace with:
```tsx
    const fetchData = async () => {
      setLoading(true);
      let resolvedPartnerData: any = null;
      try {
        const [profileRes, partnerRes, inviteCodeRes] = await Promise.all([
          fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/partner/invite-code`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const profileData = await profileRes.json();
        setProfile(profileData);
        setName(profileData.name || '');
        setPhotoUrl(profileData.photoUrl || '');
        setOriginalName(profileData.name || '');
        setOriginalPhotoUrl(profileData.photoUrl || '');
        if (profileData.letterboxdUsername) {
          setLetterboxdUsername(profileData.letterboxdUsername);
        }

        resolvedPartnerData = await partnerRes.json();
        if (resolvedPartnerData.partner) {
          setPartner(resolvedPartnerData.partner);
        }

        const inviteData = await inviteCodeRes.json();
        if (inviteData.code) {
          setInviteCode(inviteData.code);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        // Unblock the page render immediately after profile/partner loads
        setLoading(false);
      }

      // Fetch stats in the background — page is already visible
      setStatsLoading(true);
      try {
        const [likedRes, matchesRes, watchedRes] = await Promise.all([
          fetch(`${baseUrl}/movies/liked`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/movies/matches`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/movies/watched`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const likedData = await likedRes.json();
        const matchesData = await matchesRes.json();
        const watchedData = await watchedRes.json();

        setStats({
          saved: likedData.movies?.length || 0,
          matches: matchesData.movies?.length || 0,
          watched: watchedData.movies?.length || 0,
        });

        if (resolvedPartnerData?.partner) {
          try {
            const partnerLikedRes = await fetch(`${baseUrl}/movies/partner-liked`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const partnerLikedData = await partnerLikedRes.json();
            setPartnerStats({
              savedCount: partnerLikedData.movies?.length || 0,
            });
          } catch {
            // Non-critical
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchData();
```

### Change 3 — show skeleton placeholders for stats while loading

Find the stats numbers in the render section. They likely look something like:

```tsx
{stats.saved}
```

These need to show a skeleton while `statsLoading` is true. Find the stats
display section (the clickable stat numbers for Saved / Matches / Watched /
Partner's Saved) and wrap each number like:

```tsx
{statsLoading ? (
  <div className="h-6 w-8 bg-slate-700 rounded animate-pulse mx-auto" />
) : (
  <span>{stats.saved}</span>
)}
```

Apply the same pattern to `stats.matches`, `stats.watched`, and
`partnerStats.savedCount`.

---

## Result

- Page renders in ~200ms (after profile/partner/invite-code)
- Stats numbers pulse with a skeleton for 1–3s while movie arrays load
- No change to any other functionality
- Partner stats still load correctly after the partner check resolves

## Testing checklist
- [ ] Profile page renders immediately with avatar/name/partner info visible
- [ ] Stats show animated skeleton placeholders, then real numbers appear
- [ ] All stat click interactions still work after numbers load
- [ ] No regression on edit name, Letterboxd sync, partner connect/disconnect