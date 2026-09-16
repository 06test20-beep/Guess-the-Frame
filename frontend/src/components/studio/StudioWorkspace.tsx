import React from 'react';
import { useStudioStore } from '../../store/studioStore';
import AsyncImage from '../AsyncImage';
import { Trash2, Wand2, Type } from 'lucide-react';

import { getQuestionsForMode, saveModeQuestions } from '../../utils/questionStorage';
import type { StoredQuestion } from '../../utils/questionStorage';
import { getImage } from '../../utils/indexedDB';
import { applyDistortion } from '../../utils/distortion';
import { getRegistry } from '../../utils/modeRegistry';
import type { GameMode, QuestionType } from '../../types';
import type { DraftItem } from '../../store/studioStore';

export default function StudioWorkspace() {
  const drafts = useStudioStore(s => s.drafts);
  const updateDraft = useStudioStore(s => s.updateDraft);
  const removeDraft = useStudioStore(s => s.removeDraft);
  const clearDrafts = useStudioStore(s => s.clearDrafts);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  
  const [targetModeId, setTargetModeId] = React.useState<string>('');
  const [modes, setModes] = React.useState<GameMode[]>([]);

  React.useEffect(() => {
    const registry = getRegistry();
    setModes(registry);
    if (registry.length > 0) setTargetModeId(registry[0].id);
  }, []);

  const handleApplyDistortion = async (draft: DraftItem) => {
    if (!draft.draftImageKey) return;
    setProcessingId(draft.id);
    try {
      const base64 = await getImage(draft.draftImageKey);
      if (base64) {
        const newKey = await applyDistortion(base64);
        updateDraft(draft.id, { draftImageKey: newKey });
      }
    } catch (e) {
      console.error('Distortion failed:', e);
      alert('Failed to apply distortion');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublish = () => {
    if (drafts.some(d => !d.metadata.answer.trim())) {
      alert('All items must have an Answer before publishing.');
      return;
    }
    const targetMode = modes.find(m => m.id === targetModeId);
    if (!targetMode) return;
    
    const baseType: QuestionType = (targetMode.templateId === 'eye' || targetMode.templateId === 'dialogue' || targetMode.templateId === 'frame' || targetMode.templateId === 'emoji')
      ? targetMode.templateId as QuestionType
      : 'frame';

    const currentQuestions = getQuestionsForMode(targetModeId);
    const nextQNum = currentQuestions.length > 0 ? Math.max(...currentQuestions.map(q => q.questionNumber)) + 1 : 1;

    const newQuestions: StoredQuestion[] = drafts.map((d, idx) => ({
      id: d.id,
      level: 1, // Fallback for V1 compat
      modeId: targetModeId,
      questionNumber: nextQNum + idx,
      type: baseType,
      imageData: d.draftImageKey,
      answer: d.metadata.answer,
      hint: d.metadata.hint,
      year: d.metadata.year,
    }));

    saveModeQuestions(targetModeId, [...currentQuestions, ...newQuestions]);
    clearDrafts();
    alert(`Successfully published ${newQuestions.length} items!`);
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className="studio-workspace">
      <div className="studio-ws-header">
        <h2 className="studio-ws-title">
          Staging Queue <span className="studio-ws-badge">{drafts.length} items</span>
        </h2>
        <div className="studio-ws-actions">
          <select 
            value={targetModeId} 
            onChange={e => setTargetModeId(e.target.value)}
            className="studio-select"
          >
            {modes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button 
            onClick={handlePublish}
            className="studio-btn-publish"
          >
            Publish Batch
          </button>
          <button 
            onClick={clearDrafts}
            className="studio-btn-clear"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="studio-scroll-area">
        {drafts.map((draft, idx) => (
          <DraftEditorCard 
            key={draft.id} 
            index={idx} 
            draft={draft} 
            templateId={modes.find(m => m.id === targetModeId)?.templateId ?? 'frame'}
            isProcessing={processingId === draft.id}
            onUpdate={(updates) => updateDraft(draft.id, updates)}
            onRemove={() => removeDraft(draft.id)}
            onProcessDistortion={() => handleApplyDistortion(draft)}
          />
        ))}
      </div>
    </div>
  );
}

function DraftEditorCard({ 
  draft, 
  index,
  templateId,
  isProcessing,
  onUpdate, 
  onRemove,
  onProcessDistortion
}: { 
  draft: DraftItem, 
  index: number,
  templateId: string,
  isProcessing: boolean,
  onUpdate: (u: Partial<DraftItem>) => void,
  onRemove: () => void,
  onProcessDistortion: () => void
}) {
  return (
    <div className="draft-card">
      {/* Image Preview */}
      <div className="draft-img-container">
        <div className="draft-img-inner">
          {draft.draftImageKey ? (
            <AsyncImage 
              src={draft.draftImageKey} 
              alt="Draft Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="draft-no-img">No Image</div>
          )}
        </div>
        <div className="draft-img-badge">
          #{index + 1}
        </div>
      </div>

      {/* Metadata Editor */}
      <div className="draft-meta">
        <div className="draft-meta-top">
          <button onClick={onRemove} className="draft-btn-trash">
            <Trash2 size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="draft-field">
            <label className="draft-label">
              <Type size={12} /> Answer
            </label>
            <input 
              type="text" 
              placeholder="Movie name..."
              value={draft.metadata.answer}
              onChange={e => onUpdate({ metadata: { ...draft.metadata, answer: e.target.value } })}
              className="draft-input"
            />
          </div>

          <div className="draft-row">
            <div className="draft-field">
              <label className="draft-label">
                Hint (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. 90s Classic"
                value={draft.metadata.hint ?? ''}
                onChange={e => onUpdate({ metadata: { ...draft.metadata, hint: e.target.value } })}
                className="draft-input"
              />
            </div>
            {templateId === 'frame' && (
              <button 
                disabled={isProcessing}
                className="draft-btn-distort"
                onClick={onProcessDistortion}
              >
                <Wand2 size={16} /> {isProcessing ? 'Processing...' : 'Distort'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
