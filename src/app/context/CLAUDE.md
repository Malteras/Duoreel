# Context — Claude Code Context

## AuthContext.tsx — HIGH RISK, READ CAREFULLY

This file handles Google OAuth PKCE flow. Wrong changes here silently break login.

### What must NOT change

| Config               | Value       | Why                                                                                                       |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `flowType`           | `'pkce'`    | Implicit flow breaks in Figma Make's SitesRuntime (strips URL hash)                                       |
| `detectSessionInUrl` | `false`     | We call `exchangeCodeForSession()` manually in `initAuth()`                                               |
| `storageKey`         | _(not set)_ | Custom key breaks autoRefreshToken — tokens written to default, refresh reads from custom → finds nothing |
| `autoRefreshToken`   | `true`      | Required — JWT expires in 1 hour                                                                          |

### PKCE flow summary

Google redirects back with `?code=` in query string (NOT `#access_token=` in hash).
`initAuth()` detects this, calls `supabase.auth.exchangeCodeForSession(code)`, then
calls `POST /api/ensure-profile` to create the KV profile for first-time Google users.

See `../../../google-signin-docs.md` for full history and failure modes.

### onAuthStateChange

`INITIAL_SESSION` is intentionally ignored — `initAuth()` already handled it.
Only `TOKEN_REFRESHED` and `SIGNED_OUT` are acted on.

## UserInteractionsContext.tsx — Global State

Lives in `src/app/components/UserInteractionsContext.tsx` (yes, in components/).

Provides:

- `watchedMovieIds: Set<number>` — user's watched movie IDs
- `likedMovies: Movie[]` — user's saved movies
- `setLikedMovies` — setter (used by SavedMoviesTab enrichment)
- `partnerWatchedIds: Set<number>` — partner's watched IDs
- `isInitialLoading: boolean` — true until first bulk fetch completes

Do NOT read interaction state from local component state when this context has it.
Do NOT duplicate watched/liked lists in tab-level state.
