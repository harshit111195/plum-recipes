import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { logger } from '../services/loggerService';
import { captureException } from '../services/monitoringService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log using the new centralized logger service
    logger.error('Global Error Boundary caught crash', { error, errorInfo });
    
    // Send to monitoring service
    captureException(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm("This will clear all your data (Pantry, Recipes, Settings) to fix the crash. Are you sure?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Chef's Brain Freeze</h1>
          <p className="text-brand-text-secondary mb-8 max-w-xs mx-auto">
            Something went wrong. We're sorry about that.
          </p>
          
          <div className="w-full max-w-xs space-y-3">
            <button 
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-95 transition"
            >
                <RefreshCw size={20} /> Try Again
            </button>
            
            <button 
                onClick={this.handleHardReset}
                className="w-full flex items-center justify-center gap-2 bg-brand-surface text-brand-error font-semibold py-3.5 rounded-2xl border border-black/5 active:bg-red-50 transition"
            >
                <Trash2 size={20} /> Reset App Data
            </button>
          </div>
          
          <p className="mt-8 text-xs text-brand-text-secondary font-mono bg-gray-100 p-2 rounded-lg max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              Error: {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}