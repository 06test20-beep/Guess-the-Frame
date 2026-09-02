import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Loader2, RefreshCw, Eye, Film, Check, RotateCcw, Save, Plus, AlertTriangle, Settings, Upload, Download, ArrowLeft, Camera, X } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { LEVELS } from '../constants/game';
import type { LevelId, QuestionType } from '../types';
import {
  loadStoredLevel,
  saveLevel,
  clearLevel,
  exportAllAsJSON,
  importFromJSON,
  getDefaultStoredQuestions,
  levelHasCustomData,
  compressImage,
  type StoredQuestion,
} from '../utils/questionStorage';

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Panel — Question Content Manager
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_IDS: LevelId[] = [1, 2, 3, 4];

function makeNewQuestion(level: LevelId, num: number, type: QuestionType): StoredQuestion {
  return {
    id:             `l${level}q${String(num).padStart(2, '0')}_${Date.now()}`,
    level,
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
  const fileRef  = useRef<HTMLInputElement>(null);
  const [dragging,     setDragging]     = useState(false);
  const [compressing,  setCompressing]  = useState(false);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCompressing(true);
    try {
      const base64 = await compressImage(file, 1280, 0.72);
      onChange({ ...q, imageData: base64 });
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

  const imagePreview = q.imageData ?? q.imagePath;

  return (
    <div className="admin-q-card">
      {/* Header */}
      <div className="admin-q-card__header">
        <span className="admin-q-card__num">Q{String(index + 1).padStart(2, '0')}</span>
        <span className="admin-q-card__type">{q.type}</span>
        <button
          className="admin-q-card__delete"
          onClick={onDelete}
          title={`Remove question ${index + 1}`}
          id={`admin-delete-q${index + 1}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        ><X size={16} /></button>
      </div>

      {/* Image upload zone (frame / eye levels only) */}
      {(q.type === 'frame' || q.type === 'eye') && (
        <>
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
                <img
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
                <span>Click or drag & drop image here</span>
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

          {/* Remove image */}
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

      {/* Dialogue text (Level 4) */}
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

      {/* Hint */}
      {(q.type === 'dialogue' || q.type === 'eye') && (
        <div className="admin-field-group">
          <label className="admin-label">Hint (optional)</label>
          <input
            className="admin-input"
            type="text"
            placeholder={q.type === 'dialogue' ? 'e.g. Classic Bollywood comedy' : 'e.g. Bollywood actor'}
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

/* ── Level panel ─────────────────────────────────────────────────────────── */
function LevelPanel({ levelId }: { levelId: LevelId }) {
  const level = LEVELS[levelId];
  const [questions,  setQuestions]  = useState<StoredQuestion[]>([]);
  const [dirty,      setDirty]      = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Load on mount / level switch
  useEffect(() => {
    const stored = loadStoredLevel(levelId);
    setQuestions(stored ?? getDefaultStoredQuestions(levelId));
    setDirty(false);
    setSaveStatus('idle');
  }, [levelId]);

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
    const defaultType: QuestionType =
      levelId === 4 ? 'dialogue' : levelId === 3 ? 'eye' : 'frame';
    setQuestions(prev => [...prev, makeNewQuestion(levelId, prev.length + 1, defaultType)]);
    markDirty();
  };

  const handleSave = () => {
    const renumbered = questions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    saveLevel(levelId, renumbered);
    setQuestions(renumbered);
    setDirty(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleReset = () => {
    if (!confirm(
      `Reset Level ${levelId} to defaults?\n\n` +
      'This will remove all custom images and answers for this level only.\n' +
      'Other levels and game scores are not affected.'
    )) return;
    clearLevel(levelId);
    setQuestions(getDefaultStoredQuestions(levelId));
    setDirty(false);
    setSaveStatus('idle');
  };

  const saveBtnLabel =
    saveStatus === 'saved' ? '✓ Saved!' :
    dirty                  ? '💾 Save Level' :
                             '✓ Up to date';

  return (
    <div>
      {/* Level header bar */}
      <div className="admin-level-header">
        <div className="admin-level-icon" style={{ background: level.iconBg }}>
          {level.icon}
        </div>
        <div>
          <div className="admin-level-title">{level.title}</div>
          <div className="admin-level-sub">
            {level.subtitle} &mdash; {questions.length} question{questions.length !== 1 ? 's' : ''}
            {levelHasCustomData(levelId)
              ? <span style={{ color: 'var(--timer-green)', marginLeft: 8 }}>● Custom</span>
              : <span style={{ color: 'var(--text-muted)',  marginLeft: 8 }}>○ Defaults</span>
            }
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="admin-level-actions">
          <button
            className="btn-outline"
            onClick={handleReset}
            id={`admin-reset-level-${levelId}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Reset Level
          </button>
          <button
            className="btn-primary"
            id={`admin-save-level-${levelId}`}
            onClick={handleSave}
            disabled={!dirty}
            style={{ minWidth: 130, opacity: dirty ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {dirty && <Save size={16} />}
            {!dirty && saveStatus !== 'saved' && <Check size={16} />}
            {saveStatus === 'saved' && <Check size={16} />}
            {saveStatus === 'saved' ? 'Saved!' : dirty ? 'Save Level' : 'Up to date'}
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
            id={`admin-add-q-level-${levelId}`}
          >
            <Plus size={32} color="var(--primary)" />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {/* Unsaved warning */}
      {dirty && (
        <div className="admin-unsaved-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Unsaved changes — click <strong>Save Level</strong> to apply to the game.
        </div>
      )}
    </div>
  );
}

/* ── Admin Page root ─────────────────────────────────────────────────────── */
export default function AdminPage() {
  const setPhase      = useGameStore(s => s.setPhase);
  const [activeLevel, setActiveLevel] = useState<LevelId>(1);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Refresh tab dots after import
  const [importTick, setImportTick] = useState(0);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const result = importFromJSON(raw);
      if (result.ok) {
        setImportStatus(`✓ Imported Levels: ${result.levels.join(', ')}`);
        setImportTick(t => t + 1);
        // Reload current level panel
        setActiveLevel(prev => {
          // briefly switch away and back to force re-mount
          return prev;
        });
        // Force re-render of the panel
        setActiveLevel(0 as LevelId);
        setTimeout(() => setActiveLevel(result.levels[0] ?? 1), 50);
      } else {
        setImportStatus(`✗ ${result.error}`);
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported if needed
    e.target.value = '';
  };

  return (
    <div className="admin-bg">
      {/* Top bar */}
      <header className="admin-topbar">
        <div className="app-header__logo" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span>Guess</span><span> the Frame</span>
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
            onClick={exportAllAsJSON}
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
            Images are auto-compressed before saving. Fill in the answer and click <strong>Save Level</strong>.
            Changes are stored in your browser and used immediately — no file editing needed.
            Use <strong>Export JSON</strong> to create a backup and <strong>Import JSON</strong> to restore it.
            <br />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Resetting game state does not delete your admin questions.
            </span>
          </div>
        </div>

        {/* Level tabs */}
        <div className="admin-tabs" key={importTick}>
          {LEVEL_IDS.map(id => {
            const lv       = LEVELS[id];
            const hasCustom = levelHasCustomData(id);
            return (
              <button
                key={id}
                id={`admin-tab-level-${id}`}
                className={`admin-tab ${activeLevel === id ? 'admin-tab--active' : ''}`}
                onClick={() => setActiveLevel(id)}
              >
                <span>{lv.icon}</span>
                <span>Level {id} — {lv.title}</span>
                {hasCustom && <span className="admin-tab-dot" title="Has custom questions" />}
              </button>
            );
          })}
        </div>

        {/* Active level panel */}
        <div className="admin-panel-wrap">
          {activeLevel > 0 && <LevelPanel key={`${activeLevel}-${importTick}`} levelId={activeLevel} />}
        </div>
      </div>
    </div>
  );
}
