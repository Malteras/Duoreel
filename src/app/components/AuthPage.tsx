import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Film } from 'lucide-react';
import { AuthScreen } from './AuthScreen';
import { useAuth } from '../context/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';

/**
 * Route-aware wrapper around AuthScreen.
 * - Redirects already-authenticated users to their intended destination.
 * - Passes a redirect URL so sign-in bounces back to where the user came from.
 * - Supports ?tab=signup to open the Sign Up tab directly.
 */
export function AuthPage() {
  const { accessToken, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get('redirect') || '/discover';
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Film className="size-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (accessToken) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <AuthScreen
      projectId={projectId}
      publicAnonKey={publicAnonKey}
      defaultTab={defaultTab as 'signin' | 'signup'}
      onAuthSuccess={() => navigate(redirect)}
      onBack={() => navigate('/')}
    />
  );
}
