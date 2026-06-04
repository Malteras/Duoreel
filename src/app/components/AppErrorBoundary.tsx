import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level class error boundary. Wraps the RouterProvider so it catches render
 * errors that escape the router tree — e.g. provider- or init-time crashes such
 * as the reported "Cannot access 'Yt' before initialization". A class component
 * is the only way to catch render errors in React, so the router-level boundary
 * (which handles in-route errors) cannot replace this.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
