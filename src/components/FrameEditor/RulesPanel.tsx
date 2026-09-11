"use client";

import { useCANStudio } from '@/context/CANStudioContext';

interface RulesPanelProps {
  onLoadFromApi: () => void;
  onClear: () => void;
  onSync: () => void;
  onLoadRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
}

export default function RulesPanel({
  onLoadFromApi,
  onClear,
  onSync,
  onLoadRule,
  onDeleteRule
}: RulesPanelProps) {
  const { rules, editingRuleId } = useCANStudio();

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-base text-text-bright flex items-center gap-2.5">
          📖 Regras
          <span className="text-text-dim text-xs font-normal">({rules.length})</span>
        </h2>
        <div className="flex gap-1.5">
          <button className="btn-mini" onClick={onLoadFromApi}>
            🔄 API
          </button>
          <button className="btn-mini" onClick={onClear}>
            🗑️
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto">
          {rules.length === 0 ? (
            <div className="text-center py-10 text-text-dim">
              <div className="text-3xl mb-2.5 opacity-30">📋</div>
              <div>Nenhuma regra criada</div>
              <div className="text-[11px] mt-1.5">Selecione bits e salve uma regra</div>
            </div>
          ) : (
            rules.map(rule => {
              const previewValue = (rule.startBit * rule.factor + rule.offset).toFixed(3);
              const isActive = rule.id === editingRuleId;
              
              return (
                <div
                  key={rule.id}
                  className={`bg-bg-elevated border rounded-lg p-3 cursor-pointer transition-all hover:translate-x-0.5 ${
                    isActive ? 'border-bit-selected bg-bit-selected/5' : 'border-border hover:border-accent'
                  }`}
                  onClick={() => onLoadRule(rule.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-text-bright font-semibold text-sm">
                      {isActive && '✏️ '}{rule.signalName}
                    </div>
                    <div className="bg-bg-dark text-purple px-2 py-0.5 rounded text-[11px] font-mono">
                      {rule.canId}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap text-[11px] text-text-dim mb-2">
                    <span className="bg-bg-dark px-1.5 py-0.5 rounded font-mono">
                      start:{rule.startBit}
                    </span>
                    <span className="bg-bg-dark px-1.5 py-0.5 rounded font-mono">
                      len:{rule.bitLength}
                    </span>
                    <span className="bg-bg-dark px-1.5 py-0.5 rounded font-mono">
                      ×{rule.factor}
                    </span>
                    <span className="bg-bg-dark px-1.5 py-0.5 rounded font-mono">
                      +{rule.offset}
                    </span>
                  </div>
                  <div className="text-green font-mono font-semibold text-base">
                    {previewValue} {rule.unit}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      className="btn-mini"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadRule(rule.id);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-mini text-red hover:text-white hover:bg-red"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRule(rule.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2.5 mt-4">
          <button className="btn btn-accent flex-1" onClick={onLoadFromApi}>
            🔄 Sincronizar com API
          </button>
        </div>
      </div>
    </div>
  );
}