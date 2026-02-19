import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './components/Root';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './components/AuthPage';
import { DiscoverPage } from './components/DiscoverPage';
import { SavedPage } from './components/SavedPage';
import { MatchesPage } from './components/MatchesPage';
import { LandingPage } from './components/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      // Public routes
      { index: true, Component: LandingPage },
      { path: 'login', Component: AuthPage },

      // Protected routes — unauthed visitors are redirected to /login?redirect=…
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AppLayout,
            children: [
              { path: 'discover', Component: DiscoverPage },
              { path: 'saved', Component: SavedPage },
              { path: 'matches', Component: MatchesPage },
              // Unknown paths under protected → discover
              { path: '*', element: <Navigate to="/discover" replace /> },
            ],
          },
        ],
      },
    ],
  },
]);
