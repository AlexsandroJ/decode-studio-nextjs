"use client";

import { useCANStudio } from '@/context/CANStudioContext';
import { useState, useEffect, useMemo } from 'react';
import { bytesToHex } from '@/lib/utils';

interface FormData {
  signalName: string;
  startBit: number;
  bitLength: number;
  byteOrder: string;
  unit: string;
  factor: number;
  offset: number;
  signed: boolean;
  minValue: string;
  maxValue: string;
}

interface RuleSnapshot {
  canId: string;  // 🔥 ADICIONADO
  signalName: string;
  startBit: number;
  bitLength: number;
  byteOrder: string;
  unit: string;
  factor: number;
  offset: number;
  signed: boolean;
  minValue: string;
  maxValue: string;
  selectedBits: number[];
}

// ════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ════════════════════════════════════════════════════════
const formatHex = (num: number): string => {
  if (!Number.isFinite(num)) return '0x00000000';
  if (num < 0) return '0x' + (num >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return '0x' + (num & 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
};

const formatDecimal = (num: number): string => {
  if (!Number.isFinite(num)) return '0';
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 });
  }
  return num.toString();
};

// ═══════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════
export default function SignalEditor() {
  const {
    selectedBits, setSelectedBits,
    bytes,
    rules, setRules,
    editingRuleId, setEditingRuleId,
    canId,
    api, showToast
  } = useCANStudio();

  const [form, setForm] = useState<FormData>({
    signalName: '', startBit: 0, bitLength: 1, byteOrder: 'little',
    unit: 'rpm', factor: 0.25, offset: 0, signed: false, minValue: '', maxValue: ''
  });

  const [isSending, setIsSending] = useState(false);
  const [originalRule, setOriginalRule] = useState<RuleSnapshot | null>(null);

  // ══════════════════════════════════════════════════════
  //  SYNC & EFFECTS
  // ══════════════════════════════════════════════════════
  
  useEffect(() => {
    if (editingRuleId) {
      const rule = rules.find(r => r.id === editingRuleId);
      if (rule) {
        const newForm: FormData = {
          signalName: rule.signalName,
          startBit: rule.startBit,
          bitLength: rule.bitLength,
          byteOrder: rule.byteOrder,
          unit: rule.unit,
          factor: rule.factor,
          offset: rule.offset,
          signed: rule.signed,
          minValue: rule.minValue !== undefined ? String(rule.minValue) : '',
          maxValue: rule.maxValue !== undefined ? String(rule.maxValue) : ''
        };
        
        setForm(newForm);
        
        const nextBits: number[] = [];
        for (let i = rule.startBit; i < rule.startBit + rule.bitLength && i < 64; i++) {
          nextBits.push(i);
        }
        setSelectedBits(new Set(nextBits));
        
        // 🔥 Salva snapshot COM canId
        setOriginalRule({
          canId: rule.canId,
          ...newForm,
          selectedBits: nextBits
        });
      }
    }
  }, [editingRuleId, rules, setSelectedBits]);

  useEffect(() => {
    if (selectedBits.size > 0) {
      const sorted = [...selectedBits].sort((a, b) => a - b);
      if (form.startBit !== sorted[0] || form.bitLength !== sorted.length) {
        setForm(prev => ({ ...prev, startBit: sorted[0], bitLength: sorted.length }));
      }
    }
  }, [selectedBits]);

  // ══════════════════════════════════════════════════════
  //  DETECÇÃO DE MUDANÇAS (🔥 AGORA INCLUI canId)
  // ══════════════════════════════════════════════════════
  const hasChanges = useMemo(() => {
    // Se não está editando, mostra botão se tiver conteúdo válido
    if (!editingRuleId) {
      return form.signalName.trim() !== '' || selectedBits.size > 0;
    }

    // Se está editando, compara com snapshot
    if (!originalRule) return false;

    const currentBits = [...selectedBits].sort((a, b) => a - b);
    const bitsEqual = 
      currentBits.length === originalRule.selectedBits.length &&
      currentBits.every((b, i) => b === originalRule.selectedBits[i]);

    // 🔥 ADICIONADO: canId !== originalRule.canId
    return (
      canId !== originalRule.canId ||
      form.signalName !== originalRule.signalName ||
      form.startBit !== originalRule.startBit ||
      form.bitLength !== originalRule.bitLength ||
      form.byteOrder !== originalRule.byteOrder ||
      form.unit !== originalRule.unit ||
      form.factor !== originalRule.factor ||
      form.offset !== originalRule.offset ||
      form.signed !== originalRule.signed ||
      form.minValue !== originalRule.minValue ||
      form.maxValue !== originalRule.maxValue ||
      !bitsEqual
    );
  }, [form, selectedBits, editingRuleId, originalRule, canId]); // 🔥 ADICIONADO: canId nas dependências

  // ══════════════════════════════════════════════════════
  //  DERIVED STATE
  // ══════════════════════════════════════════════════════
  const { rawValue, physValue } = useMemo(() => {
    if (selectedBits.size === 0) return { rawValue: 0, physValue: 0 };
    
    let buf = 0n;
    for (const b of bytes) buf = (buf << 8n) | BigInt(b);

    let adj = form.startBit;
    if (form.byteOrder === 'little') {
      adj = (7 - Math.floor(form.startBit / 8)) * 8 + (form.startBit % 8);
    } else {
      adj = 63 - form.startBit;
    }

    const end = adj - form.bitLength + 1;
    if (end < 0) return { rawValue: 0, physValue: 0 };

    const mask = (1n << BigInt(form.bitLength)) - 1n;
    let raw = Number((buf >> BigInt(end)) & mask);
    
    if (form.signed && raw >= (1 << (form.bitLength - 1))) {
      raw -= (1 << form.bitLength);
    }

    return {
      rawValue: raw,
      physValue: raw * form.factor + form.offset
    };
  }, [selectedBits, bytes, form.startBit, form.bitLength, form.byteOrder, form.signed, form.factor, form.offset]);

  // ══════════════════════════════════════════════════════
  //  HANDLERS
  // ═════════════════════════════════════════════════════
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSelectionFromInputs = (start: number, length: number) => {
    const next = new Set<number>();
    for (let i = start; i < start + length && i < 64; i++) next.add(i);
    setSelectedBits(next);
  };

  const handleSaveRule = async () => {
    console.log('💾 [handleSaveRule] Iniciando...');
    
    if (selectedBits.size === 0) {
      showToast('⚠️ Selecione pelo menos 1 bit!', 'error');
      return;
    }
    if (!form.signalName.trim()) {
      showToast('⚠️ Informe o nome do sinal!', 'error');
      return;
    }

    const ruleId = editingRuleId || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const rule = {
      id: ruleId,
      canId,
      signalName: form.signalName,
      startBit: form.startBit,
      bitLength: form.bitLength,
      byteOrder: form.byteOrder,
      unit: form.unit,
      factor: form.factor,
      offset: form.offset,
      signed: form.signed,
      minValue: form.minValue ? parseFloat(form.minValue) : undefined,
      maxValue: form.maxValue ? parseFloat(form.maxValue) : undefined
    };

    console.log('📝 [handleSaveRule] Regra:', rule);
    console.log('🔍 [handleSaveRule] É edição?', !!editingRuleId);

    // 1. Atualiza estado local
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    let newRules;
    
    if (existingIndex >= 0) {
      newRules = rules.map((r, idx) => idx === existingIndex ? rule : r);
      showToast(`✅ "${rule.signalName}" atualizada localmente!`);
    } else {
      newRules = [...rules, rule];
      showToast(`✅ "${rule.signalName}" criada localmente!`);
    }

    setRules(newRules);
    setEditingRuleId(rule.id);
    
    // 🔥 Atualiza snapshot COM canId após salvar
    setOriginalRule({
      canId: canId,
      ...form,
      selectedBits: [...selectedBits].sort((a, b) => a - b)
    });

    // 2. Envia para API
    setIsSending(true);
    try {
      console.log('🌐 [handleSaveRule] Enviando para API...');

      const rulePayload: any = {
        canId: rule.canId,
        signalName: rule.signalName,
        startBit: rule.startBit,
        bitLength: rule.bitLength,
        byteOrder: rule.byteOrder,
        signed: rule.signed,
        factor: rule.factor,
        offset: rule.offset,
        unit: rule.unit
      };

      if (!isNaN(rule.minValue as any)) rulePayload.minValue = rule.minValue;
      if (!isNaN(rule.maxValue as any)) rulePayload.maxValue = rule.maxValue;
      
      if (editingRuleId) {
        rulePayload.id = rule.id;
        console.log('📤 [handleSaveRule] Payload (UPDATE):', rulePayload);
      } else {
        console.log('📤 [handleSaveRule] Payload (CREATE):', rulePayload);
      }

      let res;
      if (editingRuleId) {
        console.log('🔄 [handleSaveRule] Usando PUT (update)');
        res = await api.updateRule(editingRuleId, rulePayload);
      } else {
        console.log('➕ [handleSaveRule] Usando POST (create)');
        res = await api.postRules([rulePayload]);
      }
      
      console.log('📥 [handleSaveRule] Resposta:', res);
      
      if (res.success) {
        showToast(`✅ "${rule.signalName}" salva e sincronizada!`);
      } else {
        console.error('❌ [handleSaveRule] Erro API:', res.data);
        showToast('⚠️ Salva localmente, erro API: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      console.error('💥 [handleSaveRule] Erro:', err);
      showToast('️ Salva localmente, erro: ' + err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleNewRule = () => {
    setEditingRuleId(null);
    setOriginalRule(null);
    setSelectedBits(new Set());
    setForm({
      signalName: '', startBit: 0, bitLength: 1, byteOrder: 'little',
      unit: 'rpm', factor: 0.25, offset: 0, signed: false,
      minValue: '', maxValue: ''
    });
    showToast('🆕 Modo nova regra', 'info');
  };

  return (
    <div className="bg-bg-dark border border-border rounded-lg p-4 mb-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm text-text-bright flex items-center gap-2">
          ✏️ Propriedades do Sinal
          <span className="bg-bit-selected text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
            {selectedBits.size} bits
          </span>
        </h3>
        {editingRuleId && (
          <span className="bg-orange text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
            Editando: {rules.find(r => r.id === editingRuleId)?.signalName || ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Nome do Sinal</label>
          <input className="input-field" value={form.signalName} onChange={e => handleFieldChange('signalName', e.target.value)} placeholder="Ex: EngineRPM" />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Start Bit</label>
          <input type="number" className="input-field" value={form.startBit} onChange={e => {
            const val = parseInt(e.target.value) || 0;
            handleFieldChange('startBit', val);
            updateSelectionFromInputs(val, form.bitLength);
          }} min={0} max={63} />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Bit Length</label>
          <input type="number" className="input-field" value={form.bitLength} onChange={e => {
            const val = parseInt(e.target.value) || 1;
            handleFieldChange('bitLength', val);
            updateSelectionFromInputs(form.startBit, val);
          }} min={1} max={64} />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Byte Order</label>
          <select className="input-field" value={form.byteOrder} onChange={e => handleFieldChange('byteOrder', e.target.value)}>
            <option value="little">Little Endian (Intel)</option>
            <option value="big">Big Endian (Motorola)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Unit</label>
          <input className="input-field" value={form.unit} onChange={e => handleFieldChange('unit', e.target.value)} placeholder="rpm, °C" />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Factor</label>
          <input type="number" step="any" className="input-field" value={form.factor} onChange={e => handleFieldChange('factor', parseFloat(e.target.value) || 0)} />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">Offset</label>
          <input type="number" step="any" className="input-field" value={form.offset} onChange={e => handleFieldChange('offset', parseFloat(e.target.value) || 0)} />
        </div>

        <div className="col-span-2 flex flex-wrap gap-4 items-center py-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" className="w-4 h-4 accent-accent" checked={form.signed} onChange={e => handleFieldChange('signed', e.target.checked)} />
            Signed
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            Min: <input type="number" step="any" className="w-20 bg-bg-elevated border border-border text-text px-1.5 py-1 rounded text-sm" value={form.minValue} onChange={e => handleFieldChange('minValue', e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            Max: <input type="number" step="any" className="w-20 bg-bg-elevated border border-border text-text px-1.5 py-1 rounded text-sm" value={form.maxValue} onChange={e => handleFieldChange('maxValue', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="bg-bg-elevated border border-border rounded-lg p-3.5 mt-3.5 space-y-1.5">
        <div className="flex justify-between items-center border-b border-dashed border-border pb-1.5">
          <span className="text-text-dim text-[12px] uppercase tracking-wider">Raw Value (hex)</span>
          <span className="text-green font-mono text-sm font-semibold">{formatHex(rawValue)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-dashed border-border pb-1.5">
          <span className="text-text-dim text-[12px] uppercase tracking-wider">Raw Value (decimal)</span>
          <span className="text-green font-mono text-sm font-semibold">{formatDecimal(rawValue)}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-text-dim text-[12px] uppercase tracking-wider">Physical Value</span>
          <span className="text-cyan font-mono text-xl font-semibold">
            {Number.isFinite(physValue) ? physValue.toFixed(4) : '0.0000'} {form.unit}
          </span>
        </div>
      </div>

      <div className="flex gap-2.5 mt-3.5 flex-wrap">
        {/* 🔥 Botão Salvar só aparece quando há mudanças (incluindo canId) */}
        {hasChanges && (
          <button 
            className="btn btn-primary" 
            onClick={handleSaveRule}
            disabled={isSending}
          >
            {isSending ? '⏳ Salvando...' : '💾 Salvar Regra'}
          </button>
        )}
        
        <button className="btn" onClick={handleNewRule} disabled={isSending}>
          🆕 Nova Regra
        </button>
      </div>
    </div>
  );
}