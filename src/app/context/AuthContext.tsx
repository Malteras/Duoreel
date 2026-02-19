import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`, 
  publicAnonKey,
  {
    auth: {
      // Ensure sessions are persisted to localStorage
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
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.access_token) {
        console.log('Session restored from storage:', {
          email: session.user?.email,
          expiresAt: new Date(session.expires_at! * 1000).toISOString()
        });
        setAccessToken(session.access_token);
        setUserEmail(session.user?.email ?? null);
        setUserId(session.user?.id ?? null);
      } else {
        console.log('No active session found');
      }
      setLoading(false);
    });

    // Keep auth state in sync (fires on setSession, signOut, token refresh, OAuth redirect, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
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
    });

    return () => subscription.unsubscribe();
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