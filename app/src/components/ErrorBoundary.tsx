import { Component, ErrorInfo, ReactNode } from 'react';
import { Code2, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log only non-extension errors
    if (!error.stack?.includes('chrome-extension://')) {
      console.error('App Error:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isExtensionError = this.state.error?.stack?.includes('chrome-extension://');

      if (isExtensionError) {
        // Silently recover from extension errors
        return this.props.children;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Code2 className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground text-sm mb-6">
              An unexpected error occurred. This is sometimes caused by browser extensions interfering with the app.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="btn-solana px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <p className="text-xs text-muted-foreground">
                If the issue persists, try opening the app in an incognito window with extensions disabled.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
