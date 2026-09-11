"use client";
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════
export interface Rule {
  id: string;
  canId: string;
  signalName: string;
  startBit: number;
  bitLength: number;
  byteOrder: string;
  signed: boolean;
  factor: number;
  offset: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
}

export interface LogEntry {
  time: string;
  method: string;
  endpoint: string;
  reqBody: any;
  resData: any;
  status: number;
  duration: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  status: number;
}

export interface AnalyzerState {
  selectedCanId: string | null;
  canIds: string[];
  framesByCanId: Record<string, any[]>;
  frequencies: Record<string, number>;
  translations: Record<string, Record<number, { label: string; type: string }>>;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

// ════════════════════════════════════════════════════════
//  CONTEXT SHAPE
// ════════════════════════════════════════════════════════
interface CANStudioContextType {
  // Config
  baseUrl: string;
  setBaseUrl: (url: string) => void;

  // Frame Editor
  canId: string;
  setCanId: (id: string) => void;
  bytes: number[];
  setBytes: (bytes: number[]) => void;
  selectedBits: Set<number>;
  setSelectedBits: (bits: Set<number>) => void;
  lastClickedBit: number | null;
  setLastClickedBit: (bit: number | null) => void;

  // Rules
  rules: Rule[];
  setRules: (rules: Rule[]) => void;
  editingRuleId: string | null;
  setEditingRuleId: (id: string | null) => void;

  // Analyzer
  analyzer: AnalyzerState;
  setAnalyzer: React.Dispatch<React.SetStateAction<AnalyzerState>>;

  // Log
  requestLog: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLog: () => void;

  // Toast
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // API Methods (centralizados!)
  api: {
    health: () => Promise<ApiResponse>;
    getFrames: (limit?: number) => Promise<ApiResponse>;
    postFrame: (frame: any) => Promise<ApiResponse>;
    getRules: () => Promise<ApiResponse>;
    postRules: (rules: any[]) => Promise<ApiResponse>;
    updateRule: (id: string, rule: any) => Promise<ApiResponse>; // 🔥 NOVO: Editar regra
    deleteRule: (id: string) => Promise<ApiResponse>;           // 🔥 NOVO: Deletar regra
    getSensors: (limit?: number) => Promise<ApiResponse>;
    postSensor: (sensor: any) => Promise<ApiResponse>;
    deleteSensors: () => Promise<ApiResponse>;
    getUnified: (params?: { limit?: number; source?: string }) => Promise<ApiResponse>;
    mergeUnified: (windowMs: number) => Promise<ApiResponse>;
    deleteUnified: () => Promise<ApiResponse>;
  };
}

const CANStudioContext = createContext<CANStudioContextType | undefined>(undefined);

// ════════════════════════════════════════════════════════
//  PROVIDER
// ════════════════════════════════════════════════════════
export function CANStudioProvider({ children }: { children: React.ReactNode }) {
  // Config
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api");

  // Frame Editor
  const [canId, setCanId] = useState("0x1A3");
  const [bytes, setBytes] = useState<number[]>(new Array(8).fill(0));
  const [selectedBits, setSelectedBits] = useState<Set<number>>(new Set());
  const [lastClickedBit, setLastClickedBit] = useState<number | null>(null);

  // Rules
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Analyzer
  const [analyzer, setAnalyzer] = useState<AnalyzerState>({
    selectedCanId: null,
    canIds: [],
    framesByCanId: {},
    frequencies: {},
    translations: {}
  });

  // Log
  const [requestLog, setRequestLog] = useState<LogEntry[]>([]);

  // Toast
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false
  });

  const addLog = useCallback((log: LogEntry) => {
    setRequestLog(prev => [log, ...prev].slice(0, 50));
  }, []);

  const clearLog = useCallback(() => setRequestLog([]), []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  // ══════════════════════════════════════════════════════
  //  🔥 API METHODS - CENTRALIZADOS AQUI!
  // ══════════════════════════════════════════════════════
  const apiRequest = useCallback(async (
    method: string,
    endpoint: string,
    body: any = null
  ): Promise<ApiResponse> => {
    const url = `${baseUrl}${endpoint}`;
    const start = Date.now();

    try {
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body && method !== 'GET') opts.body = JSON.stringify(body);

      const res = await fetch(url, opts);
      const data = await res.json();
      const duration = Date.now() - start;

      addLog({
        time: new Date().toLocaleTimeString(),
        method,
        endpoint,
        reqBody: body,
        resData: data,
        status: res.status,
        duration
      });

      return { success: res.ok, data, status: res.status };
    } catch (err: any) {
      const duration = Date.now() - start;
      addLog({
        time: new Date().toLocaleTimeString(),
        method,
        endpoint,
        reqBody: body,
        resData: { error: err.message },
        status: 0,
        duration
      });
      return { success: false, data: { error: err.message }, status: 0 };
    }
  }, [baseUrl, addLog]);

  // API Methods centralizadas
  const api = useMemo(() => ({
    health: () => apiRequest('GET', '/health'),
    
    getFrames: (limit = 100) => apiRequest('GET', `/can/frames?limit=${limit}`),
    postFrame: (frame: any) => apiRequest('POST', '/can/frames', frame),
    
    getRules: () => apiRequest('GET', '/decoding/rules'),
    postRules: (rules: any[]) => apiRequest('POST', '/decoding/rules', rules),
    updateRule: (id: string, rule: any) => apiRequest('PUT', `/decoding/rules/${id}`, rule), // 🔥 NOVO
    deleteRule: (id: string) => apiRequest('DELETE', `/decoding/rules/${id}`),               // 🔥 NOVO
    
    getSensors: (limit = 100) => apiRequest('GET', `/sensors?limit=${limit}`),
    postSensor: (sensor: any) => apiRequest('POST', '/sensors', sensor),
    deleteSensors: () => apiRequest('DELETE', '/sensors'),
    
    getUnified: (params?: { limit?: number; source?: string }) => {
      let endpoint = `/unified?limit=${params?.limit || 100}`;
      if (params?.source) endpoint += `&source=${params.source}`;
      return apiRequest('GET', endpoint);
    },
    mergeUnified: (windowMs: number) => apiRequest('POST', '/unified/merge', { windowMs }),
    deleteUnified: () => apiRequest('DELETE', '/unified'),
  }), [apiRequest]);

  return (
    <CANStudioContext.Provider value={{
      baseUrl, setBaseUrl,
      canId, setCanId,
      bytes, setBytes,
      selectedBits, setSelectedBits,
      lastClickedBit, setLastClickedBit,
      rules, setRules,
      editingRuleId, setEditingRuleId,
      analyzer, setAnalyzer,
      requestLog, addLog, clearLog,
      toast, showToast,
      api
    }}>
      {children}
    </CANStudioContext.Provider>
  );
}

// ════════════════════════════════════════════════════════
//  HOOK
// ════════════════════════════════════════════════════════
export const useCANStudio = () => {
  const context = useContext(CANStudioContext);
  if (!context) throw new Error("useCANStudio must be used within CANStudioProvider");
  return context;
};