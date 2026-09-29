import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('kounkour_radar_scrapes_v1');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-lg text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#8D174B] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-[#8D174B]" />
          </div>
          <h3 className="text-lg font-bold text-[#242126]">
            {this.props.fallbackTitle || 'Une erreur est survenue lors du chargement'}
          </h3>
          <p className="text-xs text-[#6E6773] leading-relaxed">
            Les données locales ont été réinitialisées pour résoudre ce conflit d'affichage.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-[#8D174B] text-white text-xs font-bold shadow-xs hover:bg-[#75123E] cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réinitialiser et recharger</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
