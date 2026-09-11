// src/components/ByteAnalyzer/useAnalyzerData.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCANStudio } from '@/context/CANStudioContext';
import { hexToBytes } from '@/lib/utils';

export function useAnalyzerData() {
  const { api, analyzer, setAnalyzer, showToast } = useCANStudio();
  
  const [snifferFilter, setSnifferFilter] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => refreshAnalyzer(), refreshInterval);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  const refreshAnalyzer = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFrames(2000);
      if (!res.success) return;

      const frames = res.data.data || res.data || [];
      if (!Array.isArray(frames)) return;

      const byCanId: Record<string, any[]> = {};
      const timestampsByCanId: Record<string, number[]> = {};

      frames.forEach((f: any) => {
        if (!f.canId) return;
        if (!byCanId[f.canId]) { byCanId[f.canId] = []; timestampsByCanId[f.canId] = []; }
        byCanId[f.canId].push(f);
        timestampsByCanId[f.canId].push(f.timestamp);
      });

      const frequencies: Record<string, number> = {};
      Object.keys(timestampsByCanId).forEach(canId => {
        const ts = timestampsByCanId[canId].sort((a, b) => a - b);
        if (ts.length > 1) {
          const totalInterval = ts.reduce((acc, curr, i, arr) => i > 0 ? acc + (curr - arr[i - 1]) : acc, 0);
          frequencies[canId] = Math.round(1000 / (totalInterval / (ts.length - 1)));
        } else {
          frequencies[canId] = 0;
        }
      });

      // ✅ CORREÇÃO: Usar forma funcional do setState
      // Isso preserva selectedCanId e translations do estado anterior
      setAnalyzer((prev: any) => ({
        ...prev,
        framesByCanId: byCanId,
        frequencies,
        canIds: Object.keys(byCanId).sort()
      }));
    } catch (e) {
      console.error('Erro ao atualizar analyzer:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCanId = (canId: string) => {
    const saved = localStorage.getItem(`can-translations-${canId}`);
    const translations = saved ? JSON.parse(saved) : {};
    setAnalyzer({
      ...analyzer,
      selectedCanId: canId,
      translations: { ...analyzer.translations, [canId]: translations }
    });
  };

  const updateTranslation = (byteIndex: number, field: 'label' | 'type', value: string) => {
    const canId = analyzer.selectedCanId;
    if (!canId) return;
    const current = analyzer.translations[canId] || {};
    const updated = {
      ...current,
      [byteIndex]: {
        label: field === 'label' ? value : (current[byteIndex]?.label || ''),
        type: field === 'type' ? value : (current[byteIndex]?.type || 'uint8')
      }
    };
    const newTranslations = { ...analyzer.translations, [canId]: updated };
    setAnalyzer({ ...analyzer, translations: newTranslations });
    localStorage.setItem(`can-translations-${canId}`, JSON.stringify(updated));
  };

  const exportTranslations = () => {
    const canId = analyzer.selectedCanId;
    if (!canId) return showToast('Selecione um CAN ID primeiro', 'error');
    const blob = new Blob([JSON.stringify({ canId, translations: analyzer.translations[canId] || {}, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `translations-${canId}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Traduções exportadas!');
  };

  // Derived State
  const filteredSnifferIds = useMemo(() => analyzer.canIds.filter(id => id.toLowerCase().includes(snifferFilter.toLowerCase())), [analyzer.canIds, snifferFilter]);
  const filteredSidebarIds = useMemo(() => analyzer.canIds.filter(id => id.toLowerCase().includes(sidebarSearch.toLowerCase())), [analyzer.canIds, sidebarSearch]);
  
  const selectedFrames = analyzer.selectedCanId ? (analyzer.framesByCanId[analyzer.selectedCanId] || []) : [];
  const sortedFrames = [...selectedFrames].sort((a, b) => a.timestamp - b.timestamp);
  const latestFrame = sortedFrames[sortedFrames.length - 1];
  const prevFrame = sortedFrames.length > 1 ? sortedFrames[sortedFrames.length - 2] : null;
  
  const latestBytes = latestFrame ? hexToBytes(latestFrame.data) : new Array(8).fill(0);
  const prevBytes = prevFrame ? hexToBytes(prevFrame.data) : null;
  const currentTranslations = analyzer.selectedCanId ? (analyzer.translations[analyzer.selectedCanId] || {}) : {};

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(ts % 1000).padStart(3, '0');
  };

  return {
    snifferFilter, setSnifferFilter,
    sidebarSearch, setSidebarSearch,
    autoRefresh, setAutoRefresh,
    refreshInterval, setRefreshInterval,
    isLoading, refreshAnalyzer,
    selectCanId, updateTranslation, exportTranslations,
    filteredSnifferIds, filteredSidebarIds,
    latestBytes, prevBytes, currentTranslations,
    sortedFrames, formatTime,
    analyzer
  };
}