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
      detectSessionInUrl: false
    }
  }
);

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
      } else {
        console.log('No active session found');
      }
      setLoading(false);
    });

    // Keep auth state in sync (fires on setSession, signOut, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUserEmail(session.user?.email ?? null);
      } else {
        setAccessToken(null);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('duoreel_activeTab');
    setAccessToken(null);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}