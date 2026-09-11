"use client";

import { useCANStudio } from '@/context/CANStudioContext';

interface HeaderProps {
  onCheckHealth: () => void;
}

export default function Header({ onCheckHealth }: HeaderProps) {
  const { baseUrl, setBaseUrl } = useCANStudio();

  return (
    <header className="flex flex-wrap justify-between items-center gap-4 px-6 py-5 bg-bg-panel border border-border rounded-xl">
      <h1 className="text-xl text-text-bright flex items-center gap-3">
        <span className="bg-gradient-to-br from-accent to-purple w-10 h-10 rounded-lg flex items-center justify-center text-lg">
          🔧
        </span>
        Decoder Studio
      </h1>
      
    </header>
  );
}