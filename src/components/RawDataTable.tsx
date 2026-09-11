"use client";

import { useState, useMemo } from 'react';
import { useCANStudio } from '@/context/CANStudioContext';
import { apiRequest } from '@/lib/utils';

interface Signal {
  signalName: string;
  value: number | string;
  unit?: string;
}

interface SensorReading {
  sensorId?: string;
  sensorType?: string;
  value: any;
  unit?: string;
}

interface RawDataRecord {
  _type: 'can-frame' | 'sensor' | 'unified';
  id: string;
  timestamp: number;
  source: 'can' | 'sensor' | 'merged';
  canId: string;
  rawData: string;
  dlc?: number;
  signals: Signal[] | null;
  sensorReadings: SensorReading[] | null;
  _original: any;
}

export default function RawDataTable() {
  const { baseUrl, addLog } = useCANStudio();
  
  const [data, setData] = useState<RawDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<RawDataRecord | null>(null);
  
  // Filtros e Ordenação
  const [filterSource, setFilterSource] = useState<'all' | 'can' | 'sensor' | 'merged'>('all');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc'>('time-desc');

  const refreshData = async () => {
    setLoading(true);
    try {
      const [unifiedRes, framesRes, sensorsRes] = await Promise.all([
        apiRequest('GET', '/unified?limit=500', null, baseUrl, addLog),
        apiRequest('GET', '/can/frames?limit=500', null, baseUrl, addLog),
        apiRequest('GET', '/sensors?limit=500', null, baseUrl, addLog)
      ]);

      const all: RawDataRecord[] = [];

      if (framesRes.success) {
        const frames = framesRes.data.data || framesRes.data || [];
        if (Array.isArray(frames)) {
          frames.forEach((f: any) => {
            all.push({
              _type: 'can-frame',
              id: f.id || `frame_${Math.random()}`,
              timestamp: f.timestamp || Date.now(),
              source: 'can',
              canId: f.canId || '—',
              rawData: f.data || '—',
              dlc: f.dlc,
              signals: null,
              sensorReadings: null,
              _original: f
            });
          });
        }
      }

      if (sensorsRes.success) {
        const sensors = sensorsRes.data.data || sensorsRes.data || [];
        if (Array.isArray(sensors)) {
          sensors.forEach((s: any) => {
            all.push({
              _type: 'sensor',
              id: s.id || `sensor_${Math.random()}`,
              timestamp: s.timestamp || Date.now(),
              source: 'sensor',
              canId: '—',
              rawData: typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
              dlc: undefined,
              signals: null,
              sensorReadings: [s],
              _original: s
            });
          });
        }
      }

      if (unifiedRes.success) {
        const unified = unifiedRes.data.data || unifiedRes.data || [];
        if (Array.isArray(unified)) {
          unified.forEach((u: any) => {
            let canId = '—';
            if (u.canSignals && u.canSignals.length > 0) {
              // Tenta achar o CAN ID nas regras (simplificado para o exemplo)
              canId = u.canSignals[0].canId || '—';
            }
            all.push({
              _type: 'unified',
              id: u.id || `unified_${Math.random()}`,
              timestamp: u.timestamp || Date.now(),
              source: u.source || 'merged',
              canId,
              rawData: u.canSignals?.[0]?.rawHex || (u.sensorReadings ? JSON.stringify(u.sensorReadings[0]?.value) : '—'),
              dlc: undefined,
              signals: u.canSignals || null,
              sensorReadings: u.sensorReadings || null,
              _original: u
            });
          });
        }
      }

      setData(all);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtragem e Ordenação (Memoizada para performance)
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (filterSource !== 'all') {
      result = result.filter(r => r.source === filterSource);
    }

    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter(r => {
        const searchStr = [
          r.canId,
          r.rawData,
          r.source,
          ...(r.signals || []).map(s => `${s.signalName} ${s.value}`),
          ...(r.sensorReadings || []).map(s => `${s.sensorId || s.sensorType} ${JSON.stringify(s.value)}`)
        ].join(' ').toLowerCase();
        return searchStr.includes(lowerFilter);
      });
    }

    result.sort((a, b) => {
      return sortBy === 'time-desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [data, filterSource, filterText, sortBy]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: data.length,
    can: data.filter(r => r.source === 'can').length,
    sensor: data.filter(r => r.source === 'sensor').length,
    merged: data.filter(r => r.source === 'merged').length,
  }), [data]);

  const handleExport = () => {
    if (data.length === 0) return;
    const blob = new Blob([JSON.stringify(data.map(r => r._original), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `can-sensor-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max) + '…' : str;
  const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
           '.' + String(ts % 1000).padStart(3, '0');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-bg-dark border border-border rounded-lg overflow-hidden">
        <div className="flex flex-wrap justify-between items-center p-3 bg-bg-elevated border-b border-border gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select 
              className="bg-bg-dark border border-border text-text px-2.5 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-accent"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
            >
              <option value="all">Todas as fontes</option>
              <option value="can">CAN Frames</option>
              <option value="sensor">Sensores</option>
              <option value="merged">Merged</option>
            </select>
            
            <input 
              type="text" 
              placeholder="🔍 Filtrar..." 
              className="bg-bg-dark border border-border text-text px-2.5 py-1.5 rounded text-xs w-[200px] focus:outline-none focus:border-accent"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            
            <select 
              className="bg-bg-dark border border-border text-text px-2.5 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-accent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="time-desc">Mais recente</option>
              <option value="time-asc">Mais antigo</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button className="btn-mini" onClick={refreshData} disabled={loading}>
              {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
            </button>
            <button className="btn-mini" onClick={handleExport} disabled={data.length === 0}>
              💾 Exportar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-bg-elevated sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[130px]">Timestamp</th>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[70px]">Fonte</th>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[80px]">CAN ID</th>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[170px]">Data Bruta</th>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border">Sinais / Leituras</th>
                <th className="px-3 py-2.5 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[60px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-text-dim">Carregando dados...</td></tr>
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-text-dim">
                    {data.length === 0 ? 'Clique em "🔄 Atualizar" para carregar dados' : 'Nenhum resultado para o filtro'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row) => {
                  const badgeColor = row.source === 'can' ? 'bg-purple/15 text-purple' : 
                                     row.source === 'sensor' ? 'bg-cyan/15 text-cyan' : 'bg-bit-selected/15 text-bit-selected';
                  
                  let chips = '';
                  if (row.signals && row.signals.length > 0) {
                    chips = row.signals.map(s => (
                      `<span class="inline-block bg-bg-elevated border border-border px-2 py-0.5 rounded-full text-[11px] m-0.5">
                        <span class="text-text-dim mr-1">${s.signalName}:</span>
                        <span class="text-green font-semibold">${typeof s.value === 'number' ? s.value.toFixed(2) : s.value} ${s.unit || ''}</span>
                      </span>`
                    )).join('');
                  } else if (row.sensorReadings && row.sensorReadings.length > 0) {
                    chips = row.sensorReadings.map(s => {
                      const val = typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
                      return `<span class="inline-block bg-bg-elevated border border-border px-2 py-0.5 rounded-full text-[11px] m-0.5">
                        <span class="text-text-dim mr-1">${s.sensorId || s.sensorType}:</span>
                        <span class="text-green font-semibold">${truncate(val, 20)} ${s.unit || ''}</span>
                      </span>`;
                    }).join('');
                  } else {
                    chips = row._type === 'can-frame' 
                      ? '<span class="text-orange text-[11px]">⚠ Sem decodificação</span>' 
                      : '<span class="text-text-dim">—</span>';
                  }

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-bg-hover border-b border-border/50">
                      <td className="px-3 py-2 text-text-dim font-mono text-[11px]">{formatTime(row.timestamp)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${badgeColor}`}>
                          {row.source}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.canId !== '—' ? (
                          <span className="text-purple font-semibold font-mono">{row.canId}</span>
                        ) : (
                          <span className="text-text-dim">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row._type === 'sensor' ? (
                          <span className="text-cyan">{truncate(row.rawData, 24)}</span>
                        ) : (
                          <span className="text-cyan font-semibold tracking-wider">{row.rawData}</span>
                        )}
                      </td>
                      <td className="px-3 py-2" dangerouslySetInnerHTML={{ __html: chips }} />
                      <td className="px-3 py-2">
                        <button 
                          className="btn-mini" 
                          title="Detalhes"
                          onClick={() => setSelectedDetail(row)}
                        >
                          🔍
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="flex gap-4 px-4 py-2.5 bg-bg-elevated border-t border-border text-[11px] text-text-dim">
          <span>Total: <span className="text-text-bright font-semibold">{stats.total}</span></span>
          <span>CAN: <span className="text-text-bright font-semibold">{stats.can}</span></span>
          <span>Sensor: <span className="text-text-bright font-semibold">{stats.sensor}</span></span>
          <span>Merged: <span className="text-text-bright font-semibold">{stats.merged}</span></span>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedDetail && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetail(null); }}
        >
          <div className="bg-bg-panel border border-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text-bright text-lg font-semibold">🔍 Detalhes do Registro</h3>
              <button className="btn-mini" onClick={() => setSelectedDetail(null)}>✕ Fechar</button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                selectedDetail.source === 'can' ? 'bg-purple/15 text-purple' : 
                selectedDetail.source === 'sensor' ? 'bg-cyan/15 text-cyan' : 'bg-bit-selected/15 text-bit-selected'
              }`}>
                {selectedDetail.source}
              </span>
              {selectedDetail.canId !== '—' && (
                <span className="text-purple font-semibold font-mono bg-bg-dark px-2 py-1 rounded text-xs">
                  {selectedDetail.canId}
                </span>
              )}
              <span className="text-text-dim font-mono text-xs bg-bg-dark px-2 py-1 rounded">
                {formatTime(selectedDetail.timestamp)}
              </span>
            </div>

            <pre className="bg-bg-dark border border-border rounded-lg p-4 font-mono text-xs text-green whitespace-pre-wrap break-all overflow-x-auto">
              {escapeHtml(JSON.stringify(selectedDetail._original || selectedDetail, null, 2))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}