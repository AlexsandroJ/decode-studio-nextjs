"use client";

import { useState, useEffect } from 'react';
import { useCANStudio } from '@/context/CANStudioContext';

export default function SensorsPanel() {
  const { api, showToast } = useCANStudio();
  
  // Estado do payload JSON
  const [payload, setPayload] = useState<string>('');
  
  // Estado da resposta da API
  const [response, setResponse] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Inicializa com um payload de exemplo válido e timestamp atual
  useEffect(() => {
    const defaultPayload = {
      sensorId: "temp-01",
      sensorType: "temperature",
      value: 25.5,
      unit: "°C",
      timestamp: Date.now()
    };
    setPayload(JSON.stringify(defaultPayload, null, 2));
  }, []);

  const handleSend = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Validação de JSON
      const parsedPayload = JSON.parse(payload);
      
      const res = await api.postSensor(parsedPayload);
      
      setIsSuccess(res.success);
      setResponse(res.data);
      
      if (res.success) {
        showToast('✅ Sensor enviado com sucesso!');
      } else {
        showToast('❌ Erro: ' + (res.data.error || 'Erro desconhecido'), 'error');
      }
    } catch (error: any) {
      setIsSuccess(false);
      setResponse({ error: `JSON inválido: ${error.message}` });
      showToast('❌ JSON inválido', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleList = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      const res = await api.getSensors();
      setIsSuccess(res.success);
      setResponse(res.data);
      
      if (res.success) {
        const count = Array.isArray(res.data.data || res.data) ? (res.data.data || res.data).length : 0;
        showToast(`📥 ${count} sensores carregados!`);
      } else {
        showToast('❌ Erro ao listar sensores', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os registros de sensores?')) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const res = await api.deleteSensors();
      setIsSuccess(res.success);
      setResponse(res.data);
      
      if (res.success) {
        showToast('🗑️ Todos os sensores foram removidos!');
      } else {
        showToast('❌ Erro ao limpar sensores', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(formatResponse(response));
      showToast('📋 Copiado para área de transferência!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <div className="bg-bg-dark border border-border rounded-lg p-5">
        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
            Payload JSON
          </label>
          <textarea
            className="w-full min-h-[160px] bg-bg-elevated border border-border text-text-bright p-3 rounded-md font-mono text-sm resize-y focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{ "sensorId": "...", "value": 0 }'
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            className="btn btn-primary" 
            onClick={handleSend} 
            disabled={isLoading}
          >
            {isLoading ? '⏳ Enviando...' : '📤 Enviar'}
          </button>
          
          <button 
            className="btn" 
            onClick={handleList} 
            disabled={isLoading}
          >
            {isLoading ? '⏳ Buscando...' : '📥 Listar'}
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={handleClear} 
            disabled={isLoading}
          >
            {isLoading ? '⏳ Limpando...' : '🗑️ Limpar'}
          </button>
        </div>
      </div>

      {/* Caixa de Resposta */}
      {response && (
        <div 
          className={`rounded-lg p-4 max-h-[400px] overflow-y-auto border-l-4 transition-all ${
            isSuccess 
              ? 'bg-bg-dark border-border border-l-green' 
              : 'bg-bg-dark border-border border-l-red'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isSuccess ? 'text-green' : 'text-red'}`}>
              {isSuccess ? '✅ Sucesso' : '❌ Erro'}
            </span>
            <button 
              className="text-text-dim hover:text-text-bright text-xs transition-colors"
              onClick={handleCopy}
              title="Copiar para área de transferência"
            >
              📋 Copiar
            </button>
          </div>
          <pre className="font-mono text-xs text-text whitespace-pre-wrap break-all">
            {formatResponse(response)}
          </pre>
        </div>
      )}
      
      {!response && !isLoading && (
        <div className="text-center py-8 text-text-dim text-sm bg-bg-dark border border-border border-dashed rounded-lg">
          Aguardando ação... Preencha o JSON e clique em "Enviar" ou "Listar".
        </div>
      )}
    </div>
  );
}