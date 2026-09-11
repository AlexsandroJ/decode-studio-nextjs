"use client";

import { useState } from 'react';
import { useCANStudio, LogEntry } from '@/context/CANStudioContext';

export default function LogPanel() {
  const { requestLog, clearLog } = useCANStudio();
  
  // CORREÇÃO AQUI - Estados de expansão
  const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(
    new Set(requestLog.map((_, i) => i))
  );

  const toggleRequest = (idx: number) => {
    const next = new Set(expandedRequests);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedRequests(next);
  };

  const toggleResponse = (idx: number) => {
    const next = new Set(expandedResponses);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedResponses(next);
  };
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green';
    if (status === 0) return 'bg-red';
    return 'bg-orange';
  };

  const getStatusText = (status: number) => {
    if (status === 0) return 'ERR';
    return String(status);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-cyan';
      case 'POST': return 'text-green';
      case 'PUT': return 'text-orange';
      case 'DELETE': return 'text-red';
      default: return 'text-text';
    }
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const handleClear = () => {
    if (requestLog.length === 0) return;
    if (!confirm('Limpar todo o histórico de requisições?')) return;
    clearLog();
  };

  const handleCopyEntry = (entry: LogEntry) => {
    const text = `[${entry.time}] ${entry.method} ${entry.endpoint} → ${entry.status} (${entry.duration}ms)\n\nRequest: ${formatJson(entry.reqBody)}\n\nResponse: ${formatJson(entry.resData)}`;
    navigator.clipboard.writeText(text);
  };

  // Estatísticas
  const stats = {
    total: requestLog.length,
    success: requestLog.filter(e => e.status >= 200 && e.status < 300).length,
    errors: requestLog.filter(e => e.status === 0 || e.status >= 400).length,
    avgDuration: requestLog.length > 0
      ? Math.round(requestLog.reduce((sum, e) => sum + e.duration, 0) / requestLog.length)
      : 0,
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-text-bright font-semibold">📜 Histórico de Requisições</h3>
          <span className="text-text-dim text-xs">({requestLog.length} entradas)</span>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-mini"
            onClick={() => {
              setExpandedRequests(new Set());
              setExpandedResponses(new Set(requestLog.map((_, i) => i)));
            }}
          >
            📂 Expandir Respostas
          </button>
          <button
            className="btn-mini"
            onClick={() => {
              setExpandedRequests(new Set());
              setExpandedResponses(new Set());
            }}
          >
            📁 Recolher Tudo
          </button>
          <button className="btn-mini" onClick={handleClear} disabled={requestLog.length === 0}>
            🗑️ Limpar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bg-dark border border-border rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Total</div>
          <div className="text-text-bright font-mono text-lg font-bold">{stats.total}</div>
        </div>
        <div className="bg-bg-dark border border-border rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Sucesso (2xx)</div>
          <div className="text-green font-mono text-lg font-bold">{stats.success}</div>
        </div>
        <div className="bg-bg-dark border border-border rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Erros</div>
          <div className="text-red font-mono text-lg font-bold">{stats.errors}</div>
        </div>
        <div className="bg-bg-dark border border-border rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-dim mb-1">Tempo Médio</div>
          <div className="text-cyan font-mono text-lg font-bold">{stats.avgDuration}ms</div>
        </div>
      </div>

      {/* Lista de Requisições */}
      <div className="bg-bg-dark border border-border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
        {requestLog.length === 0 ? (
          <div className="text-center py-12 text-text-dim">
            <div className="text-4xl mb-3 opacity-30">📜</div>
            <div>Nenhuma requisição ainda...</div>
            <div className="text-[11px] mt-1.5">
              As requisições feitas aparecerão aqui automaticamente
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {requestLog.map((entry, idx) => (
              <div key={idx} className="p-4 hover:bg-bg-hover/30 transition-colors">
                {/* Linha Principal */}
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-dim text-[11px] font-mono">{entry.time}</span>
                    <span
                      className={`${getStatusColor(entry.status)} text-white px-1.5 py-0.5 rounded text-[10px] font-bold`}
                    >
                      {entry.method} {getStatusText(entry.status)}
                    </span>
                    <span className={`${getMethodColor(entry.method)} font-mono text-sm font-semibold`}>
                      {entry.endpoint}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-[11px] font-mono">{entry.duration}ms</span>
                    <button
                      className="text-text-dim hover:text-text-bright text-xs transition-colors"
                      onClick={() => handleCopyEntry(entry)}
                      title="Copiar entrada"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Request Body (colapsável) */}
                {entry.reqBody && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleRequest(idx)}
                      className="flex items-center gap-1.5 text-text-dim hover:text-text-bright text-[11px] font-mono cursor-pointer transition-colors"
                    >
                      <span className="text-xs">{expandedRequests.has(idx) ? '▼' : '▶'}</span>
                      Request Body
                    </button>
                    {expandedRequests.has(idx) && (
                      <pre className="mt-1.5 bg-bg-elevated border border-border rounded p-3 text-[10px] text-purple font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                        {formatJson(entry.reqBody)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Response Body (colapsável) */}
                <div className="mt-2">
                  <button
                    onClick={() => toggleResponse(idx)}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-bright text-[11px] font-mono cursor-pointer transition-colors"
                  >
                    <span className="text-xs">{expandedResponses.has(idx) ? '▼' : '▶'}</span>
                    Response Body
                  </button>
                  {expandedResponses.has(idx) && (
                    <pre
                      className={`mt-1.5 bg-bg-elevated border border-border rounded p-3 text-[10px] font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto ${
                        entry.status >= 200 && entry.status < 300 ? 'text-green' : 'text-red'
                      }`}
                    >
                      {formatJson(entry.resData)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}