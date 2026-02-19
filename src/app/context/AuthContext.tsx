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
      // We handle OAuth hash manually, so keep this false to avoid conflicts
      detectSessionInUrl: false,
    }
  }
);

const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

/**
 * Manually parse OAuth tokens from URL hash fragment.
 * Figma Make's SitesRuntime may strip the hash before Supabase can read it,
 * so we capture it as early as possible.
 */
function extractOAuthTokensFromHash(): { access_token: string; refresh_token: string } | null {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return null;

  const params = new URLSearchParams(hash.substring(1)); // remove the '#'
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    // Clean the hash from the URL immediately
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return { access_token, refresh_token };
  }
  return null;
}

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
    async function initAuth() {
      try {
        // Step 1: Check if we're returning from an OAuth redirect with tokens in the hash
        const oauthTokens = extractOAuthTokensFromHash();

        if (oauthTokens) {
          console.log('OAuth tokens found in URL hash, setting session manually...');
          
          // Manually set the session using the tokens from the hash
          const { data, error } = await supabase.auth.setSession({
            access_token: oauthTokens.access_token,
            refresh_token: oauthTokens.refresh_token,
          });

          if (error) {
            console.error('Failed to set OAuth session:', error);
          } else if (data.session) {
            console.log('OAuth session set successfully:', data.session.user?.email);
            setAccessToken(data.session.access_token);
            setUserEmail(data.session.user?.email ?? null);
            setUserId(data.session.user?.id ?? null);

            // Ensure KV profile exists for first-time Google users
            try {
              const name =
                data.session.user?.user_metadata?.full_name ??
                data.session.user?.user_metadata?.name ??
                data.session.user?.email?.split('@')[0] ??
                'User';
              await fetch(`${baseUrl}/api/ensure-profile`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({ name }),
              });
            } catch (e) {
              console.error('Failed to call ensure-profile:', e);
            }

            setLoading(false);
            return; // Done — OAuth session established
          }
        }

        // Step 2: No OAuth hash — check for existing session in localStorage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.access_token) {
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
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Keep auth state in sync for token refresh, sign-out, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUserEmail(session.user?.email ?? null);
        setUserId(session.user?.id ?? null);
      } else if (event === 'SIGNED_OUT') {
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
