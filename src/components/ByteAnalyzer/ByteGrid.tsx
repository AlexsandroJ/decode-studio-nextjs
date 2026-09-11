"use client";

interface Props {
  selectedCanId: string | null;
  latestBytes: number[];
  prevBytes: number[] | null;
  translations: Record<number, { label: string; type: string }>;
  onEditLabel: (index: number) => void;
}

export default function ByteGrid({ selectedCanId, latestBytes, prevBytes, translations, onEditLabel }: Props) {
  if (!selectedCanId) {
    return (
      <div className="bg-bg-dark border border-border rounded-lg p-5 text-center py-12 text-text-dim bg-bg-elevated/30 border-dashed">
        <div className="text-4xl mb-3 opacity-30">🔍</div>
        <div>Selecione um CAN ID na tabela ou na lista lateral</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-dark border border-border rounded-lg p-5">
      <h3 className="text-text-bright text-base mb-4 flex items-center gap-2.5">🔬 Análise de Bytes — <span className="text-purple font-mono text-lg">{selectedCanId}</span></h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {latestBytes.map((byte, i) => {
          let change = 'same';
          let arrow = '';
          if (prevBytes) {
            if (byte > prevBytes[i]) { change = 'increased'; arrow = '↑'; }
            else if (byte < prevBytes[i]) { change = 'decreased'; arrow = '↓'; }
          }
          const label = translations[i]?.label || '';
          const bgClass = change === 'increased' ? 'bg-green/20 border-green shadow-[0_0_12px_rgba(63,185,80,0.3)]' :
                          change === 'decreased' ? 'bg-red/20 border-red shadow-[0_0_12px_rgba(248,81,73,0.3)]' : 'bg-bg-elevated border-border';
          const arrowColor = change === 'increased' ? 'text-green' : change === 'decreased' ? 'text-red' : 'text-transparent';

          return (
            <div key={i} className={`relative border-2 rounded-lg p-4 text-center transition-all duration-300 ${bgClass}`}>
              {arrow && <div className={`absolute top-1 right-1.5 text-base font-bold ${arrowColor}`}>{arrow}</div>}
              <div className="text-[10px] text-text-dim uppercase mb-2">Byte {i}</div>
              <div className="font-mono text-2xl font-bold text-text-bright mb-1">0x{byte.toString(16).toUpperCase().padStart(2, '0')}</div>
              <div className="font-mono text-xs text-text-dim mb-3">{byte}</div>
              <button className={`w-full text-[11px] px-2 py-1 rounded bg-bg-dark transition-all hover:bg-bg-hover ${label ? 'text-cyan' : 'italic text-text-dim'}`} onClick={() => onEditLabel(i)}>
                {label || 'Clique para nomear'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}