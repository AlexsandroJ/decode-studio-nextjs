"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════
//  TYPES BASEADOS NOS SCHEMAS DA API
// ════════════════════════════════════════════════════════

export interface ICanFrame {
  id: string;
  canId: string;
  dlc: number;
  data: string;
  timestamp: number;
  interface: 'mqtt' | 'http' | 'websocket' | 'can-bus' | 'serial';
}

export interface IDecodingRule {
  id: string;
  canId: string;
  signalName: string;
  startBit: number;
  bitLength: number;
  byteOrder: 'big' | 'little';
  signed: boolean;
  factor: number;
  offset: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
}

export interface IDecodedSignal {
  ruleId: string;
  signalName: string;
  value: number;
  unit: string;
  rawHex: string;
  timestamp: number;
}

export interface ISensorReading {
  id: string;
  sensorId: string;
  sensorType: string;
  value: any;
  unit: string;
  timestamp: number;
  metadata?: any;
}

export interface IUnifiedRecord {
  id: string;
  timestamp: number;
  source: 'can' | 'sensor' | 'merged' | 'custom';
  canSignals: IDecodedSignal[];
  sensorReadings: ISensorReading[];
  customData?: any;
  tags: string[];
}

// ════════════════════════════════════════════════════════
//  WIDGET TYPES
// ════════════════════════════════════════════════════════

export type DisplayType = 
  | 'number' 
  | 'gauge' 
  | 'bar' 
  | 'sparkline' 
  | 'led' 
  | 'text' 
  | 'json' 
  | 'array'
  | 'table'
  | 'status';

export type WidgetSource = 'can-signal' | 'sensor' | 'unified';

export interface WidgetField {
  path: string;
  label: string;
  dataType: 'number' | 'string' | 'boolean' | 'object' | 'array' | 'unknown';
  unit?: string;
  example?: any;
}

export interface Widget {
  id: string;
  type: WidgetSource;
  sourceId: string;
  
  field: WidgetField;
  
  displayType: DisplayType;
  customLabel?: string;
  color: string;
  
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  dangerThreshold: number;
  decimals: number;
  
  currentValue?: any;
  history: number[];
  lastUpdated?: number;
  
  canId?: string;
  sensorType?: string;
}

interface ViewerContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
  lastUpdate: number | null;
  setLastUpdate: (ts: number | null) => void;  // ← GARANTIR QUE ESTÁ AQUI
  
  widgets: Widget[];
  addWidget: (widget: Omit<Widget, 'history'>) => void;
  addWidgets: (widgets: Omit<Widget, 'history'>[]) => void;
  updateWidget: (id: string, rawData: any) => void;
  updateWidgetConfig: (id: string, updates: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
  
  availableRules: IDecodingRule[];
  availableSensors: ISensorReading[];
  availableUnified: IUnifiedRecord[];
  loadData: () => Promise<void>;
  
  savedConfigs: any[];
  saveConfig: (name: string) => void;
  loadConfig: (name: string) => void;
  deleteConfig: (name: string) => void;
}

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

export function ViewerProvider({ children }: { children: React.ReactNode }) {

  const [baseUrl, setBaseUrlState] = useState(process.env.NEXT_PUBLIC_APIBASEURL || "http://localhost:3001/api");
  const [isLive, setIsLive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [availableRules, setAvailableRules] = useState<IDecodingRule[]>([]);
  const [availableSensors, setAvailableSensors] = useState<ISensorReading[]>([]);
  const [availableUnified, setAvailableUnified] = useState<IUnifiedRecord[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('viewer-widgets');
    const url = localStorage.getItem('viewer-baseUrl');
    const interval = localStorage.getItem('viewer-refreshInterval');
    const configs = localStorage.getItem('viewer-configs');
    
    if (saved) setWidgets(JSON.parse(saved));
    if (url) setBaseUrlState(url);
    if (interval) setRefreshInterval(parseInt(interval));
    if (configs) setSavedConfigs(JSON.parse(configs));
  }, []);

  useEffect(() => { localStorage.setItem('viewer-widgets', JSON.stringify(widgets)); }, [widgets]);
  useEffect(() => { localStorage.setItem('viewer-baseUrl', baseUrl); }, [baseUrl]);
  useEffect(() => { localStorage.setItem('viewer-refreshInterval', refreshInterval.toString()); }, [refreshInterval]);
  useEffect(() => { localStorage.setItem('viewer-configs', JSON.stringify(savedConfigs)); }, [savedConfigs]);

  const setBaseUrl = useCallback((url: string) => setBaseUrlState(url.trim()), []);

  const addWidget = useCallback((widget: Omit<Widget, 'history'>) => {
    setWidgets(prev => [...prev, { ...widget, history: [] }]);
  }, []);

  const addWidgets = useCallback((newWidgets: Omit<Widget, 'history'>[]) => {
    setWidgets(prev => [...prev, ...newWidgets.map(w => ({ ...w, history: [] as number[] }))]);
  }, []);

  const updateWidget = useCallback((id: string, rawData: any) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      
      let value = rawData;
      if (w.field?.path) {
        value = getValueByPath(rawData, w.field.path);
      }
      
      let numericValue: number | undefined;
      if (typeof value === 'number') numericValue = value;
      else if (typeof value === 'string') numericValue = parseFloat(value);
      else if (typeof value === 'boolean') numericValue = value ? 1 : 0;
      
      const MAX_HISTORY = 30;
      const newHistory = numericValue !== undefined 
        ? [...w.history, numericValue].slice(-MAX_HISTORY)
        : w.history;
      
      return { ...w, currentValue: value, history: newHistory, lastUpdated: Date.now() };
    }));
    setLastUpdate(Date.now());
  }, []);

  const updateWidgetConfig = useCallback((id: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const clearWidgets = useCallback(() => setWidgets([]), []);

  const loadData = useCallback(async () => {
    try {
      const [rulesRes, sensorsRes, unifiedRes] = await Promise.all([
        fetch(`${baseUrl}/decoding/rules`).then(r => r.json()),
        fetch(`${baseUrl}/sensors?limit=100`).then(r => r.json()),
        fetch(`${baseUrl}/unified?limit=100`).then(r => r.json())
      ]);
      
      setAvailableRules(rulesRes.data || rulesRes || []);
      setAvailableSensors(sensorsRes.data || sensorsRes || []);
      setAvailableUnified(unifiedRes.data || unifiedRes || []);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }, [baseUrl]);

  const saveConfig = useCallback((name: string) => {
    const config = { name, widgets, savedAt: new Date().toISOString() };
    setSavedConfigs(prev => [...prev.filter(c => c.name !== name), config]);
  }, [widgets]);

  const loadConfig = useCallback((name: string) => {
    const config = savedConfigs.find(c => c.name === name);
    if (config) setWidgets(config.widgets);
  }, [savedConfigs]);

  const deleteConfig = useCallback((name: string) => {
    setSavedConfigs(prev => prev.filter(c => c.name !== name));
  }, []);

  // ✅ CORREÇÃO AQUI: incluir setLastUpdate no value
  const value = useMemo(() => ({
    baseUrl, setBaseUrl,
    isLive, setIsLive,
    refreshInterval, setRefreshInterval,
    lastUpdate,
    setLastUpdate,  // ← ESTA LINHA ESTAVA FALTANDO!
    widgets, addWidget, addWidgets, updateWidget, updateWidgetConfig, removeWidget, clearWidgets,
    availableRules, availableSensors, availableUnified, loadData,
    savedConfigs, saveConfig, loadConfig, deleteConfig
  }), [
    baseUrl, isLive, refreshInterval, lastUpdate, widgets, 
    availableRules, availableSensors, availableUnified, savedConfigs,
    setBaseUrl, setLastUpdate,  // ← E AQUI TAMBÉM!
    addWidget, addWidgets, updateWidget, updateWidgetConfig, 
    removeWidget, clearWidgets, loadData, saveConfig, loadConfig, deleteConfig
  ]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) throw new Error("useViewer must be used within ViewerProvider");
  return context;
};

// ════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════

export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(k => k);
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return undefined;
    result = result[key];
  }
  return result;
}

export function flattenObject(obj: any, prefix = '', result: any[] = []): any[] {
  if (obj === null || obj === undefined) return result;
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else {
        result.push({
          path: newKey,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          dataType: typeof value,
          example: value,
          unit: extractUnitFromKey(key)
        });
      }
    });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newKey = `${prefix}[${index}]`;
      if (typeof item === 'object' && item !== null) {
        flattenObject(item, newKey, result);
      } else {
        result.push({
          path: newKey,
          label: `Item ${index}`,
          dataType: typeof item,
          example: item
        });
      }
    });
  }
  
  return result;
}

function extractUnitFromKey(key: string): string | undefined {
  const unitMap: Record<string, string> = {
    temp: '°C', temperature: '°C', celsius: '°C',
    pressure: 'bar', press: 'bar',
    speed: 'km/h', velocity: 'km/h',
    rpm: 'rpm', voltage: 'V', current: 'A'
  };
  const lowerKey = key.toLowerCase();
  for (const [k, unit] of Object.entries(unitMap)) {
    if (lowerKey.includes(k)) return unit;
  }
  return undefined;
}