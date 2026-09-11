"use client";
import { hexToBytes } from '@/lib/utils';

interface Props {
  selectedCanId: string | null;
  frames: any[];
  formatTime: (ts: number) => string;
}

export default function FramesHistory({ selectedCanId, frames, formatTime }: Props) {
  if (!selectedCanId || frames.length === 0) return null;

  const last20 = [...frames].slice(-20).reverse();

  return (
    <div className="bg-bg-dark border border-border rounded-lg overflow-hidden">
      <div className="p-4 bg-bg-elevated border-b border-border">
        <h3 className="text-text-bright text-sm font-semibold">📜 Histórico de Frames (últimos 20)</h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-bg-elevated sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[140px]">Timestamp</th>
              <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border">Bytes (hex)</th>
              <th className="px-3 py-2 text-left text-text-dim font-semibold uppercase tracking-wider border-b border-border w-[60px]">DLC</th>
            </tr>
          </thead>
          <tbody>
            {last20.map((frame, idx, arr) => {
              const prevFrame = idx < arr.length - 1 ? arr[idx + 1] : null;
              const pBytes = prevFrame ? hexToBytes(prevFrame.data) : null;
              const bytes = hexToBytes(frame.data);
              return (
                <tr key={frame.id || idx} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-3 py-2 text-text-dim font-mono text-[11px] whitespace-nowrap">{formatTime(frame.timestamp)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {bytes.map((b, i) => {
                        let cls = 'text-text-dim';
                        if (pBytes) {
                          if (b > pBytes[i]) cls = 'bg-green/20 text-green';
                          else if (b < pBytes[i]) cls = 'bg-red/20 text-red';
                          else cls = 'text-text';
                        }
                        return <span key={i} className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${cls}`}>{b.toString(16).toUpperCase().padStart(2, '0')}</span>;
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-dim font-mono">{frame.dlc || 8}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}