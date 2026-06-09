import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { ErrorFallback } from './ErrorFallback';

/**
 * Router-level error boundary. Attached to the root route so it renders the
 * shared branded fallback for any error thrown within the routing tree (route
 * component render, loaders, actions). Errors that escape the router entirely
 * are caught one level up by {@link AppErrorBoundary}.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error('[RouteErrorBoundary] Route error:', error);
  }, [error]);

  return <ErrorFallback error={error} />;
}
