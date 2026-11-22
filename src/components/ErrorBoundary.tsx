import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onResetRound?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected kitchen mishap occurred.',
    };
  }

  componentDidCatch(error: Error): void {
    console.error('Lahori Nashta ErrorBoundary caught:', error);
  }

  handleResetRound = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onResetRound) {
      this.props.onResetRound();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#FBF6EE] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border-2 border-[#2C1B12] rounded-2xl p-6 shadow-[4px_4px_0px_#2C1B12] text-center">
            <h2 className="font-display text-2xl font-bold text-[#2C1B12] mb-2">
              Chulha Needs a Fresh Spark
            </h2>
            <p className="text-sm text-[#5A4234] mb-4">
              {this.state.errorMessage}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleResetRound}
                className="px-4 py-2.5 rounded-xl bg-[#B84A2E] text-white text-sm font-semibold hover:bg-[#9E3C23] transition-colors whitespace-nowrap"
              >
                Reset Round
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl border border-[#2C1B12]/25 bg-[#FBF6EE] text-[#2C1B12] text-sm font-semibold hover:bg-[#F3E8D6] transition-colors whitespace-nowrap"
              >
                Reload Game
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
