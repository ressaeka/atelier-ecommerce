import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Safety net for unexpected render/runtime errors.
 * Shows an in-app error panel instead of a full white screen.
 * Does NOT force page reload.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.',
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5] px-6">
          <div className="w-full max-w-md rounded-2xl border border-[#E8E4DC] bg-white p-8 text-center shadow-sm">
            <p className="font-editorial text-xl font-medium tracking-tight text-[#1A1A1A]">
              ATELIER
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-[#6B6B6B]">
              Maaf, terjadi kesalahan saat menampilkan halaman.
            </p>
            <p className="mt-2 text-[12px] text-[#9A9A9A]">
              Silakan coba lagi. Tidak perlu refresh browser.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 w-full rounded-xl bg-[#1A1A1A] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#333]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
