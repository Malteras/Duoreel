/**
 * PROTOTYPE — DELETE AFTER TESTING ISSUE #91
 *
 * Simulates the invite link → Google OAuth → redirect flow step by step.
 * Tests two things:
 *   1. sessionStorage redirect survives the OAuth round-trip
 *   2. InvitePage loading guard prevents premature redirects during auth init
 *
 * Run: navigate to /proto-invite in the dev server.
 * Multiple mock "users" are shown side by side.
 */

import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

type AuthState = {
  loading: boolean;
  accessToken: string | null;
};

type Step = {
  label: string;
  description: string;
  auth: AuthState;
  url: string;
  sessionStorage: Record<string, string>;
  invitePageAction: string;
  highlight?: boolean;
};

// ── Simulate the full flow for one mock user ───────────────────────────────

function buildSteps(username: string, inviteCode: string, firstTime = false): Step[] {
  return [
    {
      label: '1. Opens invite link',
      description: `${username} opens /invite/${inviteCode} in a fresh incognito window.`,
      auth: { loading: true, accessToken: null },
      url: `/invite/${inviteCode}`,
      sessionStorage: {},
      invitePageAction: '⏳ loading=true → useEffect no-ops (loading guard fires)',
      highlight: true,
    },
    {
      label: '2. Auth init completes (no session)',
      description: 'initAuth() finds no ?code= and no localStorage session. Sets loading=false.',
      auth: { loading: false, accessToken: null },
      url: `/invite/${inviteCode}`,
      sessionStorage: {},
      invitePageAction: '🔀 loading=false, no token → navigate("/login?redirect=/invite/' + inviteCode + '")',
      highlight: true,
    },
    {
      label: '3. Login page',
      description: 'AuthPage reads ?redirect=/invite/' + inviteCode + ' from URL.',
      auth: { loading: false, accessToken: null },
      url: `/login?redirect=/invite/${inviteCode}`,
      sessionStorage: {},
      invitePageAction: '— (not rendered)',
    },
    {
      label: '4. User clicks "Continue with Google"',
      description: 'AuthPage calls signInWithGoogle("/invite/' + inviteCode + '"). Saves redirect to sessionStorage, then starts OAuth.',
      auth: { loading: false, accessToken: null },
      url: `/login?redirect=/invite/${inviteCode}`,
      sessionStorage: { duoreel_post_oauth_redirect: `/invite/${inviteCode}` },
      invitePageAction: '— (not rendered)',
      highlight: true,
    },
    {
      label: '5. Google OAuth (external)',
      description: 'Browser is at accounts.google.com. sessionStorage persists across this redirect.',
      auth: { loading: false, accessToken: null },
      url: 'https://accounts.google.com/o/oauth2/auth?...',
      sessionStorage: { duoreel_post_oauth_redirect: `/invite/${inviteCode}` },
      invitePageAction: '— (app not loaded)',
    },
    {
      label: '6. OAuth returns to /discover',
      description: 'Google redirects to /discover?code=PKCE_CODE. App reloads. initAuth() starts.',
      auth: { loading: true, accessToken: null },
      url: `/discover?code=PKCE_CODE_XYZ`,
      sessionStorage: { duoreel_post_oauth_redirect: `/invite/${inviteCode}` },
      invitePageAction: '— (not rendered, on /discover)',
    },
    ...(firstTime ? [
      {
        label: '7a. PKCE exchange succeeds (new account created)',
        description: 'Supabase creates a new user. exchangeCodeForSession() returns a fresh session. initAuth() calls POST /api/ensure-profile to create the KV profile — this is the first-time-only step.',
        auth: { loading: true, accessToken: 'tok_' + username.toLowerCase() },
        url: `/discover?code=PKCE_CODE_XYZ`,
        sessionStorage: { duoreel_post_oauth_redirect: `/invite/${inviteCode}` },
        invitePageAction: '— (ensure-profile running…)',
        highlight: true,
      },
      {
        label: '7b. ensure-profile done → sessionStorage redirect',
        description: 'Profile created. initAuth() now checks sessionStorage → finds redirect → removes key → window.location.replace("/invite/' + inviteCode + '")',
        auth: { loading: false, accessToken: 'tok_' + username.toLowerCase() },
        url: `/discover?code=PKCE_CODE_XYZ`,
        sessionStorage: {},
        invitePageAction: '— (sessionStorage consumed, navigating…)',
        highlight: true,
      },
    ] : [
      {
        label: '7. PKCE exchange succeeds (returning user)',
        description: 'exchangeCodeForSession() returns a session. ensure-profile is a no-op (profile exists). initAuth() checks sessionStorage → finds redirect → consumes it → window.location.replace("/invite/' + inviteCode + '")',
        auth: { loading: false, accessToken: 'tok_' + username.toLowerCase() },
        url: `/discover?code=PKCE_CODE_XYZ`,
        sessionStorage: {},
        invitePageAction: '— (sessionStorage consumed, navigating…)',
        highlight: true,
      },
    ]),
    {
      label: '8. Lands on /invite (authenticated)',
      description: 'window.location.replace causes a page reload. initAuth() finds session in localStorage. loading becomes false.',
      auth: { loading: false, accessToken: 'tok_' + username.toLowerCase() },
      url: `/invite/${inviteCode}`,
      sessionStorage: {},
      invitePageAction: '✅ loading=false, token present → calls POST /partner/accept-invite',
      highlight: true,
    },
    {
      label: '9. Invite accepted',
      description: 'Backend returns success. InvitePage shows success state, redirects to /discover.',
      auth: { loading: false, accessToken: 'tok_' + username.toLowerCase() },
      url: `/discover`,
      sessionStorage: {},
      invitePageAction: '🎬 Partner request sent!',
    },
  ];
}

// ── User Panel ─────────────────────────────────────────────────────────────

function UserPanel({ username, inviteCode, firstTime = false }: { username: string; inviteCode: string; firstTime?: boolean }) {
  const steps = buildSteps(username, inviteCode, firstTime);
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex flex-col gap-4 min-w-[320px] max-w-[400px]">
      <div className="flex items-center gap-2">
        <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${firstTime ? 'bg-purple-600' : 'bg-pink-600'}`}>
          {username[0]}
        </div>
        <span className="text-white font-semibold">{username}</span>
        {firstTime && (
          <span className="ml-1 text-[10px] bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded px-1.5 py-0.5">first-time signup</span>
        )}
        <span className="ml-auto text-slate-500 text-xs">Step {stepIdx + 1}/{steps.length}</span>
      </div>

      {/* Step label */}
      <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${step.highlight ? 'bg-pink-600/20 border border-pink-500/40 text-pink-300' : 'bg-slate-700/50 text-slate-300'}`}>
        {step.label}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>

      {/* State display */}
      <div className="space-y-2 text-xs font-mono">
        <StateRow label="URL" value={step.url} color="text-blue-300" />
        <StateRow label="loading" value={String(step.auth.loading)} color={step.auth.loading ? 'text-yellow-400' : 'text-slate-400'} />
        <StateRow label="accessToken" value={step.auth.accessToken ?? 'null'} color={step.auth.accessToken ? 'text-green-400' : 'text-slate-500'} />
        <StateRow
          label="sessionStorage"
          value={
            Object.keys(step.sessionStorage).length === 0
              ? '{}'
              : JSON.stringify(step.sessionStorage, null, 0)
          }
          color={Object.keys(step.sessionStorage).length > 0 ? 'text-orange-300' : 'text-slate-500'}
        />
      </div>

      {/* InvitePage action */}
      <div className="bg-slate-900/70 rounded-lg px-3 py-2 text-xs">
        <span className="text-slate-500">InvitePage: </span>
        <span className="text-slate-200">{step.invitePageAction}</span>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2 mt-auto pt-2">
        <button
          onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          disabled={stepIdx === 0}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm disabled:opacity-30 hover:bg-slate-600 cursor-pointer disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
          disabled={stepIdx === steps.length - 1}
          className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-30 hover:bg-blue-500 cursor-pointer disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function StateRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 w-28 flex-shrink-0">{label}:</span>
      <span className={`${color} break-all`}>{value}</span>
    </div>
  );
}

// ── Scenario: email/password (already worked before fix) ───────────────────

function EmailFlowNote() {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 max-w-[400px]">
      <h3 className="text-white font-semibold mb-2 text-sm">Email/password (was already working)</h3>
      <p className="text-slate-400 text-xs leading-relaxed">
        AuthPage wires <code className="text-blue-300">{'onAuthSuccess={() => navigate(redirect)}'}</code> directly.
        After sign-in the user is navigated to <code className="text-blue-300">/invite/CODE</code> synchronously — no OAuth round-trip, no lost token.
      </p>
      <p className="text-slate-400 text-xs leading-relaxed mt-2">
        The loading guard in InvitePage still matters here: if accessToken transitions from null→value while InvitePage is mounted, useEffect re-runs and correctly calls acceptInvite().
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function InviteFlowProto() {
  const inviteCode = 'abc123';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 rounded-md px-3 py-1 text-yellow-300 text-xs font-mono mb-3">
            PROTOTYPE — delete after #91 is tested
          </div>
          <h1 className="text-2xl font-bold text-white">Invite Flow Simulator</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Invite code: <code className="text-pink-300">/{inviteCode}</code> · Step through each user independently · Pink = critical transition
          </p>
        </div>

        {/* Panels */}
        <div className="flex flex-wrap gap-5 items-start">
          <UserPanel username="Alice" inviteCode={inviteCode} />
          <UserPanel username="Bob" inviteCode={inviteCode} firstTime />
          <EmailFlowNote />
        </div>

        {/* Key decisions */}
        <div className="mt-8 bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 max-w-3xl">
          <h2 className="text-white font-semibold mb-3 text-sm">What this prototype is verifying</h2>
          <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
            <div><span className="text-pink-400 font-semibold">Loading guard (steps 1→2):</span> InvitePage useEffect returns early while loading=true. Without this, step 2 would fire the redirect-to-login before auth resolves.</div>
            <div><span className="text-pink-400 font-semibold">sessionStorage persistence (steps 4→7):</span> The key survives the Google OAuth external redirect because sessionStorage is scoped to the browser tab, not the URL.</div>
            <div><span className="text-pink-400 font-semibold">Consumption (step 7):</span> initAuth() removes the key before calling window.location.replace() — no double-redirect if the page reloads again.</div>
            <div><span className="text-pink-400 font-semibold">Second load (step 8):</span> window.location.replace triggers a full reload. initAuth() now finds no ?code= but does find the session in localStorage. Proceeds normally.</div>
            <div><span className="text-purple-400 font-semibold">First-time signup (steps 7a→7b):</span> ensure-profile runs BEFORE the sessionStorage check — so the KV profile exists by the time InvitePage calls accept-invite on the next load.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
