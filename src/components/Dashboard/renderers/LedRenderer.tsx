"use client";
import { Widget } from '@/context/ViewerContext';

export default function LedRenderer({ widget }: { widget: Widget }) {
  const value = widget.currentValue;
  const isNumber = typeof value === 'number';
  
  let stateClass = 'bg-text-dim shadow-none';
  if (isNumber) {
    if (value >= widget.dangerThreshold) stateClass = 'bg-red shadow-[0_0_15px_rgba(248,81,73,0.6)]';
    else if (value >= widget.warningThreshold) stateClass = 'bg-orange shadow-[0_0_15px_rgba(210,153,34,0.6)]';
    else stateClass = 'bg-green shadow-[0_0_15px_rgba(63,185,80,0.6)]';
  } else if (typeof value === 'boolean') {
    stateClass = value ? 'bg-green shadow-[0_0_15px_rgba(63,185,80,0.6)]' : 'bg-red shadow-[0_0_15px_rgba(248,81,73,0.6)]';
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4">
      <div className={`w-10 h-10 rounded-full transition-all duration-500 ${stateClass}`} />
      <div className="text-2xl font-mono font-semibold mt-4">
        {isNumber ? value.toFixed(widget.decimals) : String(value ?? '—')}
      </div>
      {widget.field.unit && <div className="text-sm text-text-dim mt-1">{widget.field.unit}</div>}
    </div>
  );
}