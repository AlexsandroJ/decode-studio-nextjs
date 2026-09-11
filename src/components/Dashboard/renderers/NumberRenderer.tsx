"use client";
import { Widget } from '@/context/ViewerContext';

export default function NumberRenderer({ widget }: { widget: Widget }) {
  const value = widget.currentValue;
  const isNumber = typeof value === 'number';
  
  const getStateColor = () => {
    if (widget.color !== 'auto') return widget.color;
    if (!isNumber) return 'text-text-bright';
    if (value >= widget.dangerThreshold) return 'text-red';
    if (value >= widget.warningThreshold || value < widget.minValue) return 'text-orange';
    return 'text-green';
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4">
      <div className={`text-4xl font-mono font-bold ${getStateColor()} transition-colors`}>
        {isNumber ? value.toFixed(widget.decimals) : String(value ?? '—')}
      </div>
      {widget.field.unit && <div className="text-text-dim text-sm mt-1">{widget.field.unit}</div>}
    </div>
  );
}