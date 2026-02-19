import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`, 
  publicAnonKey,
  {
    auth: {
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      autoRefreshToken: true,
      persistSession: true,
      // MUST be true for OAuth (Google sign-in) to work — reads tokens from URL fragment
      detectSessionInUrl: true,
    }
  }
);

const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track whether onAuthStateChange has fired so we don't prematurely set loading=false
    let authEventFired = false;

    // Listen for auth state changes FIRST (before getSession)
    // This ensures we catch the SIGNED_IN event from OAuth URL fragment parsing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      authEventFired = true;
      
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUserEmail(session.user?.email ?? null);
        setUserId(session.user?.id ?? null);

        // Ensure KV profile exists — handles first-time Google OAuth users
        if (event === 'SIGNED_IN') {
          try {
            const name =
              session.user?.user_metadata?.full_name ??
              session.user?.user_metadata?.name ??
              session.user?.email?.split('@')[0] ??
              'User';
            const res = await fetch(`${baseUrl}/api/ensure-profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ name }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              console.error('ensure-profile failed:', body);
            }
          } catch (e) {
            console.error('Failed to call ensure-profile:', e);
          }
        }
      } else {
        setAccessToken(null);
        setUserEmail(null);
        setUserId(null);
      }

      // Always mark loading done when auth state is resolved
      setLoading(false);
    });

    // Also call getSession as a fallback — if no auth event fires within a timeout,
    // use getSession result. This handles the case where there's no hash fragment
    // AND no stored session (user is simply not logged in).
    const fallbackTimer = setTimeout(async () => {
      if (!authEventFired) {
        console.log('No auth event fired yet, checking session directly...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAccessToken(session.access_token);
          setUserEmail(session.user?.email ?? null);
          setUserId(session.user?.id ?? null);
        }
        setLoading(false);
      }
    }, 1000); // 1 second fallback — onAuthStateChange should fire well before this

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('duoreel_activeTab');
    setAccessToken(null);
    setUserEmail(null);
    setUserId(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/discover`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
    // Browser will redirect to Google — function returns before redirect completes
  };

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, userId, loading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
