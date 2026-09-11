"use client";

import { useState } from 'react';

// Imports
import ViewPanel from './Dashboard/ViewPanel';
import RawDataTable from './RawDataTable';
import ByteAnalyzer from './ByteAnalyzer/index';
import SensorsPanel from './SensorsPanel';
import UnifiedPanel from './UnifiedPanel';
import LogPanel from './LogPanel';
import FrameEditorPanel from './FrameEditorPanel';

export default function TabsPanel() {
  const [activeTab, setActiveTab] = useState('frame');

  const tabs = [
    { id: 'view', label: '📊 Dashboard', icon: '📊' },
    { id: 'frame', label: '🎛️ Frame Editor', icon: '🎛️' },
    { id: 'rawdata', label: '📥 Dados Brutos', icon: '📥' },
    { id: 'analyzer', label: ' Byte Analyzer', icon: '🔬' },
    { id: 'sensors', label: '🌡️ Sensores', icon: '🌡️' },
    { id: 'unified', label: '🔗 Unified', icon: '🔗' },
    { id: 'log', label: '📜 Log', icon: '📜' }
  ];

  return (
    <div className="panel min-h-screen">
      {/* Navegação */}
      <div className="flex border-b border-border bg-bg-elevated overflow-x-auto sticky top-0 z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-5 py-3 cursor-pointer text-text-dim font-semibold text-[13px] border-b-2 border-transparent transition-all whitespace-nowrap hover:text-text flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'text-accent border-b-accent bg-bg-dark/30' 
                : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label.replace(tab.icon + ' ', '')}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        {activeTab === 'view' && <ViewPanel />}
        {activeTab === 'frame' && <FrameEditorPanel />}
        {activeTab === 'rawdata' && <RawDataTable />}
        {activeTab === 'analyzer' && <ByteAnalyzer />}
        {activeTab === 'sensors' && <SensorsPanel />}
        {activeTab === 'unified' && <UnifiedPanel />}
        {activeTab === 'log' && <LogPanel />}
      </div>
    </div>
  );
}