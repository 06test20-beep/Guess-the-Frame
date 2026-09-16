import React from 'react';
import useGameStore from '../store/gameStore';
import { ArrowLeft } from 'lucide-react';

import BatchDropzone from '../components/studio/BatchDropzone';
import StudioWorkspace from '../components/studio/StudioWorkspace';
import { useStudioStore } from '../store/studioStore';
import '../styles/studio.css';

export default function StudioPage() {
  const setPhase = useGameStore(s => s.setPhase);
  const drafts = useStudioStore(s => s.drafts);

  return (
    <div className="studio-page">
      {/* Header */}
      <header className="studio-header">
        <div className="studio-header-left">
          <button
            onClick={() => setPhase('admin')}
            className="studio-back-btn"
            title="Back to Admin"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="studio-header-title">Content Preparation Studio</h1>
            <p className="studio-header-sub">Batch ingest and process raw game assets</p>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="studio-main">
        {/* Left Side: Upload Zone */}
        <div className="studio-left">
          <div className="studio-dropzone-wrapper">
            <BatchDropzone />
          </div>
        </div>

        {/* Right Side: Workspace Queue */}
        <StudioWorkspace />
      </main>
    </div>
  );
}
