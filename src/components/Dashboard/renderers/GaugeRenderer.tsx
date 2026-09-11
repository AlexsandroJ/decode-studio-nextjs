"use client";
import { Widget } from '@/context/ViewerContext';

export default function GaugeRenderer({ widget }: { widget: Widget }) {
  const value = widget.currentValue;
  const isNumber = typeof value === 'number';
  const pct = isNumber ? Math.max(0, Math.min(100, ((value - widget.minValue) / (widget.maxValue - widget.minValue)) * 100)) : 0;
  
  const getStateColor = () => {
    if (widget.color !== 'auto') return widget.color;
    if (!isNumber) return 'bg-text-dim';
    if (value >= widget.dangerThreshold) return 'bg-red';
    if (value >= widget.warningThreshold) return 'bg-orange';
    return 'bg-green';
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 py-2">
      <div className={`text-2xl font-mono font-bold ${widget.color !== 'auto' ? '' : isNumber && value >= widget.dangerThreshold ? 'text-red' : isNumber && value >= widget.warningThreshold ? 'text-orange' : 'text-green'}`}>
        {isNumber ? value.toFixed(widget.decimals) : '—'} <span className="text-sm text-text-dim">{widget.field.unit}</span>
      </div>
      <div className="w-full mt-4">
        <div className="h-4 bg-bg-elevated rounded-full overflow-hidden border border-border">
          <div className={`h-full ${getStateColor()} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-text-dim mt-1.5 font-mono">
          <span>{widget.minValue}</span>
          <span>{widget.maxValue}</span>
        </div>
      </div>
    </div>
  );
}