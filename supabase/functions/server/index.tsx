import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { getByPrefixPaginated, getKeysByPrefixPaginated } from "./kv_paginated.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import pMap from "npm:p-map";

const app = new Hono();

// Initialize Supabase clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to create notifications
async function createNotification(
  userId: string,
  type: 'partnership_request' | 'partnership_accepted' | 'movie_match' | 'match_milestone' | 'import_complete',
  data: {
    fromUserId?: string;
    fromName?: string;
    movieId?: number;
    movieTitle?: string;
    posterPath?: string;
    milestoneCount?: number;
    importType?: string;
    importedCount?: number;
    failedCount?: number;
    totalCount?: number;
  }
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const notification = {
    id,
    type,
    read: false,
    createdAt: Date.now(),
    data
  };
  
  await kv.set(`notification:${userId}:${id}`, notification);
  
  // Increment unread count
  const current = await kv.get(`notifications:unread:${userId}`) || 0;
  await kv.set(`notifications:unread:${userId}`, (typeof current === 'number' ? current : 0) + 1);
  
  console.log(`Created ${type} notification for user ${userId}`);
}

// Helper function to generate invite codes
function generateInviteCode(): string {
  // Excludes O/0/I/l/1 to avoid visual ambiguity
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Concurrency-limited parallel map ─────────────────────────────
// Like p-limit but zero-dependency. Runs `fn` on each item with at
// most `concurrency` in-flight promises at once.
async function pMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      try {
        const value = await fn(items[i]);
        results[i] = { status: 'fulfilled', value };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }

  // Spawn `concurrency` workers
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Global error handler - catch unhandled errors in route handlers
app.onError((err, c) => {
  console.error('Unhandled error in route handler:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

// Health check endpoint
app.get("/make-server-5623fde1/health", (c) => {
  return c.json({ status: "ok" });
});

// ── PWA Manifest ──────────────────────────────────────────────────────────────
// Served from here because Figma Make's hosting redirects all paths to the
// SPA shell, so /manifest.json cannot be served as a static file.
app.get("/make-server-5623fde1/manifest.webmanifest", (c) => {
  const manifest = {
    name: "DuoReel",
    short_name: "DuoReel",
    description: "Find movies you both love",
    start_url: "/discover",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["entertainment", "lifestyle"],
  };

  return c.json(manifest, 200, {
    "Content-Type": "application/manifest+json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
  });
});

// Auth routes
app.post("/make-server-5623fde1/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create user with auto-confirmed email since we don't have email server configured
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      return c.json({ error: `Signup error: ${error.message}` }, 400);
    }

    // Create user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      createdAt: Date.now()
    });

    // Add to searchable users list
    await kv.set(`user:search:${email}`, { userId: data.user.id, name, email });

    return c.json({ user: data.user, message: 'Account created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: `Failed to create account: ${error}` }, 500);
  }
});

app.post("/make-server-5623fde1/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: `Sign in error: ${error.message}` }, 401);
    }

    return c.json({ 
      session: data.session,
      user: data.user,
      message: 'Signed in successfully' 
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return c.json({ error: `Failed to sign in: ${error}` }, 500);
  }
});

app.post("/make-server-5623fde1/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { error } = await supabase.auth.signOut();

    if (error) {
      return c.json({ error: `Sign out error: ${error.message}` }, 400);
    }

    return c.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Sign out error:', error);
    return c.json({ error: `Failed to sign out: ${error}` }, 500);
  }
});

// Ensure user profile exists — idempotent, handles first-time Google OAuth users
app.post("/make-server-5623fde1/api/ensure-profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: `Unauthorized - Invalid token: ${authError?.message}` }, 401);
    }

    // Check if profile already exists — if so, nothing to do (idempotent)
    const existing = await kv.get(`user:${user.id}`);
    if (existing) {
      return c.json({ exists: true, profile: existing });
    }

    // Profile doesn't exist — create it (first-time OAuth / Google user)
    const body = await c.req.json().catch(() => ({}));
    const email = user.email ?? '';
    const displayName =
      body.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0] ||
      'User';

    const profile = {
      id: user.id,
      email,
      name: displayName,
      photoUrl: user.user_metadata?.avatar_url ?? null,
      createdAt: Date.now(),
    };

    await kv.set(`user:${user.id}`, profile);
    await kv.set(`user:search:${email}`, { userId: user.id, name: displayName, email });

    console.log(`ensure-profile: created new profile for ${email} (${user.id})`);
    return c.json({ exists: false, profile, created: true });
  } catch (error) {
    console.error('ensure-profile error:', error);
    return c.json({ error: `Failed to ensure profile: ${error}` }, 500);
  }
});

// User profile routes
app.get("/make-server-5623fde1/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: `Unauthorized - Invalid token: ${authError?.message}` }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ 
      id: user.id,
      email: user.email,
      ...profile 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: `Failed to fetch profile: ${error}` }, 500);
  }
});

app.post("/make-server-5623fde1/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: `Unauthorized - Invalid token: ${authError?.message}` }, 401);
    }

    const body = await c.req.json();
    const { name, photoUrl, partnerId } = body;

    const currentProfile = await kv.get(`user:${user.id}`) || {};
    const updatedProfile = {
      ...currentProfile,
      ...(name !== undefined && { name }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(partnerId !== undefined && { partnerId }),
    };

    await kv.set(`user:${user.id}`, updatedProfile);
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: `Failed to update profile: ${error}` }, 500);
  }
});

// Connect partner (now sends a request instead of auto-connecting)
app.post("/make-server-5623fde1/partner/connect", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { partnerEmail } = await c.req.json();

    // Find partner by email
    const { data: partnerData, error: partnerError } = await supabase.auth.admin.listUsers();
    const partner = partnerData?.users?.find(u => u.email === partnerEmail);

    if (!partner) {
      return c.json({ error: 'Partner not found' }, 404);
    }

    if (partner.id === user.id) {
      return c.json({ error: 'Cannot send request to yourself' }, 400);
    }

    // Check if already partners
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.partnerId) {
      return c.json({ error: 'You already have a partner' }, 400);
    }

    // Check if request already exists
    const existingRequest = await kv.get(`partner_request:${partner.id}:${user.id}`);
    if (existingRequest) {
      return c.json({ error: 'Request already sent' }, 400);
    }

    // Create partner request
    const senderProfile = await kv.get(`user:${user.id}`) || {};
    await kv.set(`partner_request:${partner.id}:${user.id}`, {
      fromUserId: user.id,
      toUserId: partner.id,
      fromEmail: user.email,
      fromName: senderProfile.name || user.email,
      timestamp: Date.now(),
    });

    // Create notification for the recipient
    await createNotification(partner.id, 'partnership_request', {
      fromUserId: user.id,
      fromName: senderProfile.name || user.email,
    });

    return c.json({ success: true, message: 'Partner request sent' });
  } catch (error) {
    console.error('Error sending partner request:', error);
    return c.json({ error: `Failed to send partner request: ${error}` }, 500);
  }
});

// Get incoming partner requests
app.get("/make-server-5623fde1/partner/requests/incoming", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requests = await kv.getByPrefix(`partner_request:${user.id}:`);
    return c.json({ requests });
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    return c.json({ error: `Failed to fetch requests: ${error}` }, 500);
  }
});

// Get outgoing partner requests (pending)
app.get("/make-server-5623fde1/partner/requests/outgoing", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all requests and filter where this user is the sender
    const allRequests = await kv.getByPrefix(`partner_request:`);
    const outgoingRequests = allRequests.filter((req: any) => req.fromUserId === user.id);
    
    return c.json({ requests: outgoingRequests });
  } catch (error) {
    console.error('Error fetching outgoing requests:', error);
    return c.json({ error: `Failed to fetch requests: ${error}` }, 500);
  }
});

// Accept partner request
app.post("/make-server-5623fde1/partner/accept", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { fromUserId } = await c.req.json();

    // Check if request exists
    const request = await kv.get(`partner_request:${user.id}:${fromUserId}`);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Update both profiles to be partners
    const userProfile = await kv.get(`user:${user.id}`) || {};
    const partnerProfile = await kv.get(`user:${fromUserId}`) || {};

    await kv.set(`user:${user.id}`, { ...userProfile, partnerId: fromUserId });
    await kv.set(`user:${fromUserId}`, { ...partnerProfile, partnerId: user.id });

    // Delete the request
    await kv.del(`partner_request:${user.id}:${fromUserId}`);

    // Create notification for the requester
    await createNotification(fromUserId, 'partnership_accepted', {
      fromUserId: user.id,
      fromName: userProfile.name || user.email || 'Someone',
    });

    return c.json({ success: true, message: 'Partner request accepted' });
  } catch (error) {
    console.error('Error accepting partner request:', error);
    return c.json({ error: `Failed to accept request: ${error}` }, 500);
  }
});

// Reject partner request
app.post("/make-server-5623fde1/partner/reject", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { fromUserId } = await c.req.json();

    // Delete the request
    await kv.del(`partner_request:${user.id}:${fromUserId}`);

    return c.json({ success: true, message: 'Partner request rejected' });
  } catch (error) {
    console.error('Error rejecting partner request:', error);
    return c.json({ error: `Failed to reject request: ${error}` }, 500);
  }
});

// Remove partner
app.post("/make-server-5623fde1/partner/remove", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile?.partnerId) {
      return c.json({ error: 'No partner to remove' }, 400);
    }

    const partnerId = userProfile.partnerId;

    // Remove partner from both profiles
    const partnerProfile = await kv.get(`user:${partnerId}`) || {};
    delete userProfile.partnerId;
    delete partnerProfile.partnerId;

    await kv.set(`user:${user.id}`, userProfile);
    await kv.set(`user:${partnerId}`, partnerProfile);

    return c.json({ success: true, message: 'Partner removed' });
  } catch (error) {
    console.error('Error removing partner:', error);
    return c.json({ error: `Failed to remove partner: ${error}` }, 500);
  }
});

// Get or generate user's invite code
app.get("/make-server-5623fde1/partner/invite-code", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user already has an invite code
    const existing = await kv.get(`user-invite:${user.id}`);
    if (existing?.code) {
      return c.json({ code: existing.code });
    }

    // Generate new code, ensure uniqueness
    let code: string;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const collision = await kv.get(`invite:${code}`);
      if (!collision) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return c.json({ error: 'Failed to generate unique invite code' }, 500);
    }

    // Get user profile for name
    const profile = await kv.get(`user:${user.id}`) || {};

    // Store both lookup directions
    await kv.set(`invite:${code}`, {
      userId: user.id,
      name: profile.name || 'User',
      createdAt: new Date().toISOString(),
    });
    await kv.set(`user-invite:${user.id}`, {
      code,
      createdAt: new Date().toISOString(),
    });

    return c.json({ code });
  } catch (error) {
    console.error('Error getting invite code:', error);
    return c.json({ error: `Failed to get invite code: ${error}` }, 500);
  }
});

// Accept partner invite via link (creates request, not instant connection)
app.post("/make-server-5623fde1/partner/accept-invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();

    // 1. Lookup invite code
    const invite = await kv.get(`invite:${code}`);
    if (!invite) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    const inviterId = invite.userId;

    // 2. Edge case: clicking own link
    if (inviterId === user.id) {
      return c.json({ error: 'self_invite' }, 400);
    }

    // 3. Check if either user already has a partner
    const myProfile = await kv.get(`user:${user.id}`) || {};
    const inviterProfile = await kv.get(`user:${inviterId}`) || {};

    if (myProfile.partnerId) {
      return c.json({ error: 'already_connected' }, 400);
    }
    if (inviterProfile.partnerId) {
      return c.json({ error: 'inviter_connected', inviterName: invite.name }, 400);
    }

    // 4. Check for duplicate request (idempotent)
    const existingRequest = await kv.get(`partner_request:${user.id}:${inviterId}`);
    if (existingRequest) {
      return c.json({ success: true, alreadySent: true, inviterName: invite.name });
    }

    // 5. Create partner REQUEST (not instant connection)
    await kv.set(`partner_request:${user.id}:${inviterId}`, {
      fromUserId: user.id,
      toUserId: inviterId,
      source: 'invite_link',
      createdAt: new Date().toISOString(),
    });

    // 6. Notify the inviter — they decide whether to accept
    await createNotification(inviterId, 'partnership_request', {
      fromUserId: user.id,
      fromName: myProfile.name || user.email || 'Someone',
    });

    console.log(`Partner request sent from ${user.id} to ${inviterId} via invite link`);

    return c.json({
      success: true,
      inviterName: invite.name,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return c.json({ error: `Failed to accept invite: ${error}` }, 500);
  }
});

// Regenerate invite code (invalidate old, generate new)
app.post("/make-server-5623fde1/partner/regenerate-invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get old code and delete it
    const oldInvite = await kv.get(`user-invite:${user.id}`);
    if (oldInvite?.code) {
      await kv.del(`invite:${oldInvite.code}`);
    }

    // Generate new code
    let code: string;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const collision = await kv.get(`invite:${code}`);
      if (!collision) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return c.json({ error: 'Failed to generate unique invite code' }, 500);
    }

    // Get user profile for name
    const profile = await kv.get(`user:${user.id}`) || {};

    // Store new code
    await kv.set(`invite:${code}`, {
      userId: user.id,
      name: profile.name || 'User',
      createdAt: new Date().toISOString(),
    });
    await kv.set(`user-invite:${user.id}`, {
      code,
      createdAt: new Date().toISOString(),
    });

    console.log(`Regenerated invite code for user ${user.id}: ${code}`);

    return c.json({ code });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return c.json({ error: `Failed to regenerate invite code: ${error}` }, 500);
  }
});

// Get notification count for new matches
app.get("/make-server-5623fde1/notifications/matches", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`) || {};
    const lastSeen = profile.lastMatchesSeen || 0;

    // Get all matches — paginated (liked movies can exceed 1000)
    const userLikes = await getByPrefixPaginated(`like:${user.id}:`);
    if (!profile?.partnerId || userLikes.length === 0) {
      return c.json({ count: 0, hasNew: false });
    }

    const partnerLikes = await getByPrefixPaginated(`like:${profile.partnerId}:`);
    const partnerLikeIds = new Set(partnerLikes.map((like: any) => like.movieId));
    
    // Count new matches (liked after lastSeen timestamp)
    const newMatches = userLikes.filter((like: any) => {
      if (!partnerLikeIds.has(like.movieId)) return false;
      
      // Check if this is a new match (either user's like or partner's like is new)
      const likeTimestamp = like.timestamp || 0;
      const partnerLike = partnerLikes.find((pl: any) => pl.movieId === like.movieId);
      const partnerLikeTimestamp = partnerLike?.timestamp || 0;
      
      return Math.max(likeTimestamp, partnerLikeTimestamp) > lastSeen;
    });

    return c.json({ 
      count: newMatches.length,
      hasNew: newMatches.length > 0
    });
  } catch (error) {
    console.error('Error getting match notifications:', error);
    return c.json({ error: `Failed to get notifications: ${error}` }, 500);
  }
});

// Mark matches as seen
app.post("/make-server-5623fde1/notifications/matches/seen", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`) || {};
    profile.lastMatchesSeen = Date.now();
    await kv.set(`user:${user.id}`, profile);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking matches as seen:', error);
    return c.json({ error: `Failed to mark as seen: ${error}` }, 500);
  }
});

// Get notifications for user (with pagination for infinite scroll)
app.get("/make-server-5623fde1/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get all notifications for the user
    const notifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    // Sort by createdAt descending (newest first)
    const sorted = notifications.sort((a: any, b: any) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const paginated = sorted.slice(offset, offset + limit);
    
    // Clean up old read notifications (delete read notifications older than 10 days)
    const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (const notif of notifications) {
      if (notif.read && (now - notif.createdAt > TEN_DAYS)) {
        await kv.del(`notification:${user.id}:${notif.id}`);
      }
    }

    return c.json({ 
      notifications: paginated,
      hasMore: offset + limit < sorted.length,
      total: sorted.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: `Failed to fetch notifications: ${error}` }, 500);
  }
});

// Get unread notification count (fast - single KV read)
app.get("/make-server-5623fde1/notifications/unread-count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const count = await kv.get(`notifications:unread:${user.id}`) || 0;
    return c.json({ count: typeof count === 'number' ? count : 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return c.json({ error: `Failed to fetch unread count: ${error}` }, 500);
  }
});

// Mark single notification as read
app.post("/make-server-5623fde1/notifications/mark-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { notificationId } = await c.req.json();
    
    const notification = await kv.get(`notification:${user.id}:${notificationId}`);
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    // Mark as read
    if (!notification.read) {
      notification.read = true;
      await kv.set(`notification:${user.id}:${notificationId}`, notification);

      // Decrement unread count
      const current = await kv.get(`notifications:unread:${user.id}`) || 0;
      const newCount = Math.max(0, (typeof current === 'number' ? current : 0) - 1);
      await kv.set(`notifications:unread:${user.id}`, newCount);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: `Failed to mark as read: ${error}` }, 500);
  }
});

// Mark all notifications as read
app.post("/make-server-5623fde1/notifications/mark-all-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all notifications and mark them as read
    const notifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    for (const notification of notifications) {
      if (!notification.read) {
        notification.read = true;
        await kv.set(`notification:${user.id}:${notification.id}`, notification);
      }
    }

    // Reset unread count to 0
    await kv.set(`notifications:unread:${user.id}`, 0);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return c.json({ error: `Failed to mark all as read: ${error}` }, 500);
  }
});

// Clear all notifications
app.post("/make-server-5623fde1/notifications/clear-all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all notifications for the user and delete them
    const notifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    for (const notification of notifications) {
      await kv.del(`notification:${user.id}:${notification.id}`);
    }

    // Reset unread count to 0
    await kv.set(`notifications:unread:${user.id}`, 0);

    return c.json({ success: true, deleted: notifications.length });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return c.json({ error: `Failed to clear notifications: ${error}` }, 500);
  }
});

// Create import completion notification
app.post("/make-server-5623fde1/notifications/import-complete", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, imported, failed, total } = await c.req.json();

    await createNotification(user.id, 'import_complete', {
      importType: type,          // 'watchlist' or 'watched'
      importedCount: imported,
      failedCount: failed,
      totalCount: total,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error creating import notification:', error);
    return c.json({ error: `Failed to create notification: ${error}` }, 500);
  }
});

// Get partner info
app.get("/make-server-5623fde1/partner", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile?.partnerId) {
      return c.json({ partner: null });
    }

    const partnerProfile = await kv.get(`user:${profile.partnerId}`);
    const { data: partnerAuth } = await supabase.auth.admin.getUserById(profile.partnerId);

    return c.json({ 
      partner: {
        id: profile.partnerId,
        email: partnerAuth?.user?.email,
        ...partnerProfile
      }
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return c.json({ error: `Failed to fetch partner: ${error}` }, 500);
  }
});

// Search for users
app.get("/make-server-5623fde1/users/search", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q')?.toLowerCase();
    if (!query) {
      return c.json({ users: [] });
    }

    // Get all user search entries
    const searchEntries = await kv.getByPrefix('user:search:');
    
    // Filter users by email or name matching query
    const matches = searchEntries
      .filter((entry: any) => 
        entry.userId !== user.id && // Don't include current user
        (entry.email.toLowerCase().includes(query) || 
         entry.name?.toLowerCase().includes(query))
      )
      .slice(0, 10); // Limit to 10 results

    return c.json({ users: matches });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json({ error: `Failed to search users: ${error}` }, 500);
  }
});

// Like a movie
app.post("/make-server-5623fde1/movies/like", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movie } = await c.req.json();
    const timestamp = Date.now();
    
    // Store like with timestamp
    await kv.set(`liked:${user.id}:${movie.id}`, { ...movie, timestamp });
    await kv.set(`like:${user.id}:${movie.id}`, { movieId: movie.id, timestamp });

    // Check for match with partner
    const profile = await kv.get(`user:${user.id}`);
    let isMatch = false;

    if (profile?.partnerId) {
      const partnerLike = await kv.get(`liked:${profile.partnerId}:${movie.id}`);
      if (partnerLike) {
        isMatch = true;
        await kv.set(`match:${user.id}:${movie.id}`, { ...movie, timestamp });
        await kv.set(`match:${profile.partnerId}:${movie.id}`, { ...movie, timestamp });

        // Create match notifications for both users
        const partnerProfile = await kv.get(`user:${profile.partnerId}`) || {};
        const currentUserProfile = await kv.get(`user:${user.id}`) || {};

        // Notification for current user
        await createNotification(user.id, 'movie_match', {
          fromUserId: profile.partnerId,
          fromName: partnerProfile.name || 'Your partner',
          movieId: movie.id,
          movieTitle: movie.title || movie.name || 'Unknown Movie',
          posterPath: movie.poster_path || null,
        });

        // Notification for partner
        await createNotification(profile.partnerId, 'movie_match', {
          fromUserId: user.id,
          fromName: currentUserProfile.name || 'Your partner',
          movieId: movie.id,
          movieTitle: movie.title || movie.name || 'Unknown Movie',
          posterPath: movie.poster_path || null,
        });

        // Check for milestone (5, 10, 25 matches) — paginated for future scale
        const allMatches = await getByPrefixPaginated(`match:${user.id}:`);
        const matchCount = allMatches.length;
        const milestones = [5, 10, 25];

        if (milestones.includes(matchCount)) {
          console.log(`🎉 Milestone reached: ${matchCount} matches for user ${user.id}!`);

          // Create milestone notifications for both users
          await createNotification(user.id, 'match_milestone', {
            fromUserId: profile.partnerId,
            fromName: partnerProfile.name || 'Your partner',
            milestoneCount: matchCount,
          });

          await createNotification(profile.partnerId, 'match_milestone', {
            fromUserId: user.id,
            fromName: currentUserProfile.name || 'Your partner',
            milestoneCount: matchCount,
          });
        }
      }
    }

    return c.json({ success: true, isMatch });
  } catch (error) {
    console.error('Error liking movie:', error);
    return c.json({ error: `Failed to like movie: ${error}` }, 500);
  }
});

// Unlike a movie
app.delete("/make-server-5623fde1/movies/like/:movieId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const movieId = c.req.param('movieId');
    await kv.del(`liked:${user.id}:${movieId}`);
    await kv.del(`match:${user.id}:${movieId}`);

    const profile = await kv.get(`user:${user.id}`);
    if (profile?.partnerId) {
      await kv.del(`match:${profile.partnerId}:${movieId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unliking movie:', error);
    return c.json({ error: `Failed to unlike movie: ${error}` }, 500);
  }
});

// Dislike a movie
app.post("/make-server-5623fde1/movies/dislike", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movieId } = await c.req.json();
    await kv.set(`disliked:${user.id}:${movieId}`, { movieId, timestamp: Date.now() });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error disliking movie:', error);
    return c.json({ error: `Failed to dislike movie: ${error}` }, 500);
  }
});

// Get disliked movies
app.get("/make-server-5623fde1/movies/disliked", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const disliked = await kv.getByPrefix(`disliked:${user.id}:`);
    const movieIds = disliked.map((d: any) => d.movieId);
    return c.json({ movieIds });
  } catch (error) {
    console.error('Error fetching disliked movies:', error);
    return c.json({ error: `Failed to fetch disliked movies: ${error}` }, 500);
  }
});

// Get liked movies
app.get("/make-server-5623fde1/movies/liked", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Paginated — users can have 1000+ liked movies
    const liked = await getByPrefixPaginated(`liked:${user.id}:`);
    
    // Attach IMDb ratings to movies
    const moviesWithImdb = await Promise.all(
      liked.map(async (movie: any) => {
        const imdbRating = await kv.get(`imdb_rating:${movie.id}`);
        return {
          ...movie,
          imdbRating: imdbRating?.rating || null
        };
      })
    );
    
    return c.json({ movies: moviesWithImdb });
  } catch (error) {
    console.error('Error fetching liked movies:', error);
    return c.json({ error: `Failed to fetch liked movies: ${error}` }, 500);
  }
});

// Get partner's liked movies
app.get("/make-server-5623fde1/movies/partner-liked", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get current user's profile to find partner
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile?.partnerId) {
      return c.json({ error: 'No partner connected' }, 404);
    }

    // Get partner's liked movies (paginated — may exceed 1000)
    const partnerLiked = await getByPrefixPaginated(`liked:${userProfile.partnerId}:`);
    
    // Attach IMDb ratings to partner's movies
    const moviesWithImdb = await Promise.all(
      partnerLiked.map(async (movie: any) => {
        const imdbRating = await kv.get(`imdb_rating:${movie.id}`);
        return {
          ...movie,
          imdbRating: imdbRating?.rating || null
        };
      })
    );
    
    // Get partner's profile for name
    const partnerProfile = await kv.get(`user:${userProfile.partnerId}`);
    
    return c.json({ 
      movies: moviesWithImdb,
      partnerName: partnerProfile?.name || 'Your Partner'
    });
  } catch (error) {
    console.error('Error fetching partner liked movies:', error);
    return c.json({ error: `Failed to fetch partner liked movies: ${error}` }, 500);
  }
});

// Get matched movies
app.get("/make-server-5623fde1/movies/matches", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const matches = await getByPrefixPaginated(`match:${user.id}:`);
    return c.json({ movies: matches });
  } catch (error) {
    console.error('Error fetching matched movies:', error);
    return c.json({ error: `Failed to fetch matched movies: ${error}` }, 500);
  }
});

// Import movies from Letterboxd/IMDb CSV
app.post("/make-server-5623fde1/movies/import", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movies } = await c.req.json(); // Array of { name, year }
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
    
    if (!tmdbApiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    // Pre-fetch user profile once (for partner match checking)
    const userProfile = await kv.get(`user:${user.id}`);
    const partnerId = userProfile?.partnerId;

    const results = {
      total: movies.length,
      imported: 0,
      failed: [] as string[],
    };

    // Process movies with concurrency limit (5 parallel requests)
    const settled = await pMap(movies, async (movie: any) => {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movie.name)}&year=${movie.year}&api_key=${tmdbApiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        throw new Error(`NOT_FOUND:${movie.name}`);
      }

      const tmdbMovie = searchData.results[0];

      // Store liked movie
      await kv.set(`liked:${user.id}:${tmdbMovie.id}`, tmdbMovie);

      // Check for partner match
      if (partnerId) {
        const partnerLiked = await kv.get(`liked:${partnerId}:${tmdbMovie.id}`);
        if (partnerLiked) {
          await kv.set(`match:${user.id}:${tmdbMovie.id}`, tmdbMovie);
          await kv.set(`match:${partnerId}:${tmdbMovie.id}`, tmdbMovie);
        }
      }

      return tmdbMovie.id;
    }, 5);

    // Tally results
    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      if (result.status === 'fulfilled') {
        results.imported++;
      } else {
        const msg = result.reason?.message || '';
        if (msg.startsWith('NOT_FOUND:')) {
          results.failed.push(msg.replace('NOT_FOUND:', ''));
        } else {
          console.error(`Error importing ${movies[i].name}:`, result.reason);
          results.failed.push(movies[i].name);
        }
      }
    }

    return c.json({ success: true, results });
  } catch (error) {
    console.error('Error importing movies:', error);
    return c.json({ error: `Failed to import movies: ${error}` }, 500);
  }
});

// Add watched movie
app.post("/make-server-5623fde1/movies/watched", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movie, rating } = await c.req.json();
    
    if (!movie || !movie.id) {
      console.error('Invalid movie data for watched - missing id:', movie);
      return c.json({ error: 'Movie ID is required' }, 400);
    }

    // ── Guarantee numeric id ──────────────────────────────────────────────────
    // The client always sends a numeric TMDb id, but JSON round-trips and
    // template-literal coercions can occasionally produce a string. Storing a
    // string id causes both `interactions/all` and `discover-filtered` to
    // silently drop the entry (their `typeof id === 'number'` guards reject it),
    // so the movie re-appears as unwatched after a page refresh.
    const numericId = Number(movie.id);
    if (!numericId || isNaN(numericId)) {
      console.error(`Invalid movie id (not coercible to number): ${movie.id} (type: ${typeof movie.id})`);
      return c.json({ error: 'Movie ID must be a valid number' }, 400);
    }

    // Sanitize movie data - only store essential fields to avoid KV bloat
    const sanitizedMovie = {
      id: numericId,                          // always a JS number
      title: movie.title || '',
      poster_path: movie.poster_path || null,
      backdrop_path: movie.backdrop_path || null,
      overview: movie.overview || '',
      release_date: movie.release_date || null,
      vote_average: movie.vote_average || 0,
      genre_ids: movie.genre_ids || [],
      genres: movie.genres || [],
      runtime: movie.runtime || null,
      director: movie.director || null,
      actors: movie.actors || [],
      original_language: movie.original_language || null,
    };

    await kv.set(`watched:${user.id}:${numericId}`, { 
      ...sanitizedMovie, 
      rating: rating || null,
      timestamp: Date.now() 
    });

    console.log(`Stored watched movie ${numericId} ("${movie.title}") for user ${user.id} [id type: ${typeof numericId}]`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error adding watched movie:', error);
    return c.json({ error: `Failed to add watched movie: ${error}` }, 500);
  }
});

// Get watched movies
app.get("/make-server-5623fde1/movies/watched", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Paginated — users can have 1000+ watched movies
    const watched = await getByPrefixPaginated(`watched:${user.id}:`);
    console.log(`Fetched ${watched.length} watched movies for user ${user.id}`);
    return c.json({ movies: watched });
  } catch (error) {
    console.error('Error fetching watched movies:', error);
    return c.json({ error: `Failed to fetch watched movies: ${error}` }, 500);
  }
});

// Delete watched movie
app.delete("/make-server-5623fde1/movies/watched/:movieId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const movieId = c.req.param('movieId');
    await kv.del(`watched:${user.id}:${movieId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing watched movie:', error);
    return c.json({ error: `Failed to remove watched movie: ${error}` }, 500);
  }
});

// Import watched movies from Letterboxd
app.post("/make-server-5623fde1/movies/import-watched", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const { movies } = await c.req.json();
    const results = { imported: 0, failed: 0, errors: [] as string[] };

    // Process movies with concurrency limit (5 parallel requests)
    const settled = await pMap(movies, async (movieData: any) => {
      const { title, year } = movieData;

      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        throw new Error(`NOT_FOUND:${title} (${year})`);
      }

      const movie = searchData.results[0];

      // Mark as watched
      await kv.set(`watched:${user.id}:${movie.id}`, {
        ...movie,
        timestamp: Date.now()
      });

      return movie.id;
    }, 5);

    // Tally results
    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      if (result.status === 'fulfilled') {
        results.imported++;
      } else {
        results.failed++;
        const msg = result.reason?.message || '';
        if (msg.startsWith('NOT_FOUND:')) {
          results.errors.push(`Movie not found: ${msg.replace('NOT_FOUND:', '')}`);
        } else {
          results.errors.push(`Error importing ${movies[i].title}: ${result.reason}`);
        }
      }
    }

    return c.json({ success: true, results });
  } catch (error) {
    console.error('Error importing watched movies:', error);
    return c.json({ error: `Failed to import watched movies: ${error}` }, 500);
  }
});

// Fetch movies from TMDb
app.get("/make-server-5623fde1/movies/discover", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const page = c.req.query('page') || '1';
    const genre = c.req.query('genre');
    const year = c.req.query('year');
    const minRating = c.req.query('minRating');
    const director = c.req.query('director');
    const actor = c.req.query('actor');
    const language = c.req.query('language');
    const duration = c.req.query('duration');
    const sortBy = c.req.query('sortBy') || 'popularity';
    const streamingServices = c.req.query('streamingServices'); // pipe-separated list

    // Map frontend sort values to TMDb sort_by values
    let tmdbSortBy = 'popularity.desc';
    if (sortBy === 'rating') {
      tmdbSortBy = 'vote_average.desc';
    } else if (sortBy === 'year-new' || sortBy === 'year-desc') {
      tmdbSortBy = 'primary_release_date.desc';
    } else if (sortBy === 'year-old' || sortBy === 'year-asc') {
      tmdbSortBy = 'primary_release_date.asc';
    }

    // If director or actor is specified, we need to first find their person ID
    let withCrew = '';
    let withCast = '';

    if (director) {
      const personSearchUrl = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(director)}`;
      const personResponse = await fetch(personSearchUrl);
      const personData = await personResponse.json();
      if (personData.results && personData.results.length > 0) {
        const directorId = personData.results[0].id;
        withCrew = `${directorId}`;
      }
    }

    if (actor) {
      const personSearchUrl = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actor)}`;
      const personResponse = await fetch(personSearchUrl);
      const personData = await personResponse.json();
      if (personData.results && personData.results.length > 0) {
        const actorId = personData.results[0].id;
        withCast = `${actorId}`;
      }
    }

    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=${page}&sort_by=${tmdbSortBy}`;
    
    if (genre) url += `&with_genres=${genre}`;
    if (year) url += `&primary_release_year=${year}`;
    if (minRating) url += `&vote_average.gte=${minRating}`;
    if (withCrew) url += `&with_crew=${withCrew}`;
    if (withCast) url += `&with_cast=${withCast}`;
    if (language) url += `&with_original_language=${language}`;
    
    // Apply streaming services filter
    if (streamingServices) {
      url += `&with_watch_providers=${streamingServices}`;
      url += `&watch_region=US`; // Default to US region
    }
    
    // Apply duration filters
    // Short: 0-40 mins, Mid-Length: 41-79 mins, Feature: 80-120 mins, Epic: 120+ mins
    if (duration && duration !== 'all') {
      if (duration === 'short') {
        url += `&with_runtime.lte=40`;
      } else if (duration === 'medium') {
        url += `&with_runtime.gte=41&with_runtime.lte=79`;
      } else if (duration === 'feature') {
        url += `&with_runtime.gte=80&with_runtime.lte=120`;
      } else if (duration === 'epic') {
        url += `&with_runtime.gte=121`;
      }
    }
    
    // Only show released movies (release date is today or earlier)
    const today = new Date().toISOString().split('T')[0];
    url += `&primary_release_date.lte=${today}`;
    
    // Add minimum vote count to filter out unreleased/obscure movies
    url += `&vote_count.gte=10`;

    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error discovering movies:', error);
    return c.json({ error: `Failed to discover movies: ${error}` }, 500);
  }
});

// Search movies
app.get("/make-server-5623fde1/movies/search", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const query = c.req.query('q');
    if (!query) {
      return c.json({ error: 'Query parameter required' }, 400);
    }

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error searching movies:', error);
    return c.json({ error: `Failed to search movies: ${error}` }, 500);
  }
});

// Get movie details (specific endpoint for getting IMDb ID)
app.get("/make-server-5623fde1/movies/:id/details", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const movieId = c.req.param('id');
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return c.json({ error: `Failed to fetch movie details: ${error}` }, 500);
  }
});

// Get genres
app.get("/make-server-5623fde1/genres", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return c.json({ error: `Failed to fetch genres: ${error}` }, 500);
  }
});

// Search for people (directors/actors)
app.get("/make-server-5623fde1/search/people", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const query = c.req.query('query');
    if (!query) {
      return c.json({ error: 'Query parameter is required' }, 400);
    }

    const url = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error searching people:', error);
    return c.json({ error: `Failed to search people: ${error}` }, 500);
  }
});

// Get IMDb rating for a movie (with caching)
app.get("/make-server-5623fde1/movies/:movieId/imdb", async (c) => {
  try {
    const movieId = c.req.param('movieId');
    const omdbApiKey = Deno.env.get('OMDB_API_KEY');

    if (!omdbApiKey) {
      console.error('OMDb API key not configured');
      return c.json({ error: 'OMDb API key not configured' }, 500);
    }

    // Check cache first
    const cached = await kv.get(`imdb_rating:${movieId}`);
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (cached && cached.timestamp && (Date.now() - cached.timestamp < ONE_MONTH)) {
      // Return cached rating if less than 30 days old
      return c.json({ imdbRating: cached.rating, cached: true });
    }

    // Fetch from OMDb API
    // First, get the IMDb ID from TMDb
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
    if (!tmdbApiKey) {
      console.error('TMDb API key not configured');
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const tmdbUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}`;
    const tmdbResponse = await fetch(tmdbUrl);
    
    if (!tmdbResponse.ok) {
      console.error(`TMDb API error: ${tmdbResponse.status}`);
      return c.json({ error: 'Failed to fetch movie details from TMDb' }, 500);
    }
    
    const tmdbData = await tmdbResponse.json();

    if (!tmdbData.imdb_id) {
      console.log(`No IMDb ID found for movie ${movieId}`);
      return c.json({ error: 'IMDb ID not found for this movie' }, 404);
    }

    // Fetch from OMDb
    const omdbUrl = `https://www.omdbapi.com/?i=${tmdbData.imdb_id}&apikey=${omdbApiKey}`;
    const omdbResponse = await fetch(omdbUrl);
    
    if (!omdbResponse.ok) {
      console.error(`OMDb API HTTP error: ${omdbResponse.status}`);
      return c.json({ error: 'OMDb API request failed' }, 500);
    }

    // Check if response is JSON
    const contentType = omdbResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await omdbResponse.text();
      console.error(`OMDb API returned non-JSON response: ${text.substring(0, 200)}`);
      return c.json({ error: 'Invalid response from OMDb API' }, 500);
    }

    const omdbData = await omdbResponse.json();

    if (omdbData.Response === 'False') {
      console.log(`OMDb error for ${tmdbData.imdb_id}: ${omdbData.Error}`);
      return c.json({ error: omdbData.Error || 'IMDb rating not available' }, 404);
    }

    if (!omdbData.imdbRating || omdbData.imdbRating === 'N/A') {
      console.log(`No IMDb rating available for movie ${movieId}`);
      return c.json({ error: 'IMDb rating not available' }, 404);
    }

    // Cache the rating
    await kv.set(`imdb_rating:${movieId}`, {
      rating: omdbData.imdbRating,
      timestamp: Date.now()
    });

    return c.json({ imdbRating: omdbData.imdbRating, cached: false });
  } catch (error) {
    console.error(`Error fetching IMDb rating for movie ${c.req.param('movieId')}:`, error);
    return c.json({ error: `Failed to fetch IMDb rating: ${error}` }, 500);
  }
});

// Get IMDb rating by IMDb ID (for movie detail modal)
app.get("/make-server-5623fde1/omdb/rating/:imdbId", async (c) => {
  try {
    const imdbId = c.req.param('imdbId');
    const omdbApiKey = Deno.env.get('OMDB_API_KEY');

    if (!omdbApiKey) {
      console.error('OMDb API key not configured');
      return c.json({ error: 'OMDb API key not configured' }, 500);
    }

    // Check cache first (cache by IMDb ID instead of movie ID)
    const cached = await kv.get(`imdb_rating_by_id:${imdbId}`);
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (cached && cached.timestamp && (Date.now() - cached.timestamp < ONE_MONTH)) {
      // Return cached rating if less than 30 days old
      return c.json({ 
        imdbRating: cached.imdbRating,
        imdbVotes: cached.imdbVotes,
        cached: true 
      });
    }

    // Fetch from OMDb
    const omdbUrl = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`;
    const omdbResponse = await fetch(omdbUrl);
    
    if (!omdbResponse.ok) {
      console.error(`OMDb API HTTP error: ${omdbResponse.status}`);
      return c.json({ error: 'OMDb API request failed' }, 500);
    }

    // Check if response is JSON
    const contentType = omdbResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await omdbResponse.text();
      console.error(`OMDb API returned non-JSON response: ${text.substring(0, 200)}`);
      return c.json({ error: 'Invalid response from OMDb API' }, 500);
    }

    const omdbData = await omdbResponse.json();

    if (omdbData.Response === 'False') {
      console.log(`OMDb error for ${imdbId}: ${omdbData.Error}`);
      return c.json({ error: omdbData.Error || 'IMDb rating not available' }, 404);
    }

    if (!omdbData.imdbRating || omdbData.imdbRating === 'N/A') {
      console.log(`No IMDb rating available for ${imdbId}`);
      return c.json({ error: 'IMDb rating not available' }, 404);
    }

    // Cache the rating
    await kv.set(`imdb_rating_by_id:${imdbId}`, {
      imdbRating: omdbData.imdbRating,
      imdbVotes: omdbData.imdbVotes || 'N/A',
      timestamp: Date.now()
    });

    return c.json({ 
      imdbRating: omdbData.imdbRating, 
      imdbVotes: omdbData.imdbVotes || 'N/A',
      cached: false 
    });
  } catch (error) {
    console.error(`Error fetching IMDb rating for ${c.req.param('imdbId')}:`, error);
    return c.json({ error: `Failed to fetch IMDb rating: ${error}` }, 500);
  }
});

// NEW: Bulk fetch cached IMDb ratings by TMDb IDs
app.get("/make-server-5623fde1/imdb-ratings/bulk", async (c) => {
  try {
    const tmdbIdsParam = c.req.query('tmdbIds');
    
    if (!tmdbIdsParam) {
      return c.json({ error: 'tmdbIds parameter required' }, 400);
    }

    const tmdbIds = tmdbIdsParam.split(',').map(id => id.trim()).filter(id => id);
    
    if (tmdbIds.length === 0) {
      return c.json([]);
    }

    const ratings = [];
    
    // Fetch each cached rating, skipping any key that fails due to transient errors
    for (const tmdbId of tmdbIds) {
      const key = `imdb:${tmdbId}`;
      try {
        const cached = await kv.get(key);
        if (cached) {
          ratings.push({
            tmdbId: parseInt(tmdbId),
            ...cached
          });
        }
      } catch (keyError) {
        // Log and skip — one bad key should not abort the whole batch
        console.error(`Bulk fetch: failed to get key ${key}:`, keyError);
      }
    }

    console.log(`Bulk fetch: ${ratings.length}/${tmdbIds.length} cached ratings found`);
    return c.json(ratings);
  } catch (error) {
    console.error('Error in bulk fetch IMDb ratings:', error);
    return c.json({ error: `Failed to fetch cached ratings: ${error}` }, 500);
  }
});

// NEW: Store IMDb rating in cache
app.post("/make-server-5623fde1/imdb-ratings/store", async (c) => {
  try {
    const { tmdbId, imdbId, rating, votes } = await c.req.json();

    if (!tmdbId || !imdbId) {
      return c.json({ error: 'tmdbId and imdbId are required' }, 400);
    }

    const key = `imdb:${tmdbId}`;
    const value = {
      imdbId,
      tmdbId,
      rating,
      votes,
      fetchedAt: new Date().toISOString()
    };

    await kv.set(key, value);
    console.log(`Stored IMDb rating for TMDb ${tmdbId}: ${rating}`);

    return c.json(value);
  } catch (error) {
    console.error('Error storing IMDb rating:', error);
    return c.json({ error: `Failed to store rating: ${error}` }, 500);
  }
});

// NEW: Fetch and store IMDb rating (combines fetch + store)
app.post("/make-server-5623fde1/imdb-ratings/fetch-and-store", async (c) => {
  try {
    const { tmdbId, imdbId, releaseDate } = await c.req.json();

    if (!tmdbId || !imdbId) {
      return c.json({ error: 'tmdbId and imdbId are required' }, 400);
    }

    const omdbApiKey = Deno.env.get('OMDB_API_KEY');
    if (!omdbApiKey) {
      return c.json({ error: 'OMDb API key not configured' }, 500);
    }

    // Check if we should skip due to recent error
    const errorKey = `imdb:error:${tmdbId}`;
    const errorCache = await kv.get(errorKey);
    if (errorCache && errorCache.retryAfter && Date.now() < errorCache.retryAfter) {
      console.log(`Skipping ${tmdbId} - retry after ${new Date(errorCache.retryAfter).toISOString()}`);
      return c.json({ error: 'Recent error, retry later', retryAfter: errorCache.retryAfter }, 429);
    }

    // Check cache first
    const cacheKey = `imdb:${tmdbId}`;
    const cached = await kv.get(cacheKey);
    
    // Cache invalidation logic
    if (cached?.fetchedAt) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      const WEEK = 7 * 24 * 60 * 60 * 1000;
      const MONTH = 30 * 24 * 60 * 60 * 1000;
      
      // Check if movie is recent
      const releaseAge = releaseDate ? Date.now() - new Date(releaseDate).getTime() : Infinity;
      const isRecentMovie = releaseAge < 6 * MONTH;
      
      // If cache is still fresh, return it
      if ((isRecentMovie && age < WEEK) || (!isRecentMovie && age < MONTH)) {
        console.log(`Using fresh cache for ${tmdbId}`);
        return c.json({ ...cached, fromCache: true });
      }
    }

    // Track API usage (daily limit)
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `omdb:usage:${today}`;
    const usage = await kv.get(usageKey);
    const currentUsage = usage?.count || 0;

    if (currentUsage >= 1000) {
      console.error('Daily OMDb API limit reached');
      return c.json({ error: 'Daily API limit reached' }, 429);
    }

    // Fetch from OMDb
    const omdbUrl = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`;
    const omdbResponse = await fetch(omdbUrl);
    
    // Increment usage counter
    await kv.set(usageKey, { count: currentUsage + 1, date: today });

    if (!omdbResponse.ok) {
      console.error(`OMDb API HTTP error: ${omdbResponse.status}`);
      
      // Store error to prevent immediate retry
      await kv.set(errorKey, {
        error: true,
        lastAttempt: new Date().toISOString(),
        retryAfter: Date.now() + (24 * 60 * 60 * 1000) // Retry after 24h
      });
      
      return c.json({ error: 'OMDb API request failed' }, 500);
    }

    const omdbData = await omdbResponse.json();

    if (omdbData.Response === 'False') {
      console.log(`OMDb error for ${imdbId}: ${omdbData.Error}`);
      
      // Store error
      await kv.set(errorKey, {
        error: true,
        errorMessage: omdbData.Error,
        lastAttempt: new Date().toISOString(),
        retryAfter: Date.now() + (24 * 60 * 60 * 1000)
      });
      
      return c.json({ error: omdbData.Error || 'IMDb rating not available' }, 404);
    }

    if (!omdbData.imdbRating || omdbData.imdbRating === 'N/A') {
      return c.json({ error: 'IMDb rating not available' }, 404);
    }

    // Store in cache
    const value = {
      imdbId,
      tmdbId,
      rating: omdbData.imdbRating,
      votes: omdbData.imdbVotes || 'N/A',
      fetchedAt: new Date().toISOString()
    };

    await kv.set(cacheKey, value);
    
    // Clear any error cache
    await kv.del(errorKey);

    console.log(`Fetched and stored IMDb rating for TMDb ${tmdbId}: ${value.rating}`);
    return c.json({ ...value, fromCache: false });
    
  } catch (error) {
    console.error('Error fetching and storing IMDb rating:', error);
    return c.json({ error: `Failed to fetch rating: ${error}` }, 500);
  }
});

// Bulk update IMDb ratings for user's saved movies
app.post("/make-server-5623fde1/movies/update-imdb-ratings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const omdbApiKey = Deno.env.get('OMDB_API_KEY');
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

    if (!omdbApiKey || !tmdbApiKey) {
      return c.json({ error: 'API keys not configured' }, 500);
    }

    // Get user's liked movies — paginated
    const likedMovies = await getByPrefixPaginated(`liked:${user.id}:`);
    
    const results = {
      total: likedMovies.length,
      updated: 0,
      failed: 0
    };

    // Update IMDb ratings for each movie
    for (const movie of likedMovies) {
      try {
        // Get TMDb details for IMDb ID
        const tmdbUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}`;
        const tmdbResponse = await fetch(tmdbUrl);
        const tmdbData = await tmdbResponse.json();

        if (!tmdbData.imdb_id) {
          results.failed++;
          continue;
        }

        // Fetch from OMDb
        const omdbUrl = `https://www.omdbapi.com/?i=${tmdbData.imdb_id}&apikey=${omdbApiKey}`;
        const omdbResponse = await fetch(omdbUrl);
        const omdbData = await omdbResponse.json();

        if (omdbData.Response === 'True' && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
          // Cache the rating
          await kv.set(`imdb_rating:${movie.id}`, {
            rating: omdbData.imdbRating,
            timestamp: Date.now()
          });
          results.updated++;
        } else {
          results.failed++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error updating IMDb rating for movie ${movie.id}:`, error);
        results.failed++;
      }
    }

    return c.json({ success: true, results });
  } catch (error) {
    console.error('Error bulk updating IMDb ratings:', error);
    return c.json({ error: `Failed to update IMDb ratings: ${error}` }, 500);
  }
});

// Mark movie as not interested
app.post("/make-server-5623fde1/movies/not-interested", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movieId } = await c.req.json();
    const key = `notinterested:${user.id}:${movieId}`;
    
    await kv.set(key, {
      movieId: movieId,
      timestamp: Date.now()
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking movie as not interested:', error);
    return c.json({ error: `Failed to mark as not interested: ${error}` }, 500);
  }
});

// Remove not interested status
app.delete("/make-server-5623fde1/movies/not-interested/:movieId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const movieId = c.req.param('movieId');
    await kv.del(`notinterested:${user.id}:${movieId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing not interested status:', error);
    return c.json({ error: `Failed to remove not interested status: ${error}` }, 500);
  }
});

// Get all excluded movie IDs (watched + not interested)
app.get("/make-server-5623fde1/movies/excluded-ids", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const includeWatched = c.req.query('includeWatched') === 'true';
    
    let excludedIds: number[] = [];
    
    // Always exclude "not interested" movies.
    // Use key-only lookup: key format is "notinterested:{userId}:{movieId}"
    const notInterestedKeys = await getKeysByPrefixPaginated(`notinterested:${user.id}:`);
    const notInterestedIds = notInterestedKeys
      .map(key => Number(key.split(':').pop()))
      .filter((id: number) => id > 0 && !isNaN(id));
    excludedIds = [...notInterestedIds];
    
    // Optionally exclude watched movies (default: exclude them).
    // Key format is "watched:{userId}:{movieId}" — extract ID from suffix.
    if (!includeWatched) {
      const watchedKeys = await getKeysByPrefixPaginated(`watched:${user.id}:`);
      const watchedIds = watchedKeys
        .map(key => Number(key.split(':').pop()))
        .filter((id: number) => id > 0 && !isNaN(id));
      excludedIds = [...excludedIds, ...watchedIds];
    }
    
    // Remove duplicates
    const uniqueExcludedIds = [...new Set(excludedIds)];
    
    return c.json({ 
      excludedIds: uniqueExcludedIds,
      count: uniqueExcludedIds.length 
    });
  } catch (error) {
    console.error('Error fetching excluded IDs:', error);
    return c.json({ error: `Failed to fetch excluded IDs: ${error}` }, 500);
  }
});

// Get user interactions for specific movies (bulk lookup)
app.post("/make-server-5623fde1/movies/interactions", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { movieIds } = await c.req.json();
    
    if (!Array.isArray(movieIds)) {
      return c.json({ error: 'movieIds must be an array' }, 400);
    }

    const interactions = await Promise.all(
      movieIds.map(async (movieId: number) => {
        const [watched, notInterested] = await Promise.all([
          kv.get(`watched:${user.id}:${movieId}`),
          kv.get(`notinterested:${user.id}:${movieId}`)
        ]);

        return {
          movieId,
          isWatched: !!watched,
          isNotInterested: !!notInterested,
          watchedAt: watched?.timestamp || null
        };
      })
    );

    return c.json({ interactions });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return c.json({ error: `Failed to fetch interactions: ${error}` }, 500);
  }
});

// Get ALL user interactions (watched + not interested) for the current user
app.get("/make-server-5623fde1/movies/interactions/all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const interactions: any[] = [];

    // Fetch all watched movies — paginated (users can have 1000+ entries)
    const watchedItems = await getByPrefixPaginated(`watched:${user.id}:`);
    console.log(`interactions/all: Found ${watchedItems.length} watched items for user ${user.id}`);
    
    for (const item of watchedItems) {
      // ── Robust id coercion ─────────────────────────────────────────────────
      // Older KV entries or edge cases may have stored the id as a string.
      // Number() handles both 1234 and "1234" safely; NaN / 0 are rejected.
      const rawId = item.id ?? item.tmdbId;
      const tmdbId = Number(rawId);
      if (!tmdbId || isNaN(tmdbId)) {
        console.error(`interactions/all: Skipping watched item with invalid id: ${JSON.stringify(rawId)} (item keys: ${Object.keys(item).join(', ')})`);
        continue;
      }
      {
        const existing = interactions.find((i: any) => i.tmdbId === tmdbId);
        if (existing) {
          existing.isWatched = true;
          existing.watchedAt = item.timestamp ? new Date(item.timestamp).toISOString() : null;
        } else {
          interactions.push({
            tmdbId,
            isWatched: true,
            isNotInterested: false,
            watchedAt: item.timestamp ? new Date(item.timestamp).toISOString() : null,
            notInterestedAt: null,
          });
        }
      }
    }

    // Fetch all not-interested movies — paginated for safety
    const notInterestedItems = await getByPrefixPaginated(`notinterested:${user.id}:`);
    console.log(`interactions/all: Found ${notInterestedItems.length} not-interested items for user ${user.id}`);
    
    for (const item of notInterestedItems) {
      const tmdbId = Number(item.movieId ?? item.id);
      if (!tmdbId || isNaN(tmdbId)) continue;
      {
        const existing = interactions.find((i: any) => i.tmdbId === tmdbId);
        if (existing) {
          existing.isNotInterested = true;
          existing.notInterestedAt = item.timestamp ? new Date(item.timestamp).toISOString() : null;
        } else {
          interactions.push({
            tmdbId,
            isWatched: false,
            isNotInterested: true,
            watchedAt: null,
            notInterestedAt: item.timestamp ? new Date(item.timestamp).toISOString() : null,
          });
        }
      }
    }

    console.log(`interactions/all: Returning ${interactions.length} total interactions`);
    return c.json({ interactions });
  } catch (error) {
    console.error('Error fetching all user interactions:', error);
    return c.json({ error: `Failed to fetch all interactions: ${error}` }, 500);
  }
});

// Server-side filtered movie discovery (Phase 2)
// Returns exactly 20 unwatched/non-excluded movies by fetching multiple pages if needed
app.get("/make-server-5623fde1/movies/discover-filtered", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    // Get query parameters
    const requestedPage = parseInt(c.req.query('page') || '1');
    const genre = c.req.query('genre');
    const minRating = c.req.query('minRating');
    const director = c.req.query('director');
    const actor = c.req.query('actor');
    const language = c.req.query('language');
    const duration = c.req.query('duration');
    const year = c.req.query('year');
    const decade = c.req.query('decade'); // e.g., "2020-2029"
    const sortBy = c.req.query('sortBy') || 'popularity.desc';
    const includeWatched = c.req.query('includeWatched') === 'true';

    // Get excluded movie IDs
    let excludedIds: number[] = [];
    
    // Always exclude "not interested" movies.
    // Key-only lookup is cheaper and handles any scale: "notinterested:{userId}:{movieId}"
    const notInterestedKeys = await getKeysByPrefixPaginated(`notinterested:${user.id}:`);
    const notInterestedIds = notInterestedKeys
      .map(key => Number(key.split(':').pop()))
      .filter((id: number) => id > 0 && !isNaN(id));
    excludedIds = [...notInterestedIds];
    
    // Optionally exclude watched movies (default: exclude them).
    // Key format: "watched:{userId}:{movieId}" — extract ID from key suffix.
    // Key-only lookup avoids fetching full movie objects (megabytes of JSON) just
    // for the ID field — much cheaper for users with 1000+ watched movies.
    if (!includeWatched) {
      const watchedKeys = await getKeysByPrefixPaginated(`watched:${user.id}:`);
      const watchedIds = watchedKeys
        .map(key => Number(key.split(':').pop()))
        .filter((id: number) => id > 0 && !isNaN(id));
      excludedIds = [...excludedIds, ...watchedIds];
      console.log(`discover-filtered: Loaded ${watchedIds.length} watched ids to exclude for user ${user.id}`);
    }
    
    const excludedSet = new Set(excludedIds);
    console.log(`Excluding ${excludedIds.length} movies for user ${user.id}`);

    // Resolve director/actor names to TMDb person IDs
    let withCrew = '';
    let withCast = '';
    const streamingServices = c.req.query('streamingServices');

    if (director) {
      try {
        const personSearchUrl = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(director)}`;
        const personResponse = await fetch(personSearchUrl);
        const personData = await personResponse.json();
        if (personData.results && personData.results.length > 0) {
          withCrew = `${personData.results[0].id}`;
        }
      } catch (e) {
        console.error('Error searching director:', e);
      }
    }

    if (actor) {
      try {
        const personSearchUrl = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actor)}`;
        const personResponse = await fetch(personSearchUrl);
        const personData = await personResponse.json();
        if (personData.results && personData.results.length > 0) {
          withCast = `${personData.results[0].id}`;
        }
      } catch (e) {
        console.error('Error searching actor:', e);
      }
    }

    // Build TMDb API URL
    const buildTmdbUrl = (page: number) => {
      const params = new URLSearchParams({
        api_key: apiKey,
        page: page.toString(),
        include_adult: 'false',
        'vote_count.gte': '100' // Minimum vote count for quality
      });

      if (genre && genre !== 'all') params.append('with_genres', genre);
      if (minRating && minRating !== 'all') params.append('vote_average.gte', minRating);
      if (year) {
        params.append('primary_release_year', year);
      } else if (decade) {
        // Decade format: "2020-2029" → use date range for full decade coverage
        const [startYear, endYear] = decade.split('-');
        if (startYear && endYear) {
          params.append('primary_release_date.gte', `${startYear}-01-01`);
          params.append('primary_release_date.lte', `${endYear}-12-31`);
        }
      }
      if (language) params.append('with_original_language', language);
      if (sortBy) params.append('sort_by', sortBy);
      if (withCrew) params.append('with_crew', withCrew);
      if (withCast) params.append('with_cast', withCast);

      // Streaming services filter
      if (streamingServices) {
        params.append('with_watch_providers', streamingServices);
        params.append('watch_region', 'US');
      }

      // Duration filter
      if (duration && duration !== 'all') {
        if (duration === 'short') {
          params.append('with_runtime.lte', '40');
        } else if (duration === 'medium') {
          params.append('with_runtime.gte', '41');
          params.append('with_runtime.lte', '79');
        } else if (duration === 'feature') {
          params.append('with_runtime.gte', '80');
          params.append('with_runtime.lte', '120');
        } else if (duration === 'epic') {
          params.append('with_runtime.gte', '121');
        }
      }

      return `https://api.themoviedb.org/3/discover/movie?${params}`;
    };

    // Fetch movies until we have 20 unfiltered ones
    let allMovies: any[] = [];
    let currentPage = requestedPage;
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loop
    const DELAY_BETWEEN_PAGES = 250; // 250ms delay to avoid rate limiting

    while (allMovies.length < 20 && attempts < maxAttempts) {
      const tmdbUrl = buildTmdbUrl(currentPage);
      console.log(`Fetching TMDb page ${currentPage} (attempt ${attempts + 1})`);
      
      const response = await fetch(tmdbUrl);
      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        // Filter out excluded movies
        const validMovies = data.results.filter((movie: any) => 
          !excludedSet.has(movie.id)
        );

        console.log(`Page ${currentPage}: Found ${validMovies.length}/${data.results.length} valid movies`);
        allMovies = allMovies.concat(validMovies);
        currentPage++;
        attempts++;

        // Small delay between requests to avoid rate limiting
        if (allMovies.length < 20 && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES));
        }
      } else {
        break; // No more results
      }
    }

    // Return exactly 20 movies (or less if not enough available)
    const finalMovies = allMovies.slice(0, 20);
    
    console.log(`Returning ${finalMovies.length} filtered movies after ${attempts} API calls`);

    return c.json({
      results: finalMovies,
      page: requestedPage,
      total_pages: 500, // TMDb limit
      total_results: finalMovies.length
    });
  } catch (error) {
    console.error('Error fetching filtered movies:', error);
    return c.json({ error: `Failed to fetch filtered movies: ${error}` }, 500);
  }
});

// Get movie details by TMDb ID
// ── Debug: inspect a specific watched entry in KV ────────────────────────────
// Use this to diagnose watched-persistence issues for a specific movie.
// Example: GET /debug/watched/1198994  (with Authorization header)
app.get("/make-server-5623fde1/debug/watched/:movieId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: 'Unauthorized' }, 401);

    const movieId = c.req.param('movieId');

    // Direct key lookup
    const directKey = await kv.get(`watched:${user.id}:${movieId}`);

    // Prefix scan – look for any entry whose stored id matches (paginated for accuracy)
    const allWatched = await getByPrefixPaginated(`watched:${user.id}:`);
    const matchingItems = allWatched.filter((item: any) => {
      const rawId = item.id ?? item.tmdbId;
      return String(rawId) === String(movieId);
    });

    return c.json({
      userId:            user.id,
      queriedMovieId:    movieId,
      directKeyFound:    !!directKey,
      directKeyIdType:   directKey ? typeof directKey.id : null,
      directKeyId:       directKey?.id,
      totalWatchedCount: allWatched.length,
      matchingItemCount: matchingItems.length,
      // Sample to show id types stored in KV
      sampleWatched: allWatched.slice(0, 5).map((i: any) => ({
        id: i.id, idType: typeof i.id, tmdbId: i.tmdbId, title: i.title,
      })),
    });
  } catch (error) {
    return c.json({ error: `Debug failed: ${error}` }, 500);
  }
});

// IMPORTANT: This wildcard route MUST be registered AFTER all specific /movies/xxx routes
// (like /movies/excluded-ids, /movies/discover-filtered, etc.) to prevent route shadowing.
// Hono matches routes in registration order, so /movies/:id would intercept
// /movies/excluded-ids if registered first, treating "excluded-ids" as an :id param.
app.get("/make-server-5623fde1/movies/:id", async (c) => {
  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'TMDb API key not configured' }, 500);
    }

    const movieId = c.req.param('id');
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,external_ids,watch/providers`;
    const response = await fetch(url);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return c.json({ error: `Failed to fetch movie details: ${error}` }, 500);
  }
});

// Start the server with error handling
try {
  Deno.serve(app.fetch);
  console.log('DuoReel server started successfully');
} catch (error) {
  console.error('Fatal error starting server:', error);
  throw error;
}