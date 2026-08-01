import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Tugasin App:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 font-sans text-[#1E293B]">
          <div className="bg-white border-3 border-[#1E293B] rounded-3xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#1e293b] text-center space-y-4">
            <div className="w-16 h-16 bg-rose-200 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-900" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-[#1E293B]">Terjadi Kesalahan Sistem</h2>
              <p className="text-xs text-slate-600 font-semibold">
                Aplikasi mengalami kendala sementara saat memproses data.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-left text-xs font-mono text-rose-900 overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl py-3 text-sm shadow-[3px_3px_0px_0px_#1e293b] flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang & Pulihkan Tugasin</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
