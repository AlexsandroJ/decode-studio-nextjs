"use client";
import { useState, useEffect, useMemo } from 'react';
import { useViewer, Widget, flattenObject } from '@/context/ViewerContext';
import FieldExplorer from './FieldExplorer';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWidgetId: string | null;
}

export default function ConfigModal({ isOpen, onClose, editingWidgetId }: ConfigModalProps) {
  const {
    widgets, addWidgets, updateWidgetConfig,
    availableRules, availableSensors, availableUnified, loadData
  } = useViewer();

  const [activeTab, setActiveTab] = useState<'signals' | 'sensors' | 'unified'>('signals');
  const [isLoading, setIsLoading] = useState(false);

  // Filtro e seleção
  const [sensorFilter, setSensorFilter] = useState('');
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [selectedSensorFields, setSelectedSensorFields] = useState<Set<string>>(new Set());

  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [selectedUnifiedIds, setSelectedUnifiedIds] = useState<Set<string>>(new Set());

  // Edit form
  const editingWidget = editingWidgetId ? widgets.find(w => w.id === editingWidgetId) : null;
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (editingWidget) {
      setEditForm({
        customLabel: editingWidget.customLabel || '',
        displayType: editingWidget.displayType,
        field: editingWidget.field,
        minValue: editingWidget.minValue,
        maxValue: editingWidget.maxValue,
        warningThreshold: editingWidget.warningThreshold,
        dangerThreshold: editingWidget.dangerThreshold,
        decimals: editingWidget.decimals,
        color: editingWidget.color
      });
    }
  }, [editingWidget]);

  // ════════════════════════════════════════════════════════
  //  AGRUPAMENTO DE SENSORES POR sensorId (ÚNICO)
  // ════════════════════════════════════════════════════════
  const uniqueSensorsMap = useMemo(() => {
    const map = new Map<string, typeof availableSensors>();

    availableSensors.forEach(sensor => {
      if (!sensor.sensorId) return;
      if (!map.has(sensor.sensorId)) {
        map.set(sensor.sensorId, []);
      }
      map.get(sensor.sensorId)!.push(sensor);
    });

    return map;
  }, [availableSensors]);

  // Lista filtrada de sensores únicos para exibição
  const filteredUniqueSensors = useMemo(() => {
    const result = Array.from(uniqueSensorsMap.entries()).map(([sensorId, sensors]) => ({
      sensorId,
      sensorType: sensors[0]?.sensorType || 'unknown',
      count: sensors.length,
      exampleSensor: sensors[0] // Usa o primeiro como template para o FieldExplorer
    }));

    if (!sensorFilter.trim()) return result;

    const filter = sensorFilter.toLowerCase();
    return result.filter(s =>
      s.sensorId.toLowerCase().includes(filter) ||
      s.sensorType.toLowerCase().includes(filter)
    );
  }, [uniqueSensorsMap, sensorFilter]);

  if (!isOpen) return null;

  const handleLoadData = async () => {
    setIsLoading(true);
    await loadData();
    setIsLoading(false);
  };

  // ════════════════════════════════════════════════════════
  //  AÇÕES DE ADIÇÃO
  // ════════════════════════════════════════════════════════

  // Adiciona widgets baseados no sensorId (monitora TODAS as instâncias desse tipo)
  const addSelectedSensorFieldsByType = (sensorId: string) => {
    const sensors = uniqueSensorsMap.get(sensorId);
    if (!sensors || sensors.length === 0) return;

    const templateSensor = sensors[0];
    const fields = flattenObject(templateSensor);
    const toAdd = fields.filter(f => selectedSensorFields.has(f.path));

    // Dentro de addSelectedSensorFieldsByType, ao criar o widget:

    const newWidgets = toAdd.map(field => {
      // 🔥 Auto-detecção do melhor displayType
      let suggestedDisplayType: any = 'number';

      if (field.dataType === 'number') {
        suggestedDisplayType = 'number';
      } else if (field.dataType === 'boolean') {
        suggestedDisplayType = 'led';
      } else if (field.dataType === 'array') {
        // Se é array de objetos, sugere tabela; se de primitivos, sugere array
        if (Array.isArray(field.example) && field.example.length > 0 && typeof field.example[0] === 'object') {
          suggestedDisplayType = 'table';
        } else {
          suggestedDisplayType = 'array';
        }
      } else if (field.dataType === 'object') {
        suggestedDisplayType = 'json';
      } else {
        suggestedDisplayType = 'text';
      }

      return {
        id: `w_${sensorId}_${field.path.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`,
        type: 'sensor' as const,
        sourceId: sensorId,
        name: sensorId,
        sensorType: templateSensor.sensorType,
        field: {
          ...field,
          path: field.path
        },
        displayType: suggestedDisplayType, // 🔥 Tipo inteligente
        minValue: 0,
        maxValue: 100,
        warningThreshold: 70,
        dangerThreshold: 90,
        decimals: 2,
        customLabel: `${sensorId} - ${field.label}`,
        color: 'auto'
      };
    });

    addWidgets(newWidgets);
    setSelectedSensorFields(new Set());
  };

  const addSelectedRules = () => {
    const toAdd = availableRules.filter(r => selectedRuleIds.has(r.id));
    const newWidgets = toAdd.map(rule => ({
      id: `w_${rule.id}_${Date.now().toString(36)}`,
      type: 'can-signal' as const,
      sourceId: rule.id,
      name: rule.signalName,
      canId: rule.canId,
      field: {
        path: 'value',
        label: rule.signalName,
        dataType: 'number' as const,
        unit: rule.unit
      },
      displayType: 'number' as const,
      minValue: rule.minValue ?? 0,
      maxValue: rule.maxValue ?? 100,
      warningThreshold: (rule.maxValue ?? 100) * 0.7,
      dangerThreshold: (rule.maxValue ?? 100) * 0.9,
      decimals: 2,
      customLabel: '',
      color: 'auto'
    }));
    addWidgets(newWidgets);
    setSelectedRuleIds(new Set());
  };

  const addSelectedUnified = () => {
    const toAdd = availableUnified.filter(u => selectedUnifiedIds.has(u.id));
    const newWidgets = toAdd.map(record => ({
      id: `w_${record.id}_${Date.now().toString(36)}`,
      type: 'unified' as const,
      sourceId: record.id,
      name: `Unified ${record.source}`,
      field: {
        path: 'source',
        label: 'Source',
        dataType: 'string' as const
      },
      displayType: 'text' as const,
      minValue: 0,
      maxValue: 100,
      warningThreshold: 70,
      dangerThreshold: 90,
      decimals: 2,
      customLabel: `Unified - ${record.source}`,
      color: 'auto'
    }));
    addWidgets(newWidgets);
    setSelectedUnifiedIds(new Set());
  };

  // ════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-panel border border-border rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b border-border flex justify-between items-center bg-bg-elevated rounded-t-xl">
          <h2 className="text-xl font-semibold text-text-bright">
            {editingWidget ? `✏️ Editar: ${editingWidget.customLabel || editingWidget.field?.label || 'Widget'}` : '⚙️ Configurar Dashboard'}
          </h2>
          <button className="btn-mini" onClick={onClose}>✕ Fechar</button>
        </div>

        {!editingWidget && (
          <div className="flex border-b border-border bg-bg-elevated">
            {[
              { id: 'signals', label: '📡 Sinais CAN' },
              { id: 'sensors', label: '🌡️ Sensores' },
              { id: 'unified', label: '🔗 Unified' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-text-dim hover:text-text'
                  }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">
          {editingWidget ? (
            // ══════════════════════════════════════════════
            //  MODO DE EDIÇÃO
            // ══════════════════════════════════════════════
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-dim mb-2">Nome Personalizado</label>
                  <input className="input-field" value={editForm.customLabel || ''}
                    onChange={(e) => setEditForm({ ...editForm, customLabel: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-dim mb-2">Tipo de Visualização</label>
                  <select className="input-field" value={editForm.displayType}
                    onChange={(e) => setEditForm({ ...editForm, displayType: e.target.value })}>
                    <option value="number">🔢 Número</option>
                    <option value="gauge">📊 Gauge</option>
                    <option value="sparkline">📉 Sparkline</option>
                    <option value="text">📝 Texto</option>
                    <option value="json">📄 JSON</option>
                    <option value="led">🔴 LED</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="btn btn-primary flex-1" onClick={() => {
                  updateWidgetConfig(editingWidgetId!, editForm);
                  onClose();
                }}>💾 Salvar</button>
                <button className="btn" onClick={onClose}>Cancelar</button>
              </div>
            </div>
          ) : activeTab === 'signals' ? (
            // ══════════════════════════════════════════════
            //  ABA: SINAIS CAN
            // ══════════════════════════════════════════════
            <div className="space-y-4">
              <button className="btn btn-primary" onClick={handleLoadData} disabled={isLoading}>
                {isLoading ? '⏳ Carregando...' : '🔄 Carregar Sinais CAN'}
              </button>
              {availableRules.length > 0 && (
                <div className="bg-accent/5 border border-accent/30 rounded-lg p-3 flex justify-between items-center">
                  <label className="flex items-center gap-3 cursor-pointer text-text-bright font-semibold">
                    <input type="checkbox" className="w-5 h-5 accent-accent"
                      checked={selectedRuleIds.size === availableRules.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRuleIds(new Set(availableRules.map(r => r.id)));
                        else setSelectedRuleIds(new Set());
                      }}
                    />
                    Selecionar Todos ({selectedRuleIds.size})
                  </label>
                  <button className="btn btn-accent text-sm" onClick={addSelectedRules} disabled={selectedRuleIds.size === 0}>
                    ➕ Adicionar ({selectedRuleIds.size})
                  </button>
                </div>
              )}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableRules.length === 0 ? (
                  <div className="text-center py-12 text-text-dim">
                    <div className="text-4xl mb-3 opacity-30">📡</div>
                    <p>Clique em carregar para ver sinais</p>
                  </div>
                ) : availableRules.map(rule => (
                  <div key={rule.id} className={`flex items-center gap-3 p-3 bg-bg-dark border rounded-lg ${selectedRuleIds.has(rule.id) ? 'border-accent bg-accent/5' : 'border-border hover:bg-bg-hover'
                    }`}>
                    <input type="checkbox" className="w-5 h-5 accent-accent"
                      checked={selectedRuleIds.has(rule.id)}
                      onChange={(e) => {
                        const next = new Set(selectedRuleIds);
                        e.target.checked ? next.add(rule.id) : next.delete(rule.id);
                        setSelectedRuleIds(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-text-bright font-semibold text-sm">{rule.signalName}</div>
                      <div className="text-text-dim text-xs font-mono">CAN ID: {rule.canId} • {rule.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'sensors' ? (
            // ══════════════════════════════════════════════
            //  ABA: SENSORES (AGRUPADOS POR sensorId)
            // ══════════════════════════════════════════════
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-4">
                <button className="btn btn-primary w-full" onClick={handleLoadData} disabled={isLoading}>
                  {isLoading ? '⏳ Carregando...' : '🔄 Carregar Sensores'}
                </button>

                <input
                  type="text"
                  placeholder="🔍 Filtrar por nome ou tipo..."
                  className="input-field text-sm"
                  value={sensorFilter}
                  onChange={(e) => setSensorFilter(e.target.value)}
                />

                <div className="bg-bg-dark border border-border rounded-lg p-3 max-h-[500px] overflow-y-auto">
                  <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center justify-between">
                    <span>Tipos de Sensores</span>
                    {filteredUniqueSensors.length > 0 && (
                      <span className="text-xs text-text-dim font-normal">
                        ({filteredUniqueSensors.length} tipo{filteredUniqueSensors.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h3>

                  {uniqueSensorsMap.size === 0 ? (
                    <div className="text-center py-8 text-text-dim text-sm">
                      <div className="text-4xl mb-3 opacity-30">🌡️</div>
                      <p>Clique em "Carregar Sensores"</p>
                    </div>
                  ) : filteredUniqueSensors.length === 0 ? (
                    <div className="text-center py-8 text-text-dim text-sm">
                      <p>Nenhum sensor encontrado para "{sensorFilter}"</p>
                    </div>
                  ) : (
                    filteredUniqueSensors.map(({ sensorId, sensorType, count, exampleSensor }) => (
                      <div
                        key={sensorId}
                        className={`p-3 mb-2 rounded-lg cursor-pointer transition-all border ${selectedSensorId === sensorId
                          ? 'bg-cyan/15 border-cyan border-2'
                          : 'bg-bg-elevated border-border hover:bg-bg-hover'
                          }`}
                        onClick={() => {
                          setSelectedSensorId(sensorId);
                          setSelectedSensorFields(new Set());
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-text-bright text-sm">
                                {sensorId}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-dark text-text-dim font-mono border border-border">
                                {count} instância{count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-xs text-text-dim font-mono mt-0.5">
                              Tipo: {sensorType}
                            </div>
                            {exampleSensor?.id && (
                              <div className="text-[10px] text-text-dim/70 font-mono mt-1 truncate">
                                Exemplo ID: {exampleSensor.id}
                              </div>
                            )}
                          </div>
                          {selectedSensorId === sensorId && (
                            <span className="text-cyan text-lg shrink-0">✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedSensorId && (() => {
                  const sensorGroup = uniqueSensorsMap.get(selectedSensorId);
                  const templateSensor = sensorGroup?.[0];

                  if (!templateSensor) return null;

                  return (
                    <>
                      <FieldExplorer
                        data={templateSensor}
                        selectedPaths={selectedSensorFields}
                        onTogglePath={(path) => {
                          const next = new Set(selectedSensorFields);
                          if (next.has(path)) next.delete(path);
                          else next.add(path);
                          setSelectedSensorFields(next);
                        }}
                        title={`Campos de ${selectedSensorId}`}
                      />
                      {selectedSensorFields.size > 0 && (
                        <button
                          className="btn btn-accent w-full"
                          onClick={() => addSelectedSensorFieldsByType(selectedSensorId)}
                        >
                          ➕ Adicionar {selectedSensorFields.size} Campo(s) para TODOS "{selectedSensorId}"
                        </button>
                      )}
                    </>
                  );
                })()}
                {!selectedSensorId && (
                  <div className="text-center py-20 text-text-dim border-2 border-dashed border-border rounded-lg">
                    <div className="text-4xl mb-3 opacity-30">🌡️</div>
                    <p>Selecione um tipo de sensor ao lado para explorar seus campos</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ══════════════════════════════════════════════
            //  ABA: UNIFIED
            // ══════════════════════════════════════════════
            <div className="space-y-4">
              <button className="btn btn-primary" onClick={handleLoadData} disabled={isLoading}>
                {isLoading ? '⏳ Carregando...' : '🔄 Carregar Unified'}
              </button>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableUnified.length === 0 ? (
                  <div className="text-center py-12 text-text-dim">
                    <div className="text-4xl mb-3 opacity-30">🔗</div>
                    <p>Clique em carregar</p>
                  </div>
                ) : availableUnified.map(record => (
                  <div key={record.id} className={`flex items-center gap-3 p-3 bg-bg-dark border rounded-lg ${selectedUnifiedIds.has(record.id) ? 'border-orange bg-orange/5' : 'border-border hover:bg-bg-hover'
                    }`}>
                    <input type="checkbox" className="w-5 h-5 accent-orange"
                      checked={selectedUnifiedIds.has(record.id)}
                      onChange={(e) => {
                        const next = new Set(selectedUnifiedIds);
                        e.target.checked ? next.add(record.id) : next.delete(record.id);
                        setSelectedUnifiedIds(next);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-text-bright font-semibold text-sm">Unified {record.source}</div>
                      <div className="text-text-dim text-xs font-mono">
                        {record.canSignals?.length || 0} CAN signals • {record.sensorReadings?.length || 0} sensors
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedUnifiedIds.size > 0 && (
                <button className="btn btn-accent w-full" onClick={addSelectedUnified}>
                  ➕ Adicionar {selectedUnifiedIds.size} Registro(s)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}