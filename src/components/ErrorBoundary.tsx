import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary component that catches React errors
 * Prevents app crashes and shows user-friendly error UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service (Sentry, etc.)
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full p-6 rounded-xl border border-destructive/20 bg-destructive/5">
              <div className="text-2xl font-bold text-destructive mb-2">Something went wrong</div>
              <p className="text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
