"use client";

import { useState } from 'react';
import { useCANStudio } from '@/context/CANStudioContext';
import { hexToBytes, bytesToHex } from '@/lib/utils';
import BitMatrix from '../BitMatrix';
import SignalEditor from './SignalEditor';

interface FrameEditorProps {
  onLoadExample: () => void;
  onRandomize: () => void;
  onSendFrameWithRules: () => void;
  onSendFrameOnly: () => void;
}

export default function FrameEditor({
  onLoadExample,
  onRandomize,
  onSendFrameWithRules,
  onSendFrameOnly
}: FrameEditorProps) {
  const { canId, setCanId, bytes, setBytes } = useCANStudio();
  const [hexInput, setHexInput] = useState('E8035A0000000000');
  const [dlc, setDlc] = useState(8);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    setBytes(hexToBytes(value));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-base text-text-bright flex items-center gap-2.5">
          📡 Frame CAN — Editor Visual
        </h2>
        <div className="flex gap-2">
          <button className="btn-mini" onClick={onLoadExample}>
            📋 Exemplo
          </button>
          <button className="btn-mini" onClick={onRandomize}>
            🎲 Aleatório
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Inputs de Frame */}
        <div className="grid grid-cols-[180px_1fr_100px] gap-3 mb-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              CAN ID (hex)
            </label>
            <input
              className="input-field"
              value={canId}
              onChange={(e) => setCanId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              Data (hex) — até 8 bytes
            </label>
            <input
              className="input-field"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">
              DLC
            </label>
            <input
              type="number"
              className="input-field"
              value={dlc}
              onChange={(e) => setDlc(parseInt(e.target.value) || 0)}
              min={0}
              max={8}
            />
          </div>
        </div>

        {/* Bit Matrix */}
        <BitMatrix />

        {/* Signal Editor */}
        <SignalEditor />


      </div>
    </div>
  );
}