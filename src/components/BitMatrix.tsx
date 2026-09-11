"use client";
import { useCANStudio } from '@/context/CANStudioContext';
import { useState, useEffect } from 'react';

export default function BitMatrix() {
  const { bytes, selectedBits, setSelectedBits, lastClickedBit, setLastClickedBit, setBytes } = useCANStudio();
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, bi: number) => {
    if (e.shiftKey) return;
    setIsDragging(true);
    const next = new Set(selectedBits);
    if (selectedBits.has(bi)) {
      setDragMode('remove');
      next.delete(bi);
    } else {
      setDragMode('add');
      next.add(bi);
    }
    setSelectedBits(next);
    setLastClickedBit(bi);
  };

  const handleMouseEnter = (e: React.MouseEvent, bi: number) => {
    if (!isDragging || !dragMode) return;
    const next = new Set(selectedBits);
    if (dragMode === 'add') next.add(bi);
    else next.delete(bi);
    setSelectedBits(next);
  };

  useEffect(() => {
    const handleUp = () => { setIsDragging(false); setDragMode(null); };
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  const handleClick = (e: React.MouseEvent, bi: number) => {
    if (e.shiftKey && lastClickedBit !== null) {
      const start = Math.min(lastClickedBit, bi);
      const end = Math.max(lastClickedBit, bi);
      const next = new Set(selectedBits);
      for (let i = start; i <= end; i++) next.add(i);
      setSelectedBits(next);
    } else if (!isDragging) {
      const byteIdx = Math.floor(bi / 8);
      const bitPos = 7 - (bi % 8);
      const newBytes = [...bytes];
      newBytes[byteIdx] ^= (1 << bitPos);
      setBytes(newBytes);
    }
  };

  return (
    <div className="bg-bg-dark border border-border rounded-lg p-4 mb-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm text-text-bright">
          🔢 Matriz de Bits <span className="text-text-dim font-normal text-[11px]">(clique para alternar • shift+clique para range)</span>
        </h3>
        <div className="flex gap-1.5">
          <button className="btn-mini" onClick={() => setSelectedBits(new Set())}>Limpar seleção</button>
          <button className="btn-mini" onClick={() => {
            const s = new Set<number>();
            for(let i=0;i<64;i++) s.add(i);
            setSelectedBits(s);
          }}>Selecionar todos</button>
        </div>
      </div>

      <div className="flex gap-[3px] mb-1 ml-[68px]">
        {[7,6,5,4,3,2,1,0].map(b => (
          <span key={b} className="w-10 text-center text-[10px] text-text-dim font-mono">bit{b}</span>
        ))}
      </div>

      {bytes.map((byteVal, bi) => (
        <div key={bi} className="flex items-center gap-2 mb-1">
          <div className="w-[60px] text-text-dim text-[11px] font-semibold text-right">
            Byte {bi}<br/>
            <span className="text-cyan text-[10px]">0x{byteVal.toString(16).toUpperCase().padStart(2,'0')}</span>
          </div>
          <div className="flex gap-[3px] flex-1">
            {[7,6,5,4,3,2,1,0].map(bp => {
              const gi = bi * 8 + (7 - bp);
              const bv = (byteVal >> bp) & 1;
              const sel = selectedBits.has(gi);
              const cls = sel
                ? 'bg-bit-selected text-white border-[#ffa657] shadow-[0_0_10px_rgba(247,129,102,0.5)]'
                : bv
                ? 'bg-bit-on text-white shadow-[0_0_8px_rgba(31,111,235,0.4)]'
                : 'bg-bit-off text-text-dim';
              
              return (
                <div
                  key={bp}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-[13px] font-semibold cursor-pointer transition-all duration-100 border-2 select-none relative hover:scale-105 hover:border-bit-hover ${cls}`}
                  onMouseDown={(e) => handleMouseDown(e, gi)}
                  onMouseEnter={(e) => handleMouseEnter(e, gi)}
                  onClick={(e) => handleClick(e, gi)}
                >
                  {bv}
                  <span className="absolute top-[1px] right-[3px] text-[8px] opacity-50">{gi}</span>
                </div>
              );
            })}
          </div>
          <div className="w-[60px] text-cyan text-[13px] font-semibold">= {byteVal}</div>
        </div>
      ))}
    </div>
  );
}
