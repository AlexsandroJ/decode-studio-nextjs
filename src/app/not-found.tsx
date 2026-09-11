"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-bg-dark">
      <div className="max-w-lg w-full text-center space-y-6">
        
        <div className="relative inline-block">
          <div className="text-8xl mb-4 animate-pulse">🔧</div>
          <div className="absolute -top-2 -right-2 bg-red text-white text-xs font-bold px-2 py-1 rounded-full font-mono">
            404
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-text-bright mb-2">
            Página não encontrada
          </h1>
          <p className="text-text-dim text-sm leading-relaxed">
            A rota que você está procurando não existe ou foi movida.
            <br />
            Verifique a URL ou volte ao dashboard principal.
          </p>
        </div>

        <div className="bg-bg-panel border border-border rounded-lg p-4 font-mono text-xs text-left">
          <div className="flex justify-between border-b border-border/50 pb-2 mb-2">
            <span className="text-text-dim">Status:</span>
            <span className="text-red font-semibold">404 NOT_FOUND</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2 mb-2">
            <span className="text-text-dim">Route:</span>
            <span className="text-cyan">{pathname}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim">Timestamp:</span>
            
            {/* ✅ A MÁGICA ACONTECE AQUI: suppressHydrationWarning */}
            <span className="text-text-bright" suppressHydrationWarning>
              {new Date().toISOString()}
            </span>
            
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="btn btn-accent px-6 py-3 text-sm font-semibold"
          >
            🏠 Voltar ao Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn px-6 py-3 text-sm font-semibold"
          >
            ← Voltar atrás
          </button>
        </div>

        <div className="text-[11px] text-text-dim/70 pt-4 border-t border-border/30">
          💡 Dica: Use o menu de navegação para acessar as seções disponíveis
        </div>
      </div>
    </div>
  );
}