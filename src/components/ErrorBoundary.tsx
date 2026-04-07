import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.componentName || 'Component'} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-red-100 bg-red-50 text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {this.props.componentName || 'This component'} ran into a problem
            </p>
            <p className="text-xs text-red-500 mt-1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for inline use
export const withErrorBoundary = (
  component: ReactNode,
  componentName: string,
  fallback?: ReactNode
) => (
  <ErrorBoundary componentName={componentName} fallback={fallback}>
    {component}
  </ErrorBoundary>
);
