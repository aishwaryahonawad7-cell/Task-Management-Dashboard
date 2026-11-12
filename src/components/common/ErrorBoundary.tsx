import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render/lifecycle errors in descendant components. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("An error was caught by ErrorBoundary:", error, info);
    this.props.onError?.(error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <section role="alert" aria-live="assertive">
          <h2>Something went wrong.</h2>
          <p>The page could not be displayed.</p>
          <button type="button" onClick={this.handleRetry}>Try again</button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
