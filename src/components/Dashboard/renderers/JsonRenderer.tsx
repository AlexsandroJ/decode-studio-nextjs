"use client";
import { Widget } from '@/context/ViewerContext';

export default function JsonRenderer({ widget }: { widget: Widget }) {
  const value = widget.currentValue;
  const display = value === null || value === undefined ? '—' : JSON.stringify(value, null, 2);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-2 px-2 w-full">
      <pre className="text-xs font-mono text-text-bright bg-bg-dark p-3 rounded-lg overflow-auto max-h-[150px] w-full border border-border">
        {display}
      </pre>
    </div>
  );
}