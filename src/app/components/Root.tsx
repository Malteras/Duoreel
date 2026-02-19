import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from './ui/sonner';

/** Top-level layout: provides auth context and the global toast container. */
export function Root() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
