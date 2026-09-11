"use client";
import { useCANStudio } from '@/context/CANStudioContext';

export default function Toast() {
  const { toast } = useCANStudio();

  if (!toast.visible) return null;

  const borderColor = toast.type === 'success' ? 'border-l-green' :
                      toast.type === 'error' ? 'border-l-red' : 'border-l-accent';

  return (
    <div className={`fixed bottom-5 right-5 bg-bg-elevated border border-border border-l-4 ${borderColor} px-5 py-3 rounded-md shadow-2xl z-[1000] text-text`}>
      {toast.message}
    </div>
  );
}