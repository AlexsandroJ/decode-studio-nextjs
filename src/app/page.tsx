"use client";

import { CANStudioProvider } from '@/context/CANStudioContext';
import TabsPanel from '@/components/TabsPanel';
import Toast from '@/components/Toast';

export default function Home() {
  return (
    <CANStudioProvider>
      <div className="min-h-screen bg-bg-dark text-text">
        <TabsPanel />
        <Toast />
      </div>
    </CANStudioProvider>
  );
}