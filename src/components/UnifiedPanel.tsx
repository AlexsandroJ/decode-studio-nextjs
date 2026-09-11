"use client";

import { useState } from 'react';
import { useCANStudio } from '@/context/CANStudioContext';

type SourceFilter = '' | 'can' | 'sensor' | 'merged';

export default function UnifiedPanel() {
  const { api, showToast } = useCANStudio();

  // Filtros
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [mergeWindow, setMergeWindow] = useState<number>(1000);
  const [limit, setLimit] = useState<number>(100);

  // Estado da resposta
  const [response, setResponse] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string>('');

  // ══════════════════════════════════════════════════════
  //  HANDLERS
  // ══════════════════════════════════════════════════════
  const handleMerge = async () => {
    setIsLoading(true);
    setResponse(null);
    setLastAction('Merge');

    try {
      const res = await api.mergeUnified(mergeWindow);
      setIsSuccess(res.success);
      setResponse(res.data);

      if (res.success) {
        const mergedCount = Array.isArray(res.data.data || res.data)
          ? (res.data.data || res.data).length
          : 0;
        showToast(`🔗 ${mergedCount} registros mesclados!`);
      } else {
        showToast('❌ Erro ao mesclar: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResponse({ error: err.message });
      showToast('❌ Erro inesperado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleList = async () => {
    setIsLoading(true);
    setResponse(null);
    setLastAction('Listar');

    try {
      const params: { limit: number; source?: string } = { limit };
      if (sourceFilter) params.source = sourceFilter;

      const res = await api.getUnified(params);
      setIsSuccess(res.success);
      setResponse(res.data);

      if (res.success) {
        const count = Array.isArray(res.data.data || res.data)
          ? (res.data.data || res.data).length
          : 0;
        showToast(`📥 ${count} registros carregados!`);
      } else {
        showToast('❌ Erro ao listar: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResponse({ error: err.message });
      showToast('❌ Erro inesperado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados unificados?')) return;

    setIsLoading(true);
    setResponse(null);
    setLastAction('Limpar');

    try {
      const res = await api.deleteUnified();
      setIsSuccess(res.success);
      setResponse(res.data);

      if (res.success) {
        showToast('🗑️ Dados unificados removidos!');
      } else {
        showToast('❌ Erro ao limpar: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResponse({ error: err.message });
      showToast('❌ Erro inesperado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════
  //  UTILS
  // ══════════════════════════════════════════════════════
  const formatResponse = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(formatResponse(response));
      showToast('📋 Copiado para área de transferência!');
    }
  };

  // Estatísticas rápidas da resposta (se for array)
  const getStats = () => {
    if (!response) return null;
    const data = response.data || response;
    if (Array.isArray(data)) {
      const bySource = data.reduce((acc: Record<string, number>, item: any) => {
        const src = item.source || 'unknown';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {});
      return { total: data.length, bySource };
    }
    return null;
  };

  const stats = getStats();

  // ══════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Formulário de Configuração */}
      <div className="bg-bg-dark border border-border rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              Filtro (source)
            </label>
            <select
              className="input-field"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            >
              <option value="">Todos</option>
              <option value="can">CAN</option>
              <option value="sensor">Sensor</option>
              <option value="merged">Merged</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              Window (ms)
            </label>
            <input
              type="number"
              className="input-field"
              value={mergeWindow}
              onChange={(e) => setMergeWindow(parseInt(e.target.value) || 0)}
              min={100}
              step={100}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              Limite
            </label>
            <input
              type="number"
              className="input-field"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
              min={1}
              max={10000}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-accent"
            onClick={handleMerge}
            disabled={isLoading}
          >
            {isLoading && lastAction === 'Merge' ? '⏳ Mesclando...' : '🔗 Merge'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleList}
            disabled={isLoading}
          >
            {isLoading && lastAction === 'Listar' ? '⏳ Buscando...' : '📥 Listar'}
          </button>

          <button
            className="btn btn-danger"
            onClick={handleClear}
            disabled={isLoading}
          >
            {isLoading && lastAction === 'Limpar' ? '⏳ Limpando...' : '🗑️ Limpar'}
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas (aparece quando há dados) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-bg-dark border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Total</div>
            <div className="text-text-bright font-mono text-lg font-bold">{stats.total}</div>
          </div>
          <div className="bg-bg-dark border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">CAN</div>
            <div className="text-purple font-mono text-lg font-bold">{stats.bySource.can || 0}</div>
          </div>
          <div className="bg-bg-dark border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Sensor</div>
            <div className="text-cyan font-mono text-lg font-bold">{stats.bySource.sensor || 0}</div>
          </div>
          <div className="bg-bg-dark border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Merged</div>
            <div className="text-bit-selected font-mono text-lg font-bold">{stats.bySource.merged || 0}</div>
          </div>
          <div className="bg-bg-dark border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Outros</div>
            <div className="text-text-dim font-mono text-lg font-bold">
              {stats.total - (stats.bySource.can || 0) - (stats.bySource.sensor || 0) - (stats.bySource.merged || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Caixa de Resposta */}
      {response && (
        <div
          className={`rounded-lg p-4 max-h-[400px] overflow-y-auto border-l-4 transition-all ${
            isSuccess
              ? 'bg-bg-dark border-border border-l-green'
              : 'bg-bg-dark border-border border-l-red'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isSuccess ? 'text-green' : 'text-red'
              }`}
            >
              {isSuccess ? '✅ Sucesso' : '❌ Erro'}
            </span>
            <button
              className="text-text-dim hover:text-text-bright text-xs transition-colors"
              onClick={handleCopy}
              title="Copiar para área de transferência"
            >
              📋 Copiar
            </button>
          </div>
          <pre className="font-mono text-xs text-text whitespace-pre-wrap break-all">
            {formatResponse(response)}
          </pre>
        </div>
      )}

      {!response && !isLoading && (
        <div className="text-center py-8 text-text-dim text-sm bg-bg-dark border border-border border-dashed rounded-lg">
          Aguardando ação... Configure os filtros e clique em "Merge", "Listar" ou "Limpar".
        </div>
      )}
    </div>
  );
}