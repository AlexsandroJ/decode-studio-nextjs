"use client";
import { useState, useEffect } from 'react';
import { useViewer } from '@/context/ViewerContext';
import { useViewerLive } from '@/hooks/useViewerLive';
import WidgetCard from './WidgetCard';
import ConfigModal from './ConfigModal';

export default function ViewPanel() {
  const { 
    widgets, 
    removeWidget, 
    isLive, 
    setIsLive, 
    refreshInterval, 
    setRefreshInterval,
    lastUpdate,
    setBaseUrl,
    baseUrl
  } = useViewer();
  
  // Hook que gerencia o polling em tempo real
  const { fetchData } = useViewerLive();
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState(baseUrl);

  // Sincroniza URL local com o contexto
  useEffect(() => {
    setLocalUrl(baseUrl);
  }, [baseUrl]);

  const handleEdit = (id: string) => {
    setEditingWidgetId(id);
    setIsConfigOpen(true);
  };

  const handleCloseConfig = () => {
    setIsConfigOpen(false);
    setEditingWidgetId(null);
  };

  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const handleRefreshNow = () => {
    fetchData();
  };

  const handleUrlChange = () => {
    setBaseUrl(localUrl);
  };

  const formatLastUpdate = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // ════════════════════════════════════════════════════════
  //  ESTADO VAZIO
  // ════════════════════════════════════════════════════════
  if (widgets.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 bg-bg-dark/50 border-2 border-dashed border-border rounded-xl text-text-dim">
          <div className="text-6xl mb-4 opacity-20"></div>
          <h3 className="text-lg font-semibold text-text-bright mb-2">
            Nenhum widget configurado
          </h3>
          <p className="text-sm max-w-md text-center mb-6">
            Clique em <strong className="text-accent">⚙️ Configurar</strong> para adicionar sinais CAN, sensores ou dados unificados ao seu dashboard.
          </p>
          <button 
            onClick={() => setIsConfigOpen(true)} 
            className="btn btn-accent px-6 py-3 text-sm font-semibold"
          >
            ⚙️ Configurar Widgets
          </button>
        </div>

        <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={handleCloseConfig} 
          editingWidgetId={editingWidgetId} 
        />
      </>
    );
  }

  // ════════════════════════════════════════════════════════
  //  DASHBOARD ATIVO
  // ════════════════════════════════════════════════════════
  return (
    <>
      {/* ══════════ BARRA DE CONTROLE ══════════ */}
      <div className="bg-bg-panel border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Lado Esquerdo: Status e Controles */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Indicador de Status Live */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark rounded-lg border border-border">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isLive 
                  ? 'bg-green animate-pulse shadow-[0_0_8px_rgba(63,185,80,0.6)]' 
                  : 'bg-text-dim'
              }`} />
              <span className={`text-xs font-semibold ${
                isLive ? 'text-green' : 'text-text-dim'
              }`}>
                {isLive ? 'LIVE' : 'PAUSADO'}
              </span>
            </div>

            {/* Última Atualização */}
            <div className="text-xs text-text-dim font-mono">
              🔄 Última: <span className="text-text-bright">{formatLastUpdate(lastUpdate)}</span>
            </div>

            {/* Contador de Widgets */}
            <div className="text-xs text-text-dim font-mono">
              📊 Widgets: <span className="text-text-bright">{widgets.length}</span>
            </div>
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Live/Pause */}
            <button 
              onClick={handleToggleLive}
              className={`btn text-sm font-semibold ${
                isLive 
                  ? 'bg-orange/20 text-orange border-orange hover:bg-orange hover:text-white' 
                  : 'btn-primary'
              }`}
            >
              {isLive ? '⏸️ Pausar' : '▶️ Iniciar Live'}
            </button>

            {/* Botão Atualizar Agora */}
            <button 
              onClick={handleRefreshNow}
              className="btn btn-accent text-sm"
              title="Forçar atualização imediata"
            >
              🔄 Atualizar
            </button>

            {/* Intervalo de Refresh */}
            <div className="flex items-center gap-1.5 text-xs text-text-dim bg-bg-dark px-2 py-1.5 rounded-lg border border-border">
              <span>Intervalo:</span>
              <input 
                type="number" 
                className="w-16 bg-transparent text-text-bright font-mono text-xs focus:outline-none"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 1000)}
                min={1} 
                max={60000}
                step={100}
              />
              <span>ms</span>
            </div>

            {/* Botão Configurar */}
            <button 
              onClick={() => setIsConfigOpen(true)} 
              className="btn text-sm"
            >
              ⚙️ Configurar
            </button>
          </div>
        </div>

        
      </div>

      {/* ══════════ GRID DE WIDGETS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map(w => (
          <WidgetCard 
            key={w.id} 
            w={w} 
            onEdit={() => handleEdit(w.id)} 
            onRemove={() => removeWidget(w.id)} 
          />
        ))}
      </div>

      {/* ══════════ MODAL DE CONFIGURAÇÃO ══════════ */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={handleCloseConfig} 
        editingWidgetId={editingWidgetId} 
      />
    </>
  );
}