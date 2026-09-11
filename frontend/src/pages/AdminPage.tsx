import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Loader2, Eye, Film, Check, RotateCcw, Save, Plus, AlertTriangle, Settings, Upload, Download, ArrowLeft, Camera, X, Copy, Power, ListTree, Edit2, Trash, ChevronUp, ChevronDown, AlignJustify } from 'lucide-react';
import useGameStore from '../store/gameStore';
import type { ModeId, QuestionType, GameMode } from '../types';
import {
  loadStoredMode,
  saveModeQuestions,
  exportAllAsJSON,
  importFromJSON,
  modeHasCustomData,
  compressImage,
  duplicateModeQuestions,
  type StoredQuestion,
} from '../utils/questionStorage';
import { 
  getRegistry, 
  saveRegistry, 
  createCustomMode, 
  duplicateMode, 
  deleteCustomMode, 
  resetBuiltInMode, 
  toggleModeEnabled, 
  updateModeMetadata, 
  reorderModes 
} from '../utils/modeRegistry';
import { getQuestionsForMode } from '../utils/questionStorage';
import { saveImage } from '../utils/indexedDB';
import { generateImageKey } from '../utils/migration';
import AsyncImage from '../components/AsyncImage';

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Panel — Question Content Manager (V2)
// ─────────────────────────────────────────────────────────────────────────────

function makeNewQuestion(modeId: ModeId, num: number, type: QuestionType): StoredQuestion {
  return {
    id:             `m_${modeId}_q${String(num).padStart(2, '0')}_${Date.now()}`,
    level:          1, // fallback for legacy compat
    modeId,
    questionNumber: num,
    type,
    answer:         '',
  };
}

/* ── Single question card ────────────────────────────────────────────────── */
function QuestionCard({
  q, index, onChange, onDelete,
}: {
  q: StoredQuestion;
  index: number;
  onChange: (updated: StoredQuestion) => void;
  onDelete: () => void;
}) {
  const fileRef     = useRef<HTMLInputElement>(null);
  const fullFileRef = useRef<HTMLInputElement>(null);
  const [dragging,        setDragging]        = useState(false);
  const [compressing,     setCompressing]     = useState(false);
  const [draggingFull,    setDraggingFull]    = useState(false);
  const [compressingFull, setCompressingFull] = useState(false);

  // ── Crop image handler ──────────────────────────────────────────────────
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCompressing(true);
    try {
      const base64 = await compressImage(file, 1280, 0.72);
      const imageKey = generateImageKey();
      await saveImage(imageKey, base64);
      onChange({ ...q, imageData: imageKey });
    } catch (e) {
      console.error('Image compression failed:', e);
      alert('Could not process that image. Try a different file.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  // ── Full image handler (eye questions only) ─────────────────────────────
  const handleFullImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCompressingFull(true);
    try {
      const base64 = await compressImage(file, 1280, 0.72);
      const imageKey = generateImageKey();
      await saveImage(imageKey, base64);
      onChange({ ...q, fullImageData: imageKey });
    } catch (e) {
      console.error('Full image compression failed:', e);
      alert('Could not process that image. Try a different file.');
    } finally {
      setCompressingFull(false);
    }
  };

  const handleDropFull = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingFull(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFullImageFile(file);
  };

  const imagePreview = q.imageData ?? q.imagePath;

  return (
    <div className="admin-q-card">
      {/* Header */}
      <div className="admin-q-card__header">
        <span className="admin-q-card__num">Q{String(index + 1).padStart(2, '00')}</span>
        <button
          className="admin-q-card__type"
          title="Click to change question type"
          style={{ cursor: 'pointer', border: '1px solid var(--border-soft)', borderRadius: '8px', padding: '2px 10px', background: 'rgba(155,89,182,0.08)', fontWeight: 700, fontSize: '0.75rem' }}
          onClick={() => {
            const types: QuestionType[] = ['frame', 'eye', 'dialogue', 'emoji'];
            const next = types[(types.indexOf(q.type) + 1) % types.length];
            onChange({ ...q, type: next });
          }}
        >{q.type} ↻</button>
        <button
          className="admin-q-card__delete"
          onClick={onDelete}
          title={`Remove question ${index + 1}`}
          id={`admin-delete-q${index + 1}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        ><X size={16} /></button>
      </div>

      {/* ── Eye crop image upload zone ───────────────────────────────────── */}
      {(q.type === 'frame' || q.type === 'eye') && (
        <>
          {q.type === 'eye' && (
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              👁 Eye Crop Image (shown during question)
            </div>
          )}
          <div
            className={`admin-img-drop ${dragging ? 'admin-img-drop--over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !compressing && fileRef.current?.click()}
            role="button"
            aria-label="Upload image"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            {compressing ? (
              <div className="admin-img-empty">
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                <span>Compressing image…</span>
              </div>
            ) : imagePreview ? (
              <div className="admin-img-preview-wrap">
                <AsyncImage
                  src={imagePreview}
                  alt="question preview"
                  className="admin-img-preview"
                  onError={e => {
                    const el = e.target as HTMLImageElement;
                    el.style.opacity = '0.25';
                  }}
                />
                <div className="admin-img-preview-overlay">🔄 Click / Drop to replace</div>
              </div>
            ) : (
              <div className="admin-img-empty">
                <div style={{ color: 'var(--primary)', opacity: 0.8 }}>
                  {q.type === 'eye' ? <Eye size={48} strokeWidth={1.5} /> : <Film size={48} strokeWidth={1.5} />}
                </div>
                <span>Click or drag &amp; drop image here</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  JPG · PNG · WEBP — auto-compressed
                </span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
            />
          </div>
          {q.imageData && (
            <button
              className="admin-clear-img-btn"
              onClick={() => onChange({ ...q, imageData: undefined })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trash2 size={16} /> Remove uploaded image (revert to default path)
            </button>
          )}
        </>
      )}

      {/* ── Full image upload zone (eye questions ONLY) ─────────────────── */}
      {q.type === 'eye' && (
        <>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b06fe0', marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            🖼 Full Image (shown after reveal)
          </div>
          <div
            className={`admin-img-drop ${draggingFull ? 'admin-img-drop--over' : ''}`}
            style={{ borderColor: q.fullImageData ? '#b06fe0' : undefined, minHeight: 100 }}
            onDragOver={e => { e.preventDefault(); setDraggingFull(true); }}
            onDragLeave={() => setDraggingFull(false)}
            onDrop={handleDropFull}
            onClick={() => !compressingFull && fullFileRef.current?.click()}
            role="button"
            aria-label="Upload full reveal image"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fullFileRef.current?.click()}
          >
            {compressingFull ? (
              <div className="admin-img-empty">
                <Loader2 className="animate-spin" size={32} style={{ color: '#b06fe0' }} />
                <span>Compressing full image…</span>
              </div>
            ) : q.fullImageData ? (
              <div className="admin-img-preview-wrap">
                <img
                  src={q.fullImageData}
                  alt="full reveal preview"
                  className="admin-img-preview"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.25'; }}
                />
                <div className="admin-img-preview-overlay">🔄 Click / Drop to replace</div>
              </div>
            ) : (
              <div className="admin-img-empty">
                <div style={{ color: '#b06fe0', opacity: 0.8 }}>
                  <Eye size={40} strokeWidth={1.5} />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>Full face image (optional)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Shown when answer is revealed · JPG · PNG · WEBP
                </span>
              </div>
            )}
            <input
              ref={fullFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFullImageFile(f); }}
            />
          </div>
          {q.fullImageData && (
            <button
              className="admin-clear-img-btn"
              onClick={() => onChange({ ...q, fullImageData: undefined })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trash2 size={16} /> Remove full reveal image
            </button>
          )}
        </>
      )}

      {/* Dialogue text */}
      {q.type === 'dialogue' && (
        <div className="admin-field-group">
          <label className="admin-label">Dialogue / Quote</label>
          <textarea
            className="admin-input admin-textarea"
            placeholder='"Enter the exact dialogue…"'
            value={q.dialogue ?? ''}
            rows={3}
            onChange={e => onChange({ ...q, dialogue: e.target.value })}
          />
        </div>
      )}

      {/* Emoji text */}
      {q.type === 'emoji' && (
        <div className="admin-field-group">
          <label className="admin-label">Emoji Sequence</label>
          <textarea
            className="admin-input admin-textarea"
            placeholder="💡 🎥 🎬"
            style={{ fontSize: '1.5rem', letterSpacing: '4px', textAlign: 'center' }}
            value={q.dialogue ?? ''}
            rows={2}
            onChange={e => onChange({ ...q, dialogue: e.target.value })}
          />
        </div>
      )}

      {/* Hint */}
      {(q.type === 'dialogue' || q.type === 'eye' || q.type === 'emoji') && (
        <div className="admin-field-group">
          <label className="admin-label">Hint (optional)</label>
          <input
            className="admin-input"
            type="text"
            placeholder={q.type === 'dialogue' ? 'e.g. Classic Bollywood comedy' : q.type === 'emoji' ? 'e.g. Action movie' : 'e.g. Bollywood actor'}
            value={q.hint ?? ''}
            onChange={e => onChange({ ...q, hint: e.target.value })}
          />
        </div>
      )}

      {/* Answer */}
      <div className="admin-field-group">
        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Answer</label>
        <input
          className="admin-input admin-input--answer"
          id={`admin-answer-q${index + 1}`}
          type="text"
          placeholder="Movie / celebrity name…"
          value={q.answer}
          onChange={e => onChange({ ...q, answer: e.target.value })}
        />
      </div>

      {/* Year (not for eye rounds) */}
      {q.type !== 'eye' && (
        <div className="admin-field-group">
          <label className="admin-label">Year (optional)</label>
          <input
            className="admin-input admin-input--year"
            type="number"
            placeholder="e.g. 2009"
            value={q.year ?? ''}
            min={1900}
            max={2030}
            onChange={e => onChange({ ...q, year: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      )}
    </div>
  );
}

/* ── Mode Panel (Questions for active mode) ──────────────────────────────── */
function ModePanel({ mode, onUpdate, onEdit, onDuplicate }: { mode: GameMode; onUpdate: () => void; onEdit: () => void; onDuplicate: () => void; }) {
  const [questions,  setQuestions]  = useState<StoredQuestion[]>([]);
  const [dirty,      setDirty]      = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const stored = loadStoredMode(mode.id);
    if (stored) {
      setQuestions(stored);
    } else {
      // Load defaults if built-in
      const defaults = getQuestionsForMode(mode.id);
      setQuestions(defaults.map((q, i) => ({
        id: q.id,
        level: q.level,
        modeId: mode.id,
        questionNumber: i + 1,
        type: q.type,
        answer: q.answer,
        imagePath: q.imagePath,
        fullImageData: q.fullImagePath,
        dialogue: q.dialogue,
        hint: q.hint,
        year: q.year,
      } as StoredQuestion)));
    }
    setDirty(false);
    setSaveStatus('idle');
  }, [mode.id]);

  const markDirty = () => { setDirty(true); setSaveStatus('idle'); };

  const update = (idx: number, updated: StoredQuestion) => {
    setQuestions(prev => { const n = [...prev]; n[idx] = updated; return n; });
    markDirty();
  };

  const remove = (idx: number) => {
    setQuestions(prev =>
      prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionNumber: i + 1 }))
    );
    markDirty();
  };

  const addQuestion = () => {
    // Determine type from template
    const type: QuestionType = (mode.templateId === 'eye' || mode.templateId === 'dialogue' || mode.templateId === 'frame' || mode.templateId === 'emoji')
      ? mode.templateId as QuestionType
      : 'frame';
    setQuestions(prev => [...prev, makeNewQuestion(mode.id, prev.length + 1, type)]);
    markDirty();
  };

  const handleSave = () => {
    const renumbered = questions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    saveModeQuestions(mode.id, renumbered);
    setQuestions(renumbered);
    setDirty(false);
    setSaveStatus('saved');
    onUpdate();
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleReset = () => {
    if (!confirm(
      `Clear Mode ${mode.name}?\n\n` +
      'This will remove all questions from the editor for this mode so you can start fresh.'
    )) return;
    setQuestions([]);
    setDirty(true);
    setSaveStatus('idle');
  };

  return (
    <div>
      {/* Mode header bar */}
      <div className="admin-level-header">
        <div className="admin-level-icon" style={{ background: mode.iconBg }}>
          {mode.icon}
        </div>
        <div>
          <div className="admin-level-title">{mode.name}</div>
          <div className="admin-level-sub">
            {mode.subtitle} &mdash; {questions.length} question{questions.length !== 1 ? 's' : ''}
            {modeHasCustomData(mode.id)
              ? <span style={{ color: 'var(--timer-green)', marginLeft: 8 }}>● Custom</span>
              : <span style={{ color: 'var(--text-muted)',  marginLeft: 8 }}>○ Defaults</span>
            }
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="admin-level-actions">
          <button
            className="btn-outline"
            onClick={onEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Settings size={16} /> Edit
          </button>
          <button
            className="btn-outline"
            onClick={onDuplicate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Copy size={16} /> Duplicate
          </button>
          <button
            className="btn-outline"
            onClick={handleReset}
            id={`admin-reset-mode-${mode.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Clear Mode
          </button>
          <button
            className="btn-primary"
            id={`admin-save-mode-${mode.id}`}
            onClick={handleSave}
            disabled={!dirty}
            style={{ minWidth: 130, opacity: dirty ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {dirty && <Save size={16} />}
            {!dirty && saveStatus !== 'saved' && <Check size={16} />}
            {saveStatus === 'saved' && <Check size={16} />}
            {saveStatus === 'saved' ? 'Saved!' : dirty ? 'Save Mode' : 'Up to date'}
          </button>
        </div>
      </div>

      {/* Question grid */}
      <div className="admin-q-grid">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            onChange={updated => update(i, updated)}
            onDelete={() => remove(i)}
          />
        ))}

        {questions.length < 15 && (
          <button
            className="admin-add-card"
            onClick={addQuestion}
            id={`admin-add-q-mode-${mode.id}`}
          >
            <Plus size={32} color="var(--primary)" />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {/* Unsaved warning */}
      {dirty && (
        <div className="admin-unsaved-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Unsaved changes — click <strong>Save Mode</strong> to apply to the game.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Modals
// ─────────────────────────────────────────────────────────────────────────────

function ManageModesModal({ modes, onClose, onUpdate }: { modes: GameMode[], onClose: () => void, onUpdate: () => void }) {
  const handleMove = (index: number, dir: -1 | 1) => {
    if (index + dir < 0 || index + dir >= modes.length) return;
    const newOrder = [...modes.map(m => m.id)];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + dir];
    newOrder[index + dir] = temp;
    reorderModes(newOrder);
    onUpdate();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600, width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ListTree size={24} /> Manage Modes</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)" /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
          {modes.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface)', borderRadius: 8, opacity: m.enabled ? 1 : 0.6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => handleMove(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><ChevronUp size={16} /></button>
                <button onClick={() => handleMove(i, 1)} disabled={i === modes.length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><ChevronDown size={16} /></button>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{m.name} <span style={{ fontSize: '0.7em', padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: 4, marginLeft: 4 }}>{m.source}</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.subtitle}</div>
              </div>
              
              <button 
                className="btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: 6 }}
                onClick={() => { toggleModeEnabled(m.id); onUpdate(); }}
              >
                <Power size={14} /> {m.enabled ? 'Disable' : 'Enable'}
              </button>

              {m.source === 'CUSTOM' ? (
                <button 
                  className="btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', display: 'flex', gap: 6 }}
                  onClick={() => {
                    if (confirm(`Delete custom mode "${m.name}"? This cannot be undone.`)) {
                      deleteCustomMode(m.id);
                      onUpdate();
                    }
                  }}
                >
                  <Trash size={14} /> Delete
                </button>
              ) : (
                <button 
                  className="btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: 6 }}
                  onClick={() => {
                    if (confirm(`Reset built-in mode "${m.name}" to defaults?`)) {
                      resetBuiltInMode(m.id);
                      onUpdate();
                    }
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModeEditorModal({ 
  mode, 
  title, 
  onSave, 
  onClose 
}: { 
  mode?: GameMode; 
  title: string; 
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [name, setName] = useState(mode?.name || '');
  const [subtitle, setSubtitle] = useState(mode?.subtitle || '');
  const [icon, setIcon] = useState(mode?.icon || '🎮');
  const [iconBg, setIconBg] = useState(mode?.iconBg || 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)');
  const [timer, setTimer] = useState(mode?.timerSeconds || 30);
  const [template, setTemplate] = useState(mode?.templateId || 'frame');

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500, width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)" /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Mode Name</label>
            <input type="text" className="join-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Custom Movie Quiz" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Subtitle</label>
            <input type="text" className="join-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Rounds 1-10 — 10 questions" />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Emoji Icon</label>
              <input type="text" className="join-input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🎮" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Icon Background (CSS)</label>
              <input type="text" className="join-input" value={iconBg} onChange={e => setIconBg(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Timer (seconds)</label>
              <input type="number" className="join-input" value={timer} onChange={e => setTimer(Number(e.target.value))} min={5} max={300} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Gameplay Template</label>
              <select className="join-input" value={template} onChange={e => setTemplate(e.target.value)} disabled={!!mode}>
                <option value="frame">Frame (Single Image)</option>
                <option value="eye">Eye (Crop → Full Reveal)</option>
                <option value="dialogue">Dialogue (Text Quote)</option>
                <option value="emoji">Emoji (Emoji Sequence)</option>
                <option value="year">Release Year</option>
              </select>
            </div>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ padding: '12px', marginTop: 8 }}
            onClick={() => {
              if (!name.trim()) return alert("Name is required");
              onSave({ name, subtitle, icon, iconBg, timerSeconds: timer, templateId: template });
            }}
          >
            {mode ? "Save Changes" : "Create Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Admin Page root ─────────────────────────────────────────────────────── */
export default function AdminPage() {
  const setPhase      = useGameStore(s => s.setPhase);
  const [modes, setModes] = useState<GameMode[]>([]);
  const [activeModeId, setActiveModeId] = useState<ModeId | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [importTick, setImportTick] = useState(0);

  // Modals state
  const [showManageModes, setShowManageModes] = useState(false);
  const [showCreateMode, setShowCreateMode] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);

  useEffect(() => {
    const registry = getRegistry();
    setModes(registry);
    if (!activeModeId && registry.length > 0) {
      setActiveModeId(registry[0].id);
    }
  }, [importTick, activeModeId]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const result = await importFromJSON(raw);
      if (result.ok) {
        setImportStatus(`✓ Imported ${result.modesImported} mode(s)`);
        if (result.newRegistry) {
          saveRegistry(result.newRegistry);
        }
        setImportTick(t => t + 1);
        setActiveModeId(null);
      } else {
        setImportStatus(`✗ ${result.error}`);
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = async () => {
    await exportAllAsJSON(getRegistry());
  };

  const activeMode = modes.find(m => m.id === activeModeId) || modes[0];

  return (
    <div className="admin-bg">
      {/* Top bar */}
      <header className="admin-topbar">
        <div 
          className="app-header__logo" 
          onClick={() => setPhase('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 0, cursor: 'pointer' }}
        >
          <span>Guess</span><span>the Frame</span>
          <span className="admin-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Settings size={14} /> Admin</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Import JSON */}
          <button
            className="btn-outline"
            id="admin-import-btn"
            onClick={() => importFileRef.current?.click()}
            title="Import questions from a previously exported JSON backup"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} /> Import JSON
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />

          {/* Export JSON */}
          <button
            className="btn-outline"
            id="admin-export-btn"
            onClick={handleExport}
            title="Download all question data as a JSON backup file"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} /> Export JSON
          </button>

          {/* Back to game */}
          <button
            className="btn-primary"
            id="admin-back-btn"
            onClick={() => setPhase('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Game
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Import/export status toast */}
        {importStatus && (
          <div
            className="admin-unsaved-bar"
            style={{
              background: importStatus.startsWith('✓')
                ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.08)',
              borderColor: importStatus.startsWith('✓')
                ? 'rgba(34,197,94,0.3)'  : 'rgba(239,68,68,0.25)',
              color: importStatus.startsWith('✓')
                ? 'var(--timer-green)'   : '#dc2626',
            }}
          >
            {importStatus}
          </div>
        )}

        {/* Info banner */}
        <div className="admin-info-banner">
          <Camera size={48} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div>
            <strong>How it works:</strong> Upload images by clicking or dragging them onto a question card.
            Images are auto-compressed before saving. Fill in the answer and click <strong>Save Mode</strong>.
            Changes are stored in your browser and used immediately — no file editing needed.
            For <strong>Guess The Eyes</strong>, upload the eye crop <em>and</em> the full face image for a dual reveal.
            Use <strong>Export JSON</strong> to create a backup and <strong>Import JSON</strong> to restore it.
            <br />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Resetting game state does not delete your admin questions.
            </span>
          </div>
        </div>

        <div className="admin-tabs" key={importTick}>
          {modes.map(mode => {
            const hasCustom = modeHasCustomData(mode.id);
            return (
              <button
                key={mode.id}
                id={`admin-tab-mode-${mode.id}`}
                className={`admin-tab ${activeMode?.id === mode.id ? 'admin-tab--active' : ''} ${!mode.enabled ? 'admin-tab--disabled' : ''}`}
                onClick={() => setActiveModeId(mode.id)}
                style={{ opacity: mode.enabled ? 1 : 0.5 }}
              >
                <span>{mode.icon}</span>
                <span>{mode.name}</span>
                {!mode.enabled && <Eye size={12} style={{ opacity: 0.5 }} />}
                {hasCustom && <span className="admin-tab-dot" title="Has custom questions" />}
              </button>
            );
          })}
          
          <button
            className="admin-tab"
            style={{ borderStyle: 'dashed', color: 'var(--primary)', fontWeight: 600 }}
            onClick={() => setShowCreateMode(true)}
          >
            <Plus size={16} /> New Mode
          </button>
          
          <div style={{ flex: 1 }} />
          
          <button
            className="admin-tab"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
            onClick={() => setShowManageModes(true)}
          >
            <ListTree size={16} /> Manage Modes
          </button>
        </div>

        {/* Active mode panel */}
        <div className="admin-panel-wrap">
          {activeMode && (
            <ModePanel 
              key={`${activeMode.id}-${importTick}`} 
              mode={activeMode} 
              onUpdate={() => setImportTick(t => t + 1)} 
              onEdit={() => setShowEditMode(true)}
              onDuplicate={() => {
                const newId = duplicateMode(activeMode.id);
                if (newId) {
                  duplicateModeQuestions(activeMode.id, newId);
                  setImportTick(t => t + 1);
                  setActiveModeId(newId);
                }
              }}
            />
          )}
        </div>
      </div>

      {showManageModes && (
        <ManageModesModal 
          modes={modes} 
          onClose={() => setShowManageModes(false)} 
          onUpdate={() => setImportTick(t => t + 1)} 
        />
      )}

      {showCreateMode && (
        <ModeEditorModal
          title="Create New Mode"
          onClose={() => setShowCreateMode(false)}
          onSave={(data) => {
            const newId = createCustomMode({ ...data, description: data.subtitle, countdownLabel: 'GET READY!' });
            setImportTick(t => t + 1);
            setActiveModeId(newId);
            setShowCreateMode(false);
          }}
        />
      )}

      {showEditMode && activeMode && (
        <ModeEditorModal
          mode={activeMode}
          title={`Edit ${activeMode.name}`}
          onClose={() => setShowEditMode(false)}
          onSave={(data) => {
            updateModeMetadata(activeMode.id, data);
            setImportTick(t => t + 1);
            setShowEditMode(false);
          }}
        />
      )}
    </div>
  );
}
