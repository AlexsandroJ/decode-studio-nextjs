"use client";
import { Widget } from '@/context/ViewerContext';

export default function TextRenderer({ widget }: { widget: Widget }) {
  const value = widget.currentValue;
  const display = value === null || value === undefined ? '—' : String(value);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4 px-2">
      <div className="text-lg font-mono text-text-bright break-all text-center">
        {display}
      </div>
      {widget.field.unit && <div className="text-sm text-text-dim mt-1">{widget.field.unit}</div>}
    </div>
  );
}