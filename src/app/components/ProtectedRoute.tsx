import { Outlet, Navigate, useLocation } from 'react-router';
import { Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects unauthenticated users to /login with a ?redirect= param
 * so they bounce back to their intended destination after sign-in.
 */
export function ProtectedRoute() {
  const { accessToken, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Film className="size-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
