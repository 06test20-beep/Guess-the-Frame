import React from 'react';
import { useStudioStore } from '../../store/studioStore';
import AsyncImage from '../AsyncImage';
import { Trash2, Wand2, Type } from 'lucide-react';

import { getQuestionsForMode, saveModeQuestions, modeHasCustomData, compressImage } from '../../utils/questionStorage';
import type { StoredQuestion } from '../../utils/questionStorage';
import { getImage, saveImage } from '../../utils/indexedDB';
import { applyDistortion } from '../../utils/distortion';
import { generateImageKey } from '../../utils/migration';
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

    const currentQuestions = modeHasCustomData(targetModeId) ? getQuestionsForMode(targetModeId) : [];
    const nextQNum = currentQuestions.length > 0 ? Math.max(...currentQuestions.map(q => q.questionNumber)) + 1 : 1;

    const newQuestions: StoredQuestion[] = drafts.map((d, idx) => ({
      id: d.id,
      level: 1, // Fallback for V1 compat
      modeId: targetModeId,
      questionNumber: nextQNum + idx,
      type: baseType,
      imageData: baseType === 'eye' ? d.fullDraftImageKey : d.draftImageKey,
      fullImageData: baseType === 'eye' ? d.draftImageKey : undefined,
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
  const fullFileRef = React.useRef<HTMLInputElement>(null);
  const [compressingFull, setCompressingFull] = React.useState(false);

  const handleFullImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCompressingFull(true);
    try {
      const base64 = await compressImage(file, 1280, 0.72);
      const key = generateImageKey();
      await saveImage(key, base64);
      onUpdate({ fullDraftImageKey: key });
    } catch (e) {
      console.error('Failed to compress full image:', e);
      alert('Could not process full image. Try a different file.');
    } finally {
      setCompressingFull(false);
    }
  };

  return (
    <div className="draft-card">
      {/* Main Image Preview (Crop) */}
      <div className="draft-img-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
          <div className="draft-img-inner" style={{ flex: 1, position: 'relative' }}>
            {draft.draftImageKey ? (
              <AsyncImage 
                src={draft.draftImageKey} 
                alt="Draft Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="draft-no-img">No Image</div>
            )}
            <div className="draft-img-badge" style={{ position: 'absolute', top: 4, left: 4 }}>
              #{index + 1}
            </div>
            {templateId === 'eye' && (
              <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: 4 }}>Full Face</div>
            )}
          </div>
          
          {/* Secondary Crop Preview for Eye Mode */}
          {templateId === 'eye' && (
            <div className="draft-img-inner" style={{ flex: 1, position: 'relative', borderStyle: 'dashed' }} onClick={() => !compressingFull && fullFileRef.current?.click()}>
              {compressingFull ? (
                <div className="draft-no-img">Compressing...</div>
              ) : draft.fullDraftImageKey ? (
                <AsyncImage 
                  src={draft.fullDraftImageKey} 
                  alt="Crop Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="draft-no-img" style={{ cursor: 'pointer', fontSize: '0.75rem', textAlign: 'center' }}>+ Eye Crop</div>
              )}
              <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: 4 }}>Crop</div>
              <input
                ref={fullFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFullImageUpload(f); }}
              />
            </div>
          )}
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
