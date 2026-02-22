import { Outlet } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from './ui/sonner';

/** Top-level layout: provides auth context and the global toast container. */
export function Root() {
  return (
    <AuthProvider>
      <Helmet>
        <title>DuoReel</title>
      </Helmet>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}