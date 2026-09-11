"use client";

interface Props {
    ids: string[];
    framesByCanId: Record<string, any[]>;
    selectedCanId: string | null;
    search: string;
    onSearchChange: (v: string) => void;
    autoRefresh: boolean;
    onAutoRefreshChange: (v: boolean) => void;
    interval: number;
    onIntervalChange: (v: number) => void;
    onRefresh: () => void;
    isLoading: boolean;
    onSelect: (id: string) => void;
}

export default function Sidebar({ ids, framesByCanId, selectedCanId, search, onSearchChange, autoRefresh, onAutoRefreshChange, interval, onIntervalChange, onRefresh, isLoading, onSelect }: Props) {
    return (
        <div className="bg-bg-dark border border-border rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-bg-elevated border-b border-border">
                <h3 className="text-text-bright text-sm font-semibold mb-2">📋 IDs Disponíveis</h3>
                <input type="text" placeholder="🔍 Buscar ID..." className="w-full bg-bg-dark border border-border text-text px-2.5 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-accent" value={search} onChange={(e) => onSearchChange(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px]">
                {ids.length === 0 ? (
                    <div className="text-center py-8 text-text-dim"><div className="text-3xl mb-2 opacity-30">📡</div><div>Nenhum CAN ID</div></div>
                ) : ids.map(id => (
                    <div key={id} className={`p-3 border-b border-border cursor-pointer transition-all flex justify-between items-center ${selectedCanId === id ? 'bg-accent/10 border-l-[3px] border-l-accent' : 'hover:bg-bg-hover'}`} onClick={() => onSelect(id)}>
                        <span className="text-purple font-mono font-semibold text-sm">{id}</span>
                        <span className="text-text-dim text-[11px] bg-bg-elevated px-2 py-0.5 rounded-full">{framesByCanId[id].length} frames</span>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-border space-y-3 bg-bg-elevated/50">
                <label className="flex items-center gap-2 text-xs text-text-dim cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-accent rounded" checked={autoRefresh} onChange={(e) => onAutoRefreshChange(e.target.checked)} /> Auto-refresh
                </label>
                <div className="flex items-center gap-2 text-xs text-text-dim">
                    <span>Intervalo:</span>
                    <input type="number" className="w-20 bg-bg-dark border border-border text-text px-2 py-1 rounded text-xs focus:outline-none focus:border-accent" value={interval} onChange={(e) => onIntervalChange(parseInt(e.target.value) || 1000)} min={100} step={100} /> <span>ms</span>
                </div>
                <button className="btn-mini w-full" onClick={onRefresh}>
                    🔄 Atualizar
                </button>
            </div>
        </div>
    );
}