"use client";

interface Props {
  selectedCanId: string | null;
  latestBytes: number[];
  translations: Record<number, { label: string; type: string }>;
  onUpdate: (index: number, field: 'label' | 'type', value: string) => void;
  onExport: () => void;
}

export default function TranslationsTable({ selectedCanId, latestBytes, translations, onUpdate, onExport }: Props) {
  if (!selectedCanId) return null;

  return (
    <div className="bg-bg-dark border border-border rounded-lg overflow-hidden">
      <div className="p-4 bg-bg-elevated border-b border-border flex justify-between items-center">
        <h3 className="text-text-bright text-sm font-semibold">📝 Traduções dos Bytes</h3>
        <button className="btn-mini" onClick={onExport}>💾 Exportar</button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px] grid grid-cols-[80px_1fr_150px_150px] gap-px bg-border">
          <div className="bg-bg-elevated p-3 text-[11px] uppercase text-text-dim font-semibold">Byte</div>
          <div className="bg-bg-elevated p-3 text-[11px] uppercase text-text-dim font-semibold">Label / Nome</div>
          <div className="bg-bg-elevated p-3 text-[11px] uppercase text-text-dim font-semibold">Tipo</div>
          <div className="bg-bg-elevated p-3 text-[11px] uppercase text-text-dim font-semibold">Valor Atual</div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const trans = translations[i] || { label: '', type: 'uint8' };
            const value = latestBytes[i];
            return (
              <Fragment key={i}>
                <div className="bg-bg-dark p-3 text-xs font-mono text-text-dim">Byte {i}</div>
                <div className="bg-bg-dark p-2">
                  <input type="text" className="w-full bg-transparent border border-transparent text-text px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-accent focus:bg-bg-elevated transition-all" value={trans.label} onChange={(e) => onUpdate(i, 'label', e.target.value)} placeholder="Nome do sinal..." />
                </div>
                <div className="bg-bg-dark p-2">
                  <select className="w-full bg-transparent border border-transparent text-text px-2 py-1 rounded text-xs focus:outline-none focus:border-accent focus:bg-bg-elevated transition-all" value={trans.type} onChange={(e) => onUpdate(i, 'type', e.target.value)}>
                    <option value="uint8" className="bg-bg-elevated">uint8</option>
                    <option value="int8" className="bg-bg-elevated">int8</option>
                    <option value="hex" className="bg-bg-elevated">hex</option>
                    <option value="bitfield" className="bg-bg-elevated">bitfield</option>
                  </select>
                </div>
                <div className="bg-bg-dark p-3 text-xs text-cyan font-mono">0x{value.toString(16).toUpperCase().padStart(2, '0')} ({value})</div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Fragment({ children }: { children: React.ReactNode }) { return <>{children}</>; }