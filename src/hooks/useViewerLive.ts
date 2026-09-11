// src/hooks/useViewerLive.ts
"use client";
import { useEffect, useRef, useCallback } from 'react';
import { useViewer, getValueByPath } from '@/context/ViewerContext';

export function useViewerLive() {
  const { 
    baseUrl, 
    isLive, 
    refreshInterval, 
    widgets, 
    updateWidget,
    setLastUpdate 
  } = useViewer();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const widgetsRef = useRef(widgets);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    const currentWidgets = widgetsRef.current;
    if (currentWidgets.length === 0) return;

    isFetchingRef.current = true;

    try {
      const [unifiedRes, sensorsRes] = await Promise.all([
        fetch(`${baseUrl}/unified?limit=100`)
          .then(r => r.ok ? r.json() : { data: [] })
          .catch(() => ({ data: [] })),
        fetch(`${baseUrl}/sensors?limit=100`)
          .then(r => r.ok ? r.json() : { data: [] })
          .catch(() => ({ data: [] }))
      ]);

      const unified = unifiedRes.data || unifiedRes || [];
      const sensors = sensorsRes.data || sensorsRes || [];

      currentWidgets.forEach(w => {
        let rawData: any = null;

        if (w.type === 'can-signal') {
          for (const record of unified) {
            if (record.canSignals) {
              const sig = record.canSignals.find((s: any) => 
                s.ruleId === w.sourceId || s.signalName === w.field?.label
              );
              if (sig) { rawData = sig; break; }
            }
          }
        } else if (w.type === 'sensor') {
          // 🔍 Busca por sensorId (não por ID único!)
          for (const s of sensors) {
            if (s.sensorId === w.sourceId) {
              rawData = s;
              break;
            }
          }
          if (!rawData) {
            for (const record of unified) {
              if (record.sensorReadings) {
                const reading = record.sensorReadings.find((r: any) => 
                  r.sensorId === w.sourceId
                );
                if (reading) { rawData = reading; break; }
              }
            }
          }
        } else if (w.type === 'unified') {
          rawData = unified.find((u: any) => u.id === w.sourceId);
        }

        if (rawData) updateWidget(w.id, rawData);
      });

      setLastUpdate(Date.now());
    } catch (err) {
      console.error("[useViewerLive] Erro:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [baseUrl, updateWidget, setLastUpdate]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isLive) {
      fetchData();
      timerRef.current = setInterval(fetchData, refreshInterval);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive, refreshInterval, fetchData]);

  const fetchManual = useCallback(() => fetchData(), [fetchData]);

  return { fetchData: fetchManual, isFetching: isFetchingRef.current };
}