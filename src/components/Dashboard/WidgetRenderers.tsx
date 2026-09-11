"use client";
import { Widget } from '@/context/ViewerContext';

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function getStateColor(w: Widget): string {
  if (w.color !== 'auto') return w.color;
  const val = typeof w.currentValue === 'number' ? w.currentValue : w.minValue;
  if (val >= w.dangerThreshold) return 'text-red';
  if (val >= w.warningThreshold || val < w.minValue) return 'text-orange';
  return 'text-green';
}

function formatValue(w: Widget): string {
  if (w.currentValue === undefined || w.currentValue === null) return '—';
  if (typeof w.currentValue === 'number') return w.currentValue.toFixed(w.decimals);
  if (typeof w.currentValue === 'boolean') return w.currentValue ? 'true' : 'false';
  return String(w.currentValue);
}

// Detecta o tipo real do valor
function getValueType(value: any): 'number' | 'string' | 'boolean' | 'array' | 'object' | 'null' {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  // Converte tipos não suportados para 'object'
  if (type === 'bigint' || type === 'symbol' || type === 'function') return 'object';
  return type as 'number' | 'string' | 'boolean' | 'object';
}

// ════════════════════════════════════════════════════════
//  NUMBER WIDGET
// ════════════════════════════════════════════════════════
export function NumberWidget({ w }: { w: Widget }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4">
      <div className={`text-4xl font-mono font-bold ${getStateColor(w)} transition-colors`}>
        {formatValue(w)}
      </div>
      {w.field?.unit && (
        <div className="text-text-dim text-sm mt-1 font-medium">{w.field.unit}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  GAUGE WIDGET
// ════════════════════════════════════════════════════════
export function GaugeWidget({ w }: { w: Widget }) {
  const val = typeof w.currentValue === 'number' ? w.currentValue : w.minValue;
  const range = w.maxValue - w.minValue || 1;
  const pct = Math.max(0, Math.min(100, ((val - w.minValue) / range) * 100));
  const colorClass = getStateColor(w).replace('text-', 'bg-');

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 py-2">
      <div className={`text-2xl font-mono font-bold ${getStateColor(w)}`}>
        {formatValue(w)}
        {w.field?.unit && <span className="text-sm text-text-dim ml-1">{w.field.unit}</span>}
      </div>
      <div className="w-full mt-4">
        <div className="h-4 bg-bg-elevated rounded-full overflow-hidden border border-border relative">
          <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-text-dim mt-1.5 font-mono">
          <span>{w.minValue}</span>
          <span>{w.maxValue}</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  BAR WIDGET
// ════════════════════════════════════════════════════════
export function BarWidget({ w }: { w: Widget }) {
  const colorClass = getStateColor(w).replace('text-', 'bg-');
  const range = w.maxValue - w.minValue || 1;

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-2 py-2">
      <div className={`text-xl font-mono font-bold mb-3 ${getStateColor(w)}`}>
        {formatValue(w)}
      </div>
      <div className="flex items-end justify-between gap-1 h-16 w-full">
        {w.history.length > 0 ? w.history.map((v, i) => {
          const pct = Math.max(0, Math.min(100, ((v - w.minValue) / range) * 100));
          return (
            <div key={i} className={`flex-1 ${colorClass} rounded-t-sm opacity-70 hover:opacity-100 transition-all`} style={{ height: `${pct}%` }} title={`${v.toFixed(w.decimals)}`} />
          );
        }) : (
          <span className="text-text-dim text-xs w-full text-center self-center">Aguardando dados...</span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  SPARKLINE WIDGET
// ════════════════════════════════════════════════════════
export function SparklineWidget({ w }: { w: Widget }) {
  if (w.history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className={`text-2xl font-mono font-bold ${getStateColor(w)}`}>{formatValue(w)}</div>
        <div className="text-text-dim text-xs mt-2">Coletando histórico...</div>
      </div>
    );
  }

  const min = Math.min(...w.history, w.minValue);
  const max = Math.max(...w.history, w.maxValue);
  const range = max - min || 1;
  const width = 200;
  const height = 60;

  const points = w.history.map((v, i) => {
    const x = (i / (w.history.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full py-2">
      <div className={`text-xl font-mono font-bold ${getStateColor(w)}`}>{formatValue(w)}</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-3 overflow-visible">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className={getStateColor(w)} />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LED WIDGET
// ════════════════════════════════════════════════════════
export function LedWidget({ w }: { w: Widget }) {
  const val = typeof w.currentValue === 'number' ? w.currentValue : w.minValue;
  
  let stateClass = 'bg-text-dim shadow-none';
  if (val >= w.dangerThreshold) stateClass = 'bg-red shadow-[0_0_15px_rgba(248,81,73,0.6)]';
  else if (val >= w.warningThreshold) stateClass = 'bg-orange shadow-[0_0_15px_rgba(210,153,34,0.6)]';
  else if (typeof w.currentValue === 'boolean') {
    stateClass = w.currentValue ? 'bg-green shadow-[0_0_15px_rgba(63,185,80,0.6)]' : 'bg-red shadow-[0_0_15px_rgba(248,81,73,0.6)]';
  } else {
    stateClass = 'bg-green shadow-[0_0_15px_rgba(63,185,80,0.6)]';
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4">
      <div className={`w-10 h-10 rounded-full transition-all duration-500 ${stateClass}`} />
      <div className="text-2xl font-mono font-semibold mt-4">
        {formatValue(w)}
        {w.field?.unit && <span className="text-sm text-text-dim ml-1">{w.field.unit}</span>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  TEXT WIDGET (para strings simples)
// ════════════════════════════════════════════════════════
export function TextWidget({ w }: { w: Widget }) {
  const value = w.currentValue;
  const display = value === null || value === undefined ? '—' : String(value);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4 px-2">
      <div className="text-lg font-mono text-text-bright break-all text-center max-w-full">
        {display}
      </div>
      {w.field?.unit && (
        <div className="text-sm text-text-dim mt-1">{w.field.unit}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  JSON WIDGET (para objetos complexos)
// ════════════════════════════════════════════════════════
export function JsonWidget({ w }: { w: Widget }) {
  const value = w.currentValue;
  
  let display: string;
  if (value === null || value === undefined) {
    display = '—';
  } else if (typeof value === 'object') {
    display = JSON.stringify(value, null, 2);
  } else {
    display = String(value);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 w-full">
      <pre className="text-xs font-mono text-text-bright bg-bg-dark p-3 rounded-lg overflow-auto max-h-[150px] w-full border border-border whitespace-pre-wrap break-all">
        {display}
      </pre>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ARRAY WIDGET (🔥 NOVO - para arrays de objetos/primitivos)
// ════════════════════════════════════════════════════════
export function ArrayWidget({ w }: { w: Widget }) {
  const value = w.currentValue;

  if (value === null || value === undefined) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="text-text-dim text-lg">—</div>
      </div>
    );
  }

  if (!Array.isArray(value)) {
    return <JsonWidget w={w} />;
  }

  // Array vazio
  if (value.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="text-text-dim text-sm">Array vazio (0 itens)</div>
      </div>
    );
  }

  // Detecta se é array de primitivos ou objetos
  const firstItem = value[0];
  const isPrimitive = !Array.isArray(firstItem) && typeof firstItem !== 'object';

  if (isPrimitive) {
    // Array de primitivos: mostra como lista separada por vírgulas
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 w-full">
        <div className="text-xs text-text-dim mb-2">{value.length} itens</div>
        <div className="flex flex-wrap gap-1 justify-center max-h-[120px] overflow-y-auto">
          {value.map((item, i) => (
            <span key={i} className="bg-bg-elevated border border-border px-2 py-1 rounded text-xs font-mono text-cyan">
              {typeof item === 'number' ? item.toFixed(2) : String(item)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Array de objetos: mostra como mini cards
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 w-full">
      <div className="text-xs text-text-dim mb-2">{value.length} objeto(s)</div>
      <div className="grid grid-cols-1 gap-1.5 w-full max-h-[150px] overflow-y-auto">
        {value.map((item, i) => (
          <div key={i} className="bg-bg-elevated border border-border rounded p-2 text-[10px]">
            <div className="text-text-dim mb-1 font-semibold">#{i + 1}</div>
            <pre className="text-text-bright font-mono whitespace-pre-wrap break-all">
              {JSON.stringify(item, null, 1)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  TABLE WIDGET ( NOVO - para arrays de objetos com estrutura similar)
// ════════════════════════════════════════════════════════
export function TableWidget({ w }: { w: Widget }) {
  const value = w.currentValue;

  if (!Array.isArray(value) || value.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="text-text-dim text-sm">Sem dados</div>
      </div>
    );
  }

  // Pega as chaves do primeiro objeto
  const firstItem = value[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return <ArrayWidget w={w} />;
  }

  const columns = Object.keys(firstItem);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 w-full">
      <div className="text-xs text-text-dim mb-2">{value.length} registro(s)</div>
      <div className="w-full overflow-x-auto max-h-[150px]">
        <table className="w-full text-[10px] font-mono border-collapse">
          <thead className="sticky top-0 bg-bg-elevated">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-2 py-1 text-left text-text-dim border-b border-border font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((item, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-bg-hover">
                {columns.map(col => (
                  <td key={col} className="px-2 py-1 text-text-bright">
                    {typeof item[col] === 'number' ? Number(item[col]).toFixed(2) : String(item[col] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}