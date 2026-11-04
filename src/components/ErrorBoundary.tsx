import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in Fazendinha da Isa:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen min-h-screen bg-gradient-to-b from-amber-100 via-sky-100 to-emerald-200 flex flex-col items-center justify-center p-6 text-center font-['Nunito',sans-serif]">
          <div className="bg-white/95 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <span className="text-5xl block mb-2">🌻</span>
            <h1 className="text-2xl font-black text-amber-950 mb-2">
              Fazendinha da Isa
            </h1>
            <p className="text-xs sm:text-sm text-amber-800 font-bold mb-4">
              Ocorreu uma instabilidade momentânea ao carregar a cena. Não se preocupe, seus dados estão seguros!
            </p>

            {this.state.error && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-left max-h-24 overflow-y-auto">
                <p className="text-[11px] font-mono text-amber-900 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-black text-sm py-3 rounded-2xl shadow-lg border-2 border-white transition active:scale-95 cursor-pointer"
              >
                🔄 Recarregar a Fazendinha
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs py-2.5 rounded-2xl border-2 border-amber-300 transition active:scale-95 cursor-pointer"
              >
                🧹 Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
