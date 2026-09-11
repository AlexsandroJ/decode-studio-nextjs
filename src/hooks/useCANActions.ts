"use client";

import { useCANStudio } from '@/context/CANStudioContext';
import { hexToBytes, bytesToHex } from '@/lib/utils';

export function useCANActions() {
  const {
    canId, setCanId,
    bytes, setBytes,
    rules, setRules,
    editingRuleId, setEditingRuleId, // ✅ CORREÇÃO: Adicionado editingRuleId
    api, showToast
  } = useCANStudio();

  const handleLoadExample = () => {
    setCanId('0x1A3');
    setBytes(hexToBytes('E8035A0000000000'));
    showToast('📋 Exemplo carregado!');
  };

  const handleRandomize = () => {
    const randomBytes = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256));
    setBytes(randomBytes);
    showToast('🎲 Frame aleatório gerado!');
  };

  const handleCheckHealth = async () => {
    try {
      const res = await api.health();
      if (res.success) {
        showToast(`✅ API online! Uptime: ${res.data.uptime?.toFixed(1) || '?'}s`);
      } else {
        showToast('❌ Offline: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      showToast('❌ Erro: ' + err.message, 'error');
    }
  };

  const handleSendFrameWithRules = async () => {
    if (rules.length === 0) {
      showToast('❌ Crie regras primeiro!', 'error');
      return;
    }

    try {
      const rulesPayload = rules.map(r => ({
        id: r.id,
        canId: r.canId,
        signalName: r.signalName,
        startBit: r.startBit,
        bitLength: r.bitLength,
        byteOrder: r.byteOrder,
        signed: r.signed,
        factor: r.factor,
        offset: r.offset,
        unit: r.unit,
        minValue: r.minValue,
        maxValue: r.maxValue
      }));

      const rulesRes = await api.postRules(rulesPayload);
      if (!rulesRes.success) {
        showToast('❌ Erro nas regras: ' + (rulesRes.data.error || ''), 'error');
        return;
      }

      const framePayload = {
        canId,
        dlc: 8,
        data: bytesToHex(bytes),
        timestamp: Date.now()
      };

      const frameRes = await api.postFrame(framePayload);
      if (frameRes.success) {
        showToast(`✅ Frame + ${rules.length} regras enviadas!`);
      } else {
        showToast('❌ Erro no frame: ' + (frameRes.data.error || ''), 'error');
      }
    } catch (err: any) {
      showToast('❌ Erro inesperado: ' + err.message, 'error');
    }
  };

  const handleSendFrameOnly = async () => {
    try {
      const framePayload = {
        canId,
        dlc: 8,
        data: bytesToHex(bytes),
        timestamp: Date.now()
      };

      const res = await api.postFrame(framePayload);
      if (res.success) {
        showToast('✅ Frame enviado!');
      } else {
        showToast('❌ Erro: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      showToast('❌ Erro: ' + err.message, 'error');
    }
  };

  const handleLoadRulesFromApi = async () => {
    try {
      const res = await api.getRules();
      if (!res.success) {
        showToast('❌ Erro: ' + (res.data.error || ''), 'error');
        return;
      }

      const arr = res.data.data || res.data || [];
      if (!Array.isArray(arr) || arr.length === 0) {
        showToast('️ Nenhuma regra na API', 'error');
        return;
      }

      const mappedRules = arr.map((r: any) => ({
        id: r.id || `api_${Math.random().toString(36).substr(2, 8)}`,
        canId: r.canId,
        signalName: r.signalName,
        startBit: r.startBit,
        bitLength: r.bitLength,
        byteOrder: r.byteOrder || 'big',
        signed: r.signed ?? false,
        factor: r.factor ?? 1,
        offset: r.offset ?? 0,
        unit: r.unit || '',
        minValue: r.minValue,
        maxValue: r.maxValue
      }));

      setRules(mappedRules);
      setEditingRuleId(null);
      showToast(`✅ ${mappedRules.length} regras carregadas!`);
    } catch (err: any) {
      showToast('❌ ' + err.message, 'error');
    }
  };

  const handleClearRules = () => {
    if (rules.length === 0) return;
    if (!confirm('Remover todas as regras (apenas localmente)?')) return;
    setRules([]);
    setEditingRuleId(null);
    showToast('️ Regras removidas localmente!');
  };

  const handleSyncRules = async () => {
    if (rules.length === 0) {
      showToast('❌ Nenhuma regra para sincronizar!', 'error');
      return;
    }

    try {
      const payload = rules.map(r => ({
        id: r.id,
        canId: r.canId,
        signalName: r.signalName,
        startBit: r.startBit,
        bitLength: r.bitLength,
        byteOrder: r.byteOrder,
        signed: r.signed,
        factor: r.factor,
        offset: r.offset,
        unit: r.unit,
        minValue: r.minValue,
        maxValue: r.maxValue
      }));

      const res = await api.postRules(payload);
      if (res.success) {
        showToast(`✅ ${rules.length} regras sincronizadas!`);
      } else {
        showToast('❌ Erro: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      showToast('❌ ' + err.message, 'error');
    }
  };

  const handleLoadRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    setCanId(rule.canId);
    setEditingRuleId(rule.id);
    showToast(`📝 Editando "${rule.signalName}"`);
  };

  const handleDeleteRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    if (!confirm(`Deseja remover permanentemente a regra "${rule.signalName}"?`)) return;

    try {
      // 1. Tenta deletar na API
      const res = await api.deleteRule(ruleId);
      
      if (res.success) {
        // 2. Se deu certo, remove do estado local
        setRules(rules.filter(r => r.id !== ruleId));
        
        // 3. Se a regra deletada estava sendo editada, limpa a edição
        if (editingRuleId === ruleId) {  // ✅ Agora funciona!
          setEditingRuleId(null);
        }
        
        showToast(`🗑️ "${rule.signalName}" removida com sucesso!`);
      } else {
        showToast('❌ Erro ao remover na API: ' + (res.data.error || ''), 'error');
      }
    } catch (err: any) {
      showToast(' Erro inesperado: ' + err.message, 'error');
    }
  };

  return {
    handleLoadExample,
    handleRandomize,
    handleCheckHealth,
    handleSendFrameWithRules,
    handleSendFrameOnly,
    handleLoadRulesFromApi,
    handleClearRules,
    handleSyncRules,
    handleLoadRule,
    handleDeleteRule
  };
}