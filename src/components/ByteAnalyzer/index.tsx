// src/components/ByteAnalyzer/index.tsx
"use client";

import { useAnalyzerData } from './useAnalyzerData';
import SnifferTable from './SnifferTable';
import Sidebar from './Sidebar';
import ByteGrid from './ByteGrid';
import TranslationsTable from './TranslationsTable';
import FramesHistory from './FramesHistory';

export default function ByteAnalyzer() {
  const {
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
  } = useAnalyzerData();

  const handleEditLabel = (index: number) => {
    const current = currentTranslations[index]?.label || '';
    const newLabel = prompt(`Nome para Byte ${index}:`, current);
    if (newLabel !== null) {
      updateTranslation(index, 'label', newLabel.trim());
    }
  };

  return (
    <div className="space-y-5">
      <SnifferTable
        ids={filteredSnifferIds}
        framesByCanId={analyzer.framesByCanId}
        frequencies={analyzer.frequencies}
        selectedCanId={analyzer.selectedCanId}
        filter={snifferFilter}
        onFilterChange={setSnifferFilter}
        onSelect={selectCanId}
        onRefresh={refreshAnalyzer}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 min-h-[600px]">
        <Sidebar
          ids={filteredSidebarIds}
          framesByCanId={analyzer.framesByCanId}
          selectedCanId={analyzer.selectedCanId}
          search={sidebarSearch}
          onSearchChange={setSidebarSearch}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          interval={refreshInterval}
          onIntervalChange={setRefreshInterval}
          onRefresh={refreshAnalyzer}
          isLoading={isLoading}
          onSelect={selectCanId}
        />

        <div className="flex flex-col gap-5">
          <ByteGrid
            selectedCanId={analyzer.selectedCanId}
            latestBytes={latestBytes}
            prevBytes={prevBytes}
            translations={currentTranslations}
            onEditLabel={handleEditLabel}
          />
          
          <TranslationsTable
            selectedCanId={analyzer.selectedCanId}
            latestBytes={latestBytes}
            translations={currentTranslations}
            onUpdate={updateTranslation}
            onExport={exportTranslations}
          />
          
          <FramesHistory
            selectedCanId={analyzer.selectedCanId}
            frames={sortedFrames}
            formatTime={formatTime}
          />
        </div>
      </div>
    </div>
  );
}