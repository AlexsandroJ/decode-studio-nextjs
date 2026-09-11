"use client";
import { Widget } from '@/context/ViewerContext';
import { 
  NumberWidget, 
  GaugeWidget, 
  BarWidget, 
  SparklineWidget, 
  LedWidget,
  TextWidget,
  JsonWidget,
  ArrayWidget,
  TableWidget
} from './WidgetRenderers';

interface WidgetCardProps {
  w: Widget;
  onEdit: () => void;
  onRemove: () => void;
}

function getBestRenderer(w: Widget) {
  const valueType = typeof w.currentValue;
  const isArray = Array.isArray(w.currentValue);

  if (w.displayType === 'gauge') return GaugeWidget;
  if (w.displayType === 'bar') return BarWidget;
  if (w.displayType === 'sparkline') return SparklineWidget;
  if (w.displayType === 'led') return LedWidget;
  if (w.displayType === 'table') return TableWidget;
  if (w.displayType === 'json') return JsonWidget;
  if (w.displayType === 'array') return ArrayWidget;

  if (isArray) {
    if (w.currentValue.length > 0 && typeof w.currentValue[0] === 'object' && w.currentValue[0] !== null) {
      return TableWidget;
    }
    return ArrayWidget;
  }

  if (valueType === 'number') return NumberWidget;
  if (valueType === 'boolean') return LedWidget;
  if (valueType === 'object' && w.currentValue !== null) return JsonWidget;
  
  return TextWidget;
}

export default function WidgetCard({ w, onEdit, onRemove }: WidgetCardProps) {
  const displayName = w.customLabel || w.field?.label || 'Widget';
  
  const Renderer = getBestRenderer(w);

  const sourceBadge = w.type === 'can-signal' ? 'bg-purple/15 text-purple' : 
                      w.type === 'sensor' ? 'bg-cyan/15 text-cyan' : 'bg-orange/15 text-orange';

  return (
    <div className="bg-bg-panel border border-border rounded-xl p-4 flex flex-col relative group hover:border-border-bright transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-text-bright font-semibold text-sm truncate" title={displayName}>
            {displayName}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${sourceBadge}`}>
            {w.type === 'can-signal' ? 'CAN' : w.type === 'sensor' ? 'Sensor' : 'Unified'}
          </span>
        </div>
        
        {/* Action Buttons - sempre visíveis ou no hover */}
        <div className="flex gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-bg-elevated hover:bg-bg-hover border border-border text-text-dim hover:text-text-bright transition-colors"
            title="Editar widget"
          >
            ⚙️
          </button>
          <button 
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-bg-elevated hover:bg-red/20 border border-border text-text-dim hover:text-red transition-colors"
            title="Remover widget"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 flex items-center justify-center min-h-[100px]">
        <Renderer w={w} />
      </div>
      
      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-text-dim font-mono flex justify-between items-center">
        <span className="truncate max-w-[60%]" title={w.field?.path}>
          {w.field?.path || '—'}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${w.currentValue !== undefined ? 'bg-green animate-pulse' : 'bg-text-dim'}`} />
          {w.lastUpdated ? new Date(w.lastUpdated).toLocaleTimeString('pt-BR') : 'Aguardando...'}
        </span>
      </div>
    </div>
  );
}