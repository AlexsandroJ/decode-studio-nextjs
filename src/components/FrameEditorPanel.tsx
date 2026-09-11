"use client";

import FrameEditor from './FrameEditor/FrameEditor';
import RulesPanel from './FrameEditor/RulesPanel';
import { useCANActions } from '@/hooks/useCANActions';

export default function FrameEditorPanel() {
    const actions = useCANActions();

    return (
        <div className="space-y-4">


            {/* 🔥 LAYOUT 3/4 + 1/4 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

                {/* Coluna 1: FrameEditor (75% = 3/4) */}
                <div className="lg:col-span-3">
                    <FrameEditor
                        onLoadExample={actions.handleLoadExample}
                        onRandomize={actions.handleRandomize}
                        onSendFrameWithRules={actions.handleSendFrameWithRules}
                        onSendFrameOnly={actions.handleSendFrameOnly}
                    />
                </div>

                {/* Coluna 2: RulesPanel (25% = 1/4) */}
                <div className="lg:col-span-1">
                    {/* Lista com scroll próprio */}
                    <div className="overflow-y-auto max-h-[calc(100vh-200px)] pr-1 space-y-2">
                        <RulesPanel
                            onLoadFromApi={actions.handleLoadRulesFromApi}
                            onClear={actions.handleClearRules}
                            onSync={actions.handleSyncRules}
                            onLoadRule={actions.handleLoadRule}
                            onDeleteRule={actions.handleDeleteRule}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}