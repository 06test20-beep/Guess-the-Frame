import React from 'react';
import useGameStore from '../store/gameStore';
import { ArrowLeft } from 'lucide-react';

import BatchDropzone from '../components/studio/BatchDropzone';
import ContentFactory from '../components/studio/ContentFactory';
import StudioWorkspace from '../components/studio/StudioWorkspace';
import { useStudioStore } from '../store/studioStore';
import '../styles/studio.css';

export default function StudioPage() {
  const setPhase = useGameStore(s => s.setPhase);
  const drafts = useStudioStore(s => s.drafts);
  const [activeTab, setActiveTab] = React.useState<'factory' | 'manual'>('factory');

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
        <div className="studio-left" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
            <button 
              onClick={() => setActiveTab('factory')}
              style={{ flex: 1, padding: '8px', background: activeTab === 'factory' ? '#b06fe0' : 'transparent', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: activeTab === 'factory' ? 'bold' : 'normal' }}
            >
              Movie Factory
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              style={{ flex: 1, padding: '8px', background: activeTab === 'manual' ? '#b06fe0' : 'transparent', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: activeTab === 'manual' ? 'bold' : 'normal' }}
            >
              Manual Batch
            </button>
          </div>

          {activeTab === 'factory' ? (
            <ContentFactory />
          ) : (
            <div className="studio-dropzone-wrapper">
              <BatchDropzone />
            </div>
          )}
        </div>

        {/* Right Side: Workspace Queue */}
        <StudioWorkspace />
      </main>
    </div>
  );
}
