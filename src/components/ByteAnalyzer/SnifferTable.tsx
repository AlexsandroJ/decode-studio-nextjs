"use client";
import { hexToBytes } from '@/lib/utils';

interface Props {
    ids: string[];
    framesByCanId: Record<string, any[]>;
    frequencies: Record<string, number>;
    selectedCanId: string | null;
    filter: string;
    onFilterChange: (v: string) => void;
    onSelect: (id: string) => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export default function SnifferTable({ ids, framesByCanId, frequencies, selectedCanId, filter, onFilterChange, onSelect, onRefresh, isLoading }: Props) {
    return (
        <div className="bg-bg-dark border border-border rounded-lg overflow-hidden">
            <div className="flex flex-wrap justify-between items-center p-3 bg-bg-elevated border-b border-border gap-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-text-bright text-sm font-semibold">📡 Sniffer — Todos os CAN IDs</h3>
                    <span className="text-text-dim text-[11px]">(clique para analisar)</span>
                </div>
                <div className="flex gap-2 items-center">
                    <input type="text" placeholder="Filtrar ID..." className="bg-bg-dark border border-border text-text px-2.5 py-1.5 rounded text-xs w-[150px] focus:outline-none focus:border-accent" value={filter} onChange={(e) => onFilterChange(e.target.value)} />

                    <button className="btn-mini w-full" onClick={onRefresh}>
                        🔄 Atualizar agora
                    </button>
                </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                    <thead className="bg-bg-elevated sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[100px]">CAN ID</th>
                            <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[80px]">Freq</th>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <th key={i} className="px-3 py-2 text-center text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[60px]">{i}</th>)}
                            <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[70px]">Frames</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ids.length === 0 ? (
                            <tr><td colSpan={11} className="text-center py-8 text-text-dim">Nenhum CAN ID encontrado</td></tr>
                        ) : ids.map(canId => {
                            const frames = framesByCanId[canId];
                            const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp);
                            const latest = sorted[sorted.length - 1];
                            const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
                            const bytes = hexToBytes(latest.data);
                            const pBytes = prev ? hexToBytes(prev.data) : null;

                            return (
                                <tr key={canId} className={`transition-colors cursor-pointer border-b border-border/50 ${selectedCanId === canId ? 'bg-accent/10' : 'hover:bg-bg-hover'}`} onClick={() => onSelect(canId)}>
                                    <td className="px-3 py-2 text-purple font-semibold font-mono">{canId}</td>
                                    <td className="px-3 py-2"><span className="inline-block bg-bg-elevated text-cyan px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold">{frequencies[canId] || 0} Hz</span></td>
                                    {bytes.map((b, i) => {
                                        let cls = 'bg-bg-elevated text-text';
                                        if (pBytes) {
                                            if (b > pBytes[i]) cls = 'bg-green/20 text-green font-bold shadow-[0_0_8px_rgba(63,185,80,0.3)]';
                                            else if (b < pBytes[i]) cls = 'bg-red/20 text-red font-bold shadow-[0_0_8px_rgba(248,81,73,0.3)]';
                                        }
                                        return <td key={i} className="px-3 py-2 text-center"><span className={`inline-block min-w-[32px] px-2 py-1 rounded text-xs font-mono transition-all ${cls}`}>{b.toString(16).toUpperCase().padStart(2, '0')}</span></td>;
                                    })}
                                    <td className="px-3 py-2 text-text-dim text-[11px]">{frames.length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}