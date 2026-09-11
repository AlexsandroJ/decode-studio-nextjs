"use client";
import { Widget } from '@/context/ViewerContext';

export default function SparklineRenderer({ widget }: { widget: Widget }) {
  if (widget.history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="text-2xl font-mono font-bold text-text-bright">
          {typeof widget.currentValue === 'number' ? widget.currentValue.toFixed(widget.decimals) : '—'}
        </div>
        <div className="text-text-dim text-xs mt-2">Coletando histórico...</div>
      </div>
    );
  }

  const min = Math.min(...widget.history, widget.minValue);
  const max = Math.max(...widget.history, widget.maxValue);
  const range = max - min || 1;
  const width = 200, height = 60;

  const points = widget.history.map((v, i) => {
    const x = (i / (widget.history.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full py-2">
      <div className="text-xl font-mono font-bold text-text-bright">
        {widget.currentValue !== undefined ? Number(widget.currentValue).toFixed(widget.decimals) : '—'}
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-3">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent" />
      </svg>
    </div>
  );
}